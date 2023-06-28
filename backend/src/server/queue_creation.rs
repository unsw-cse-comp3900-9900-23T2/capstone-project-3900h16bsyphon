use actix_web::{HttpResponse};
use chrono::{DateTime, NaiveDateTime};
use sea_orm::{prelude::{DateTimeLocal}, DatabaseConnection, ActiveValue, ActiveModelTrait};
use serde::{Serialize, Deserialize};
use serde_json::from_str;

use crate::{database_utils::db_connection, entities};

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FAQs{
    pub question: String,
    pub answer: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CreateQueueRequest{
    pub title: String,
    pub time_start: NaiveDateTime,
    pub time_end: NaiveDateTime,
    pub tags: Vec<String>,
    pub is_visible: bool,
    pub is_available: bool,
    pub time_limit: Option<i32>,
    pub announcement: String,
    pub course_id: i32,
}

pub async fn create(req_body: String) -> HttpResponse {
    let queue_creation_request: CreateQueueRequest = from_str(&req_body).unwrap();
    let db: &DatabaseConnection = &db_connection().await;
    println!("Queue creation request: {:?}", queue_creation_request);
    let queue = entities::queues::ActiveModel {
        queue_id: ActiveValue::NotSet,
        title: ActiveValue::Set(queue_creation_request.title),
        start_time: ActiveValue::Set(queue_creation_request.time_start),
        end_time: ActiveValue::Set(queue_creation_request.time_end),
        is_visible: ActiveValue::Set(queue_creation_request.is_visible),
        is_available: ActiveValue::Set(queue_creation_request.is_available),
        time_limit: ActiveValue::Set(queue_creation_request.time_limit),
        course_offering_id: ActiveValue::Set(queue_creation_request.course_id),
        announcement: ActiveValue::Set(queue_creation_request.announcement),
    };

    let queue = queue.insert(db).await.expect("Db broke");
    HttpResponse::Ok().body("Queue created")
}



