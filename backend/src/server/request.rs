use std::fs;

use actix::Addr;
use actix_web::http::StatusCode;
use actix_web::web::{self, ReqData};
use actix_web::HttpResponse;
use base64::engine::general_purpose;
use base64::{engine, Engine};
use chrono::Utc;
use chrono_tz::Australia::Sydney;

use log::debug;
use serde_json::json;

use crate::entities;
use crate::entities::sea_orm_active_enums::Statuses;
use crate::models::auth::TokenClaims;
use crate::models::queue::Tag;
use crate::models::request::*;
use crate::models::{SyphonError, SyphonResult};
use crate::sockets::lobby::Lobby;
use crate::sockets::messages::HttpServerAction;
use crate::sockets::SocketChannels;
use crate::utils::db::db;
use crate::utils::queue::handle_possible_queue_capacity_overflow;
use crate::utils::request::move_request;
use crate::utils::unbox;
use futures::future::join_all;

use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter,
    QuerySelect,
};

use super::cluster::leave_cluster;

pub async fn create_request(
    token: ReqData<TokenClaims>,
    body: web::Json<CreateRequest>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let request_creation = body.into_inner();

    // find order number given queue id
    let req_count = entities::requests::Entity::find()
        .filter(entities::requests::Column::QueueId.eq(request_creation.queue_id))
        .count(db)
        .await
        .unwrap_or(0);
    let order = req_count + 1;

    // insert request itself
    let request = entities::requests::ActiveModel {
        request_id: ActiveValue::NotSet,
        zid: ActiveValue::Set(token.username),
        queue_id: ActiveValue::Set(request_creation.queue_id),
        title: ActiveValue::Set(request_creation.title),
        description: ActiveValue::Set(request_creation.description),
        order: ActiveValue::Set(order.try_into().unwrap()),
        is_clusterable: ActiveValue::Set(request_creation.is_clusterable),
        status: ActiveValue::Set(request_creation.status),
    };

    // tag insertion
    let insertion = request.insert(db).await?;
    let tag_insertion = request_creation.tags.into_iter().map(|tag| {
        entities::request_tags::ActiveModel {
            request_id: ActiveValue::Set(insertion.request_id),
            tag_id: ActiveValue::Set(tag),
        }
        .insert(db)
    });
    join_all(tag_insertion).await;

    // Add log entry for creating request
    entities::request_status_log::ActiveModel {
        log_id: ActiveValue::NotSet,
        request_id: ActiveValue::Set(insertion.request_id),
        tutor_id: ActiveValue::Set(token.username),
        status: ActiveValue::Set(Statuses::Unseen),
        event_time: ActiveValue::Set(Utc::now().with_timezone(&Sydney).naive_local()),
    }
    .insert(db)
    .await?;

    // save the image to the docker volume
    let file_loc = format!("/images/{}", insertion.request_id);
    fs::create_dir(&file_loc).map_err(|e| {
        log::error!("Could not create dir: {file_loc}");
        e
    })?;
    let engine = engine::GeneralPurpose::new(
        &base64::alphabet::STANDARD,
        general_purpose::GeneralPurposeConfig::new(),
    );
    let images_insertion = request_creation.files.into_iter().filter_map(|file| {
        let file_loc = format!("/images/{}/{}", insertion.request_id, file.file_name);
        fs::write(
            file_loc.as_str(),
            engine
                .decode(file.file_content.as_bytes())
                .expect("base64 decode failed"),
        )
        .map_err(|e| {
            log::error!("Error while writing image: {:?}", e);
        })
        .ok()?;
        Some(
            entities::request_images::ActiveModel {
                request_id: ActiveValue::Set(insertion.request_id),
                image_url: ActiveValue::Set(file_loc),
            }
            .insert(db),
        )
    });
    join_all(images_insertion).await;

    // Default actions that will always send
    let mut actions = vec![
        SocketChannels::Request(insertion.request_id),
        SocketChannels::QueueData(insertion.queue_id),
    ];

    log::debug!("Hitting overflow handle");
    if let Ok(Some(notif_actions)) =
        handle_possible_queue_capacity_overflow(insertion.queue_id).await
    {
        log::debug!("Is overflow action: {:?}", notif_actions);
        actions.extend(notif_actions);
    }

    log::debug!("Sending invalidate keys: {:?}", actions);
    lobby.do_send(HttpServerAction::InvalidateKeys(actions));

    Ok(HttpResponse::Ok().json(CreateRequestResponse {
        request_id: insertion.request_id,
    }))
}

