use actix_web::{HttpResponse, web::ReqData, web};
use sea_orm::prelude::{DateTimeLocal};
use serde::{Serialize, Deserialize};

use super::auth::TokenClaims;

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FAQs{
    pub question: String,
    pub answer: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CreateQueueRequest{
    pub title: String,
    pub date: DateTimeLocal,
    pub time_start: DateTimeLocal,
    pub time_end: DateTimeLocal,

}

pub async fn create(
    token: ReqData<TokenClaims>,
    body: web::Json<CreateQueueRequest>) -> HttpResponse {

    HttpResponse::Ok().body("Queue created")
}



