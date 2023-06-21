//! Entry point for the server routes

use actix_web::{get, post, HttpResponse, Responder};

use crate::prelude::in_release_build;
use crate::database_utils::establish_connection;

#[post("/echo")]
pub async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

pub async fn hello() -> impl Responder {
    establish_connection();
    "Hello there"
}

pub async fn res404() -> impl Responder {
    match in_release_build() {
        true => HttpResponse::NotFound().body("404 Not Found."),
        false => HttpResponse::NotFound().body("bruh did u forget to add the route"),
    }
}