pub async fn edit_request(
    _token: ReqData<TokenClaims>,
    edit_request_body: web::Json<EditRequestBody>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let edit_request_body = edit_request_body.into_inner();

    let existing_request = entities::requests::Entity::find_by_id(edit_request_body.request_id)
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!("request to edit cannot be found"),
            StatusCode::NOT_FOUND,
        ))?;

    // update request
    entities::requests::ActiveModel {
        title: ActiveValue::Set(edit_request_body.title),
        description: ActiveValue::Set(edit_request_body.description),
        is_clusterable: ActiveValue::Set(edit_request_body.is_clusterable),
        ..existing_request.clone().into()
    }
    .update(db)
    .await?;

    // delete all tags, then insert them again
    entities::request_tags::Entity::delete_many()
        .filter(entities::request_tags::Column::RequestId.eq(edit_request_body.request_id))
        .exec(db)
        .await?;

    // reinsert new tags
    let tag_insertion = edit_request_body.tags.into_iter().map(|tag_id| {
        entities::request_tags::ActiveModel {
            request_id: ActiveValue::Set(edit_request_body.request_id),
            tag_id: ActiveValue::Set(tag_id),
        }
        .insert(db)
    });

    join_all(tag_insertion).await;
    // delete all images, then insert them again
    entities::request_images::Entity::delete_many()
        .filter(entities::request_images::Column::RequestId.eq(edit_request_body.request_id))
        .exec(db)
        .await?;
    let file_loc = format!("/images/{}", edit_request_body.request_id);
    fs::remove_dir_all(&file_loc)?;
    fs::create_dir(&file_loc)?;
    let engine = engine::GeneralPurpose::new(
        &base64::alphabet::STANDARD,
        general_purpose::GeneralPurposeConfig::new(),
    );
    let images_insertion = edit_request_body.files.into_iter().map(|file| {
        let file_loc = format!(
            "/images/{}/{}",
            edit_request_body.request_id, file.file_name
        );
        fs::write(
            file_loc.as_str(),
            engine.decode(file.file_content.as_bytes()).unwrap(),
        )
        .unwrap();
        entities::request_images::ActiveModel {
            request_id: ActiveValue::Set(edit_request_body.request_id),
            image_url: ActiveValue::Set(file_loc),
        }
        .insert(db)
    });

    join_all(images_insertion).await;

    let action = HttpServerAction::InvalidateKeys(vec![
        SocketChannels::Request(edit_request_body.request_id),
        SocketChannels::QueueData(edit_request_body.queue_id),
    ]);
    lobby.do_send(action);

    Ok(HttpResponse::Ok().json("OK"))
}

pub async fn request_info_wrapper(
    web::Query(body): web::Query<RequestInfoBody>,
) -> SyphonResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(request_info_not_web(body).await?))
}

pub async fn all_requests_for_queue(
    web::Query(body): web::Query<AllRequestsForQueueBody>,
) -> SyphonResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(all_requests_for_queue_not_web(body.queue_id).await?))
}

pub async fn all_requests_for_queue_not_web(queue_id: i32) -> SyphonResult<Vec<QueueRequest>> {
    let db = db();
    // Find all related requests
    let queue = entities::queues::Entity::find_by_id(queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(queue_id))?;

    let requests = entities::requests::Entity::find()
        .filter(entities::requests::Column::QueueId.eq(queue_id))
        .all(db)
        .await?
        .into_iter()
        .map(|req| req.request_id)
        .map(|request_id| request_info_not_web(RequestInfoBody { request_id }));

    // Ignores DbErrors - No Panic. Also no 500 Return
    let mut requests = join_all(requests)
        .await
        .into_iter()
        .filter_map(Result::ok)
        .collect::<Vec<_>>();
    requests.sort_by(|a, b| a.order.cmp(&b.order));

    // sort by checking which requests are priority
    let is_priority = requests.iter().map(|request| {
        entities::queue_tags::Entity::find()
            .filter(entities::queue_tags::Column::IsPriority.eq(true))
            .filter(entities::queue_tags::Column::QueueId.eq(queue_id))
            .filter(
                entities::queue_tags::Column::TagId.is_in(request.tags.iter().map(|t| t.tag_id)),
            )
            .count(db)
    });
    let is_priority: Vec<_> = join_all(is_priority)
        .await
        .into_iter()
        .map(|r| r.expect("db broke"))
        .collect();

    let mut priority_request_zip: Vec<_> = requests.into_iter().zip(is_priority).collect();
    priority_request_zip.sort_by(|a, b| b.1.cmp(&a.1));
    let mut requests = priority_request_zip
        .into_iter()
        .map(|v| v.0)
        .collect::<Vec<_>>();
    // sort by the number of requests a user has made if this is set
    if queue.is_sorted_by_previous_request_count {
        requests.sort_by(|a, b| a.previous_requests.cmp(&b.previous_requests));
    }

    Ok(requests)
}

