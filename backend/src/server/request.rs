use actix_web::{HttpResponse};
use lazy_static::__Deref;
use sea_orm::{ActiveModelTrait, ActiveValue};
use serde::{Serialize, Deserialize};
use serde_json::from_str;

use crate::database_utils::DB;
use crate::entities::sea_orm_active_enums::Statuses;
use crate::entities;

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FAQs{
    pub question: String,
    pub answer: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CreateRequest{
    pub zid: i32, 
    pub queue_id: i32,
    pub title: String,
    pub description: String,
    pub order: i32,
    pub is_clusterable: bool,
    pub status: Option<Statuses>
}

pub async fn create_request(req_body: String) -> HttpResponse {
    let request_creation: CreateRequest = from_str(&req_body).unwrap();
    let db = DB.deref();
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
