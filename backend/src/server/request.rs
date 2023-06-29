use actix_web::web::{self, ReqData};
use actix_web::HttpResponse;
use futures::executor::block_on;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityOrSelect, EntityTrait,
    QueryFilter, QuerySelect,
};
use serde::{Deserialize, Serialize};
use serde_json::{from_str, json};

use crate::entities::sea_orm_active_enums::Statuses;
use crate::{database_utils::db_connection, entities};

use super::auth::TokenClaims;
use super::user::validate_admin;

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FAQs {
    pub question: String,
    pub answer: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CreateRequest {
    pub zid: i32,
    pub queue_id: i32,
    pub title: String,
    pub description: String,
    pub order: i32,
    pub is_clusterable: bool,
    pub status: Option<Statuses>,
}

pub async fn create_request(req_body: String) -> HttpResponse {
    let request_creation: CreateRequest = from_str(&req_body).unwrap();
    let db: &DatabaseConnection = &db_connection().await;
    let request = entities::requests::ActiveModel {
        request_id: ActiveValue::NotSet,
        zid: ActiveValue::Set(request_creation.zid),
        queue_id: ActiveValue::Set(request_creation.queue_id),
        title: ActiveValue::Set(request_creation.title),
        description: ActiveValue::Set(request_creation.description),
        order: ActiveValue::Set(request_creation.order),
        is_clusterable: ActiveValue::Set(request_creation.is_clusterable),
        status: ActiveValue::Set(request_creation.status),
    };
    request.insert(db).await.expect("Db broke");
    HttpResponse::Ok().body("Request created")
}

pub async fn request_info(
    token: ReqData<TokenClaims>,
    body: web::Query<RequestInfoBody>,
) -> HttpResponse {
    log::debug!("Request info: {:#?}", body);
    let db: &DatabaseConnection = &db_connection().await;
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
    let db: &DatabaseConnection = &db_connection().await;
    let body = body.into_inner();
    if let Err(e) = validate_admin(&token, db).await {
        log::debug!("Not Admin: {:#?}", e);
        return e;
    };
    // Find all related requests
    // TODO dont do cringe loop of all
    let requests: Vec<_> = entities::requests::Entity::find()
        .filter(entities::requests::Column::QueueId.eq(body.queue_id))
        .all(db)
        .await
        .expect("Db broke")
        .into_iter()
        .map(|req| req.request_id)
        .map(|request_id| request_info(token.clone(), web::Query(RequestInfoBody { request_id  })))
        .map(|f| block_on(f))
        // .map(|res| res.pp)
        .collect();

    // HttpResponse::Ok().json()
    HttpResponse::Ok().body("todo")
}