pub async fn all_requests_for_cluster(
    body: web::Query<AllRequestsForClusterBody>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let request_ids: Vec<i32> = entities::clusters::Entity::find()
        .column(entities::clusters::Column::RequestId)
        .filter(entities::clusters::Column::ClusterId.eq(body.cluster_id))
        .into_tuple()
        .all(db)
        .await?;

    let requests: Vec<_> = join_all(
        request_ids
            .into_iter()
            .map(|r| request_info_not_web(RequestInfoBody { request_id: r })),
    )
    .await
    .into_iter()
    .filter_map(Result::ok)
    .collect();
    Ok(HttpResponse::Ok().json(requests))
}

/// TODO: This is really cringe, don't do whatever this is
/// There should be a way to move this into the models
pub async fn request_info_not_web(body: RequestInfoBody) -> SyphonResult<QueueRequest> {
    let db = db();
    // Get the request from the database
    let db_request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await?;
    let request = db_request.ok_or(SyphonError::Json(
        "Request not found".into(),
        StatusCode::BAD_REQUEST,
    ))?;

    // User Data
    let user = entities::users::Entity::find_by_id(request.zid)
        .one(db)
        .await?
        .expect("token valid => user valid");

    let tags = entities::tags::Entity::find()
        .left_join(entities::requests::Entity)
        .left_join(entities::queues::Entity)
        .column(entities::tags::Column::TagId)
        .distinct_on([entities::tags::Column::TagId])
        .column(entities::tags::Column::Name)
        .column(entities::queue_tags::Column::IsPriority)
        .filter(entities::request_tags::Column::RequestId.eq(request.request_id))
        .filter(entities::queues::Column::QueueId.eq(request.queue_id))
        .into_model::<Tag>()
        .all(db)
        .await?;

    let course_offering_id = entities::queues::Entity::find_by_id(request.queue_id)
        .one(db)
        .await
        .expect("Db broke")
        .expect("queue doesn't exist")
        .course_offering_id;

    let previous_requests = entities::requests::Entity::find()
        .left_join(entities::queues::Entity)
        .filter(entities::requests::Column::Zid.eq(request.zid))
        .filter(
            entities::requests::Column::Status.eq(Statuses::Seen).and(
                // it needs to be an older queue or older request
                entities::queues::Column::QueueId
                    .lt(request.queue_id)
                    .or(entities::requests::Column::Order.lt(request.order)),
            ),
        )
        .filter(entities::queues::Column::CourseOfferingId.eq(course_offering_id))
        .count(db)
        .await?;

    let images: Vec<String> = entities::request_images::Entity::find()
        .select_only()
        .column(entities::request_images::Column::ImageUrl)
        .filter(entities::request_images::Column::RequestId.eq(request.request_id))
        .into_tuple()
        .all(db)
        .await?;

    let cluster_id: Option<i32> = entities::clusters::Entity::find()
        .select_only()
        .column(entities::clusters::Column::ClusterId)
        .filter(entities::clusters::Column::RequestId.eq(request.request_id))
        .into_tuple()
        .one(db)
        .await?;

    let request_value = QueueRequest {
        request_id: request.request_id,
        first_name: user.first_name,
        last_name: user.last_name,
        zid: request.zid,
        queue_id: request.queue_id,
        title: request.title,
        description: request.description,
        is_clusterable: request.is_clusterable,
        status: request.status,
        order: request.order,
        course_offering_id,
        previous_requests,
        cluster_id,
        tags,
        images,
    };

    Ok(request_value)
}

pub async fn disable_cluster(
    token: ReqData<TokenClaims>,
    body: web::Json<RequestInfoBody>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let body = body.into_inner();

    // find request by id
    let db_request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await?
        .ok_or(SyphonError::RequestNotExist(body.request_id))?;

    // update is_clusterable to false
    entities::requests::ActiveModel {
        is_clusterable: ActiveValue::Set(false),
        ..db_request.into()
    }
    .update(db)
    .await?;

    let cluster_id = entities::clusters::Entity::find()
        .select_only()
        .column(entities::clusters::Column::ClusterId)
        .filter(entities::clusters::Column::RequestId.eq(body.request_id))
        .into_tuple()
        .one(db)
        .await?;

    // remove from any existing cluster
    if let Some(cluster_id) = cluster_id {
        leave_cluster(
            token,
            actix_web::web::Json(LeaveClusterRequest {
                request_id: body.request_id,
                cluster_id,
            }),
            lobby,
        )
        .await?;
    }
    Ok(HttpResponse::Ok().json(()))
}

