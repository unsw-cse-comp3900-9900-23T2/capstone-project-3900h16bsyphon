use actix_web::http::StatusCode;
use actix_web::web::{self, ReqData};
use actix_web::HttpResponse;

use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, QuerySelect};
use serde_json::json;

use crate::{entities, models, utils::db::db};
use models::{
    request::{AllRequestsForQueueBody, RequestInfoBody},
    CreateRequest, FetchCourseTagsReturnModel, RequestInfoReturn, SyphonError, SyphonResult,
    TokenClaims,
};

pub async fn create_request(
    token: ReqData<TokenClaims>,
    request_creation: web::Json<CreateRequest>,
) -> HttpResponse {
    let db = db();
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
    let insertion = request.insert(db).await.expect("Db broke");
    let tag_insertion = request_creation.tags.into_iter().map(|tag| {
        entities::request_tags::ActiveModel {
            request_id: ActiveValue::Set(insertion.request_id),
            tag_id: ActiveValue::Set(tag),
        }
        .insert(db)
    });
    join_all(tag_insertion).await;
    HttpResponse::Ok().json(json!({"request_id": insertion.request_id}))
}

pub async fn request_info_wrapper(
    token: ReqData<TokenClaims>,
    body: web::Query<RequestInfoBody>,
) -> SyphonResult<HttpResponse> {
    let res = request_info_not_web(token, body).await?;

    Ok(HttpResponse::Ok().json(res))
}

// given user -> give all requests
// given queue -> all requests
use futures::future::join_all;

pub async fn all_requests_for_queue(
    token: ReqData<TokenClaims>,
    body: web::Query<AllRequestsForQueueBody>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let body = body.into_inner();

    // Find all related requests
    // TODO: dont do cringe loop of all
    let requests = entities::requests::Entity::find()
        .filter(entities::requests::Column::QueueId.eq(body.queue_id))
        .all(db)
        .await?
        .into_iter()
        .map(|req| req.request_id)
        .map(|request_id| {
            request_info_not_web(token.clone(), web::Query(RequestInfoBody { request_id }))
        });

    let requests = join_all(requests)
        .await
        .into_iter()
        .filter_map(Result::ok)
        .collect::<Vec<_>>();

    Ok(HttpResponse::Ok().json(requests))
}

/// TODO: This is really cringe, don't do whatever this is
/// There should be a way to move this into the models
pub async fn request_info_not_web(
    _token: ReqData<TokenClaims>,
    body: web::Query<RequestInfoBody>,
) -> SyphonResult<RequestInfoReturn> {
    let db = db();
    let body = body.into_inner();
    // Get the request from the database
    let db_request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await?;
    let request = db_request.ok_or(SyphonError::Json(
        "Request not found".into(),
        StatusCode::NOT_FOUND,
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
        .distinct()
        .column(entities::tags::Column::Name)
        .column(entities::queue_tags::Column::IsPriority)
        .filter(entities::request_tags::Column::RequestId.eq(request.request_id))
        .into_model::<FetchCourseTagsReturnModel>()
        .all(db)
        .await?;

    Ok(RequestInfoReturn {
        request_id: request.request_id,
        first_name: user.first_name,
        last_name: user.last_name,
        zid: request.zid,
        queue_id: request.queue_id,
        title: request.title,
        description: request.description,
        is_clusterable: request.is_clusterable,
        status: request.status,
        tags: tags,
    })
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

    HttpResponse::Ok().json({})
}
