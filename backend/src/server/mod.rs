//! Entry point for the server routes

use actix_web::{post, HttpResponse, Responder};

#[post("/echo")]
pub async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

pub async fn hello() -> impl Responder {
    "Hello there"
}
