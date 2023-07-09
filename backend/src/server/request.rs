use actix_web::http::StatusCode;
use actix_web::web::{self, ReqData};
use actix_web::HttpResponse;
use serde_json::json;

use crate::models::request::EditRequestBody;
use crate::{entities, models, utils::db::db};
use models::request::{AllRequestsForQueueBody, RequestInfoBody};

use futures::future::join_all;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, QuerySelect};

use crate::models::{
    CreateRequest, CreateRequestResponse, QueueRequest, SyphonError, SyphonResult, Tag, TokenClaims,
};

pub async fn create_request(
    token: ReqData<TokenClaims>,
    request_creation: web::Json<CreateRequest>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    // insert request itself
    let request_creation = request_creation.into_inner();
    let request = entities::requests::ActiveModel {
        request_id: ActiveValue::NotSet,
        zid: ActiveValue::Set(token.username),
        queue_id: ActiveValue::Set(request_creation.queue_id),
        title: ActiveValue::Set(request_creation.title),
        description: ActiveValue::Set(request_creation.description),
        order: ActiveValue::Set(1), // TODO: unhardcode
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
    let is_priority = entities::tags::Entity::find()
        .left_join(entities::queues::Entity)
        .right_join(entities::requests::Entity)
        .filter(entities::request_tags::Column::RequestId.eq(insertion.request_id))
        .filter(entities::queue_tags::Column::IsPriority.eq(true))
        .filter(entities::queue_tags::Column::QueueId.eq(insertion.queue_id))
        .one(db)
        .await?;
    if is_priority.is_some() {
        entities::requests::ActiveModel {
            order: ActiveValue::Set(0),
            ..entities::requests::ActiveModel::from(insertion.clone())
        }
        .update(db)
        .await?;
    }

    Ok(HttpResponse::Ok().json(CreateRequestResponse {
        request_id: insertion.request_id,
    }))
}


pub async fn edit_request(
    _token: ReqData<TokenClaims>,
    edit_request_body: web::Json<EditRequestBody>,
) -> SyphonResult<HttpResponse> {
    let db = db();

    log::info!("Edit student request: {:?}", edit_request_body);
    let edit_request_body = edit_request_body.into_inner();

    let existing_request = entities::requests::Entity::find_by_id(edit_request_body.request_id)
        .one(db)
        .await 
        .expect("Db broke");

    if existing_request.is_none() {
        return Err(SyphonError::Json(
            json!("request to edit cannot be found"), 
            StatusCode::NOT_FOUND
        ));
    }

    // update request 
    let update_result = entities::requests::ActiveModel {
        title: ActiveValue::Set(edit_request_body.title),
        description: ActiveValue::Set(edit_request_body.description),
        is_clusterable: ActiveValue::Set(edit_request_body.is_clusterable),
        ..existing_request.clone().unwrap().into()
    }
    .update(db)
    .await
    .expect("Db broke");

    // delete all tags, then insert them again
    entities::request_tags::Entity::delete_many()
        .filter(entities::request_tags::Column::RequestId.eq(edit_request_body.request_id))
        .exec(db)
        .await
        .expect("Db broke");

    // reinsert new tags
    let tag_insertion = edit_request_body.tags.into_iter().map(|tag_id| {
        entities::request_tags::ActiveModel {
            request_id: ActiveValue::Set(edit_request_body.request_id),
            tag_id: ActiveValue::Set(tag_id),
        }
        .insert(db)
    });

    // handle priority tag logic
    join_all(tag_insertion).await;
    let is_priority = entities::tags::Entity::find()
        .left_join(entities::queues::Entity)
        .right_join(entities::requests::Entity)
        .filter(entities::request_tags::Column::RequestId.eq(edit_request_body.request_id))
        .filter(entities::queue_tags::Column::IsPriority.eq(true))
        .filter(entities::queue_tags::Column::QueueId.eq(edit_request_body.queue_id))
        .one(db)
        .await?;
    if is_priority.is_some() {
        entities::requests::ActiveModel {
            order: ActiveValue::Set(0),
            ..entities::requests::ActiveModel::from(update_result.clone())
        }
        .update(db)
        .await?;
    }

    Ok(HttpResponse::Ok().json("OK"))
}

pub async fn request_info_wrapper(
    token: ReqData<TokenClaims>,
    body: web::Query<RequestInfoBody>,
) -> SyphonResult<HttpResponse> {
    let res: QueueRequest = request_info_not_web(token, body).await?;

    Ok(HttpResponse::Ok().json(res))
}

// given user -> give all requests
// given queue -> all requests

pub async fn all_requests_for_queue(
    token: ReqData<TokenClaims>,
    body: web::Query<AllRequestsForQueueBody>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let body = body.into_inner();
    // Find all related requests
    // TODO: dont do cringe loop of all
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
    let request = match db_request {
        None => {
            return Err(SyphonError::Json(
                "Request not found".into(),
                StatusCode::BAD_REQUEST,
            ))
        }
        Some(req) => req,
    };

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
