use actix_web::http::StatusCode;
use actix_web::web::{self, ReqData};
use actix_web::HttpResponse;
use chrono::Local;
use serde_json::json;

use crate::entities::sea_orm_active_enums::Statuses;
use crate::{entities, models, utils::db::db};
use futures::future::join_all;
use models::{
    AllRequestsForQueueBody, CreateRequest, CreateRequestResponse, EditRequestBody,
    PutRequestStatusBody, QueueRequest, RequestInfoBody, SyphonError, SyphonResult, Tag,
    TokenClaims,
};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter,
    QuerySelect,
};

pub async fn create_request(
    token: ReqData<TokenClaims>,
    body: web::Json<CreateRequest>,
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

    Ok(HttpResponse::Ok().json(CreateRequestResponse {
        request_id: insertion.request_id,
    }))
}

pub async fn edit_request(
    _token: ReqData<TokenClaims>,
    edit_request_body: web::Json<EditRequestBody>,
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

    Ok(HttpResponse::Ok().json("OK"))
}

pub async fn request_info_wrapper(
    token: ReqData<TokenClaims>,
    body: web::Query<RequestInfoBody>,
) -> SyphonResult<HttpResponse> {
    Ok(HttpResponse::Ok().json(request_info_not_web(token, body).await?))
}

pub async fn all_requests_for_queue(
    token: ReqData<TokenClaims>,
    body: web::Query<AllRequestsForQueueBody>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let body = body.into_inner();
    // Find all related requests
    let queue = entities::queues::Entity::find_by_id(body.queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(body.queue_id))?;

    let requests_future = entities::requests::Entity::find()
        .filter(entities::requests::Column::QueueId.eq(body.queue_id))
        .all(db)
        .await?
        .into_iter()
        .map(|req| req.request_id)
        .map(|request_id| {
            request_info_not_web(token.clone(), web::Query(RequestInfoBody { request_id }))
        });
    // Ignores DbErrors - No Panic. Also no 500 Return
    let mut requests = join_all(requests_future)
        .await
        .into_iter()
        .filter_map(Result::ok)
        .collect::<Vec<_>>();
    requests.sort_by(|a, b| a.order.cmp(&b.order));

    // sort by checking which requests are prio
    let is_priority = requests.iter().map(|request| {
        entities::queue_tags::Entity::find()
            .filter(entities::queue_tags::Column::IsPriority.eq(true))
            .filter(entities::queue_tags::Column::QueueId.eq(body.queue_id))
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

    let mut priority_request_zip: Vec<_> = requests.iter().zip(is_priority).collect();
    priority_request_zip.sort_by(|a, b| b.1.cmp(&a.1));
    let mut requests = priority_request_zip.iter().map(|v| v.0).collect::<Vec<_>>();
    // sort by the number of requests a user has made if this is set
    if queue.is_sorted_by_previous_request_count {
        requests.sort_by(|a, b| a.previous_requests.cmp(&b.previous_requests));
    }
    Ok(HttpResponse::Ok().json(requests))
}

/// TODO: This is really cringe, don't do whatever this is
/// There should be a way to move this into the models
pub async fn request_info_not_web(
    _token: ReqData<TokenClaims>,
    body: web::Query<RequestInfoBody>,
) -> SyphonResult<QueueRequest> {
    let db = db();
    let body = body.into_inner();
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
        .await
        .expect("Db broke");

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
        .await
        .expect("db broke?");

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
        tags,
    };

    Ok(request_value)
}

pub async fn disable_cluster(
    _token: ReqData<TokenClaims>,
    body: web::Json<RequestInfoBody>,
) -> HttpResponse {
    let db = db();
    let body = body.into_inner();

    // find request by id
    let db_request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await
        .map_err(|_e| {
            HttpResponse::InternalServerError().body("request id does not exist");
        })
        .unwrap()
        .unwrap();

    // update is_clusterable to false
    entities::requests::ActiveModel {
        is_clusterable: ActiveValue::Set(false),
        ..db_request.into()
    }
    .update(db)
    .await
    .expect("db broke");

    HttpResponse::Ok().json(())
}

/// # Returns
/// - Err(400) => request does not exist
pub async fn set_request_status(
    token: ReqData<TokenClaims>,
    body: web::Json<PutRequestStatusBody>,
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
        ..request.into()
    }
    .update(db)
    .await?;

    // Add log entry for updating request status
    entities::request_status_log::ActiveModel {
        log_id: ActiveValue::NotSet,
        request_id: ActiveValue::Set(body.request_id),
        tutor_id: ActiveValue::Set(token.username),
        status: ActiveValue::Set(body.status.clone()),
        event_time: ActiveValue::Set(Local::now().naive_local()),
    }
    .insert(db)
    .await?;


    Ok(HttpResponse::Ok().json(body))
}
