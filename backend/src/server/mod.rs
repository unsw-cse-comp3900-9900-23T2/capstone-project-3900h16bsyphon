//! Entry point for the server routes

use actix_web::{post, HttpResponse, Responder};

use crate::prelude::in_release_build;

pub mod auth;
pub mod cluster;
pub mod course;
pub mod faqs;
pub mod history;
pub mod logs;
pub mod queue;
pub mod request;
pub mod sockets;
pub mod user;

#[post("/echo")]
pub async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

pub async fn hello() -> impl Responder {
    "Hello there"
}

pub async fn res404() -> impl Responder {
    match in_release_build() {
        true => HttpResponse::NotFound().body("404 Not Found."),
        false => HttpResponse::NotFound().body("bruh did u forget to add the route"),
    }
}
