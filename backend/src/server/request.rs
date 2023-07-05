use actix_web::web::{self, ReqData};
use actix_web::HttpResponse;
use futures::executor::block_on;
use futures::future::join_all;
use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::test_is_user;
use crate::{entities, utils::db::db};

use crate::models::{CreateRequest, TokenClaims};

pub async fn create_request(token: ReqData<TokenClaims>, request_creation: web::Json<CreateRequest>) -> HttpResponse {
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
        }.insert(db)
    });
    join_all(tag_insertion).await;
    HttpResponse::Ok().json(json!({"request_id": insertion.request_id}))
}

pub async fn request_info(
    token: ReqData<TokenClaims>,
    body: web::Query<RequestInfoBody>,
) -> HttpResponse {
    log::debug!("Request info: {:#?}", body);
    let db = db();
    let body = body.into_inner();
    // Get the request from the database
    let db_request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await
        .expect("Db broke");
    let request = match db_request {
        None => return HttpResponse::NotFound().body("Request not found"),
        Some(req) => req,
    };
    if request.zid != token.username {
        return HttpResponse::Forbidden().body("You are not the owner of this request");
    }

    // User Data
    let user = entities::users::Entity::find_by_id(request.zid)
        .one(db)
        .await
        .expect("Db broke")
        .expect("token valid => user valid");
    let tags = entities::tags::Entity::find()
        .left_join(entities::requests::Entity)
        .filter(entities::request_tags::Column::RequestId.eq(request.request_id))
        .all(db)
        .await
        .expect("Db broke");
    let request_json = json!({
        "request_id": request.request_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "zid": request.zid,
        "queue_id": request.queue_id,
        "title": request.title,
        "description": request.description,
        "is_clusterable": request.is_clusterable,
        "status": request.status,
        "tags": tags
    });

    HttpResponse::Ok().json(request_json)
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestInfoBody {
    pub request_id: i32,
}

// given user -> give all requests
// given queue -> all requests

#[derive(Debug, Serialize, Deserialize)]
pub struct AllRequestsForQueueBody {
    pub queue_id: i32,
}

pub async fn all_requests_for_queue(
    token: ReqData<TokenClaims>,
    body: web::Query<AllRequestsForQueueBody>,
) -> HttpResponse {
    let db = db();
    let body = body.into_inner();
    test_is_user!(token, db);
    // Find all related requests
    // TODO dont do cringe loop of all
    let requests: Vec<_> = entities::requests::Entity::find()
        .filter(entities::requests::Column::QueueId.eq(body.queue_id))
        .all(db)
        .await
        .expect("Db broke")
        .into_iter()
        .map(|req| req.request_id)
        .map(|request_id| {
            request_info_not_web(token.clone(), web::Query(RequestInfoBody { request_id }))
        })
        .map(block_on)
        .map(|res| res.unwrap())
        .collect();

    // HttpResponse::Ok().json()
    HttpResponse::Ok().json(requests)
}

pub async fn request_info_not_web(
    _token: ReqData<TokenClaims>,
    body: web::Query<RequestInfoBody>,
) -> Result<serde_json::Value, HttpResponse> {
    log::debug!("Request info: {:#?}", body);
    let db = db();
    let body = body.into_inner();
    // Get the request from the database
    let db_request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await
        .expect("Db broke");
    let request = match db_request {
        None => return Err(HttpResponse::NotFound().body("Request not found")),
        Some(req) => req,
    };
    // if request.zid != token.username {
    //     return Err(HttpResponse::Forbidden().body("You are not the owner of this request"));
    // }

    // User Data
    let user = entities::users::Entity::find_by_id(request.zid)
        .one(db)
        .await
        .expect("Db broke")
        .expect("token valid => user valid");

    // TODO: Tags
    // TODO: previous requests
    let request_json = json!({
        "request_id": request.request_id,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "zid": request.zid,
        "queue_id": request.queue_id,
        "title": request.title,
        "description": request.description,
        // "order": request.order,
        "previous_requests": 5, // TODO
        "is_clusterable": request.is_clusterable,
        "status": request.status,
        "tags": []
    });

    Ok(request_json)
}