/// # Returns
/// - Err(400) => request does not exist
pub async fn set_request_status(
    token: ReqData<TokenClaims>,
    body: web::Json<PutRequestStatusBody>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let body = body.into_inner();
    let db = db();

    // Get Request
    let request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await?
        .ok_or(SyphonError::RequestNotExist(body.request_id))?;

    let course_offering_id = entities::queues::Entity::find_by_id(request.queue_id)
        .one(db)
        .await?
        .expect("Q exists because request exists")
        .course_offering_id;

    let tutor_model = entities::tutors::Entity::find_by_id((token.username, course_offering_id))
        .one(db)
        .await?;

    // Can edit self. Only tutors can edit others
    let _editing_self = match (token.username == request.zid, tutor_model) {
        (false, None) => return Err(SyphonError::Json(json!("Not Tutor"), StatusCode::FORBIDDEN)),
        (true, _) => true,
        (false, Some(_)) => false,
    };

    // Update Request
    entities::requests::ActiveModel {
        status: ActiveValue::Set(body.status.clone()),
        ..request.clone().into()
    }
    .update(db)
    .await?;

    // Add log entry for updating request status
    entities::request_status_log::ActiveModel {
        log_id: ActiveValue::NotSet,
        request_id: ActiveValue::Set(body.request_id),
        tutor_id: ActiveValue::Set(token.username),
        status: ActiveValue::Set(body.status.clone()),
        event_time: ActiveValue::Set(Utc::now().with_timezone(&Sydney).naive_local()),
    }
    .insert(db)
    .await?;

    // Invalidate the cache for the request and its queue
    let action = HttpServerAction::InvalidateKeys(vec![
        SocketChannels::Request(body.request_id),
        SocketChannels::QueueData(request.queue_id),
    ]);
    lobby.do_send(action);

    Ok(HttpResponse::Ok().json(body))
}

pub async fn request_summary(
    _token: ReqData<TokenClaims>,
    request_summary_body: web::Query<RequestSummaryBody>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let request_summary = request_summary_body.into_inner();

    log::info!("inside request summary {:?}", request_summary.request_id);

    let _existing_request = entities::requests::Entity::find_by_id(request_summary.request_id)
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!("request to edit cannot be found"),
            StatusCode::NOT_FOUND,
        ))?;

    // get log for the first start_time (will not exist if student resolved themselves)
    let start_log = entities::request_status_log::Entity::find()
        .select_only()
        .column(entities::request_status_log::Column::EventTime)
        .left_join(entities::users::Entity)
        .filter(entities::request_status_log::Column::RequestId.eq(request_summary.request_id))
        .filter(entities::request_status_log::Column::Status.eq(Statuses::Seeing))
        .into_model::<TimeStampModel>()
        .one(db)
        .await?;

    // get log for end_time
    let end_log = entities::request_status_log::Entity::find()
        .select_only()
        .column(entities::request_status_log::Column::EventTime)
        .left_join(entities::users::Entity)
        .filter(entities::request_status_log::Column::RequestId.eq(request_summary.request_id))
        .filter(entities::request_status_log::Column::Status.eq(Statuses::Seen))
        .into_model::<TimeStampModel>()
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!("request was never transitioned to 'Seen' status"),
            StatusCode::NOT_FOUND,
        ))?;

    // get search for logs, matching request id, get all tutor id joined with user table for their names
    let tutor_logs = entities::request_status_log::Entity::find()
        .select_only()
        .columns([
            entities::users::Column::FirstName,
            entities::users::Column::LastName,
            entities::users::Column::Zid,
        ])
        .distinct_on([entities::users::Column::Zid])
        .left_join(entities::users::Entity)
        .filter(entities::request_status_log::Column::RequestId.eq(request_summary.request_id))
        .into_model::<TutorSummaryDetails>()
        .all(db)
        .await?;

    let duration = start_log.as_ref().map(|time| {
        let diff = end_log.event_time.signed_duration_since(time.event_time);
        RequestDuration {
            hours: diff.num_hours(),
            minutes: diff.num_minutes(),
            seconds: diff.num_seconds(),
        }
    });

    let summary = RequestSummaryReturnModel {
        tutors: tutor_logs,
        start_time: start_log,
        end_time: end_log,
        duration,
    };

    Ok(HttpResponse::Ok().json(summary))
}

pub async fn move_request_ordering_up(
    token: ReqData<TokenClaims>,
    web::Json(body): web::Json<MoveRequestOrderingBody>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    move_request(token, body.request_id, MoveDirection::Up, unbox(lobby)).await
}

pub async fn move_request_ordering_down(
    token: ReqData<TokenClaims>,
    web::Json(body): web::Json<MoveRequestOrderingBody>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    move_request(token, body.request_id, MoveDirection::Down, unbox(lobby)).await
}

pub async fn delete_image(body: web::Query<DeleteImageQuery>) -> SyphonResult<HttpResponse> {
    debug!("deleting {}", body.image_name);
    let db = db();
    entities::request_images::Entity::delete_by_id((body.request_id, body.image_name.clone()))
        .exec(db)
        .await?;
    fs::remove_file(&body.image_name)?;
    Ok(HttpResponse::Ok().json(()))
}
