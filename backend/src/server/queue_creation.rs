use actix_web::{HttpResponse};
use sea_orm::prelude::{DateTimeLocal};
use serde::{Serialize, Deserialize};
use serde_json::from_str;

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FAQs{
    pub question: String,
    pub answer: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CreateQueueRequest{
    pub title: String,
    pub date: DateTimeLocal,
}

pub async fn create(req_body: String) -> HttpResponse {

    let queue_creation_request: CreateQueueRequest = from_str(&req_body).unwrap();
    HttpResponse::Ok().body("Queue created")
}



