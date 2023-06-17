use actix_web::{
    get, post,
    web::{self, Json},
    App, HttpResponse, HttpServer, Responder,
};
use rand::{thread_rng, Rng};
use serde::Deserialize;

use crate::database_utils::establish_connection;
mod database_utils;
mod entities;
use entities::prelude::*;
use sea_orm::ActiveValue;
use sea_orm::*;

#[derive(Deserialize)]
struct UserPost {
    title: String,
    text: String,
}

#[get("/")]
async fn hello() -> impl Responder {
    HttpResponse::Ok().body("Hello world!")
}

#[post("/echo")]
async fn echo(req_body: String) -> impl Responder {
    HttpResponse::Ok().body(req_body)
}

#[post("/post")]
async fn add_post(req_body: Json<UserPost>) -> impl Responder {
    println!("got request!");
    let connection = establish_connection();
    println!("made connection!");
    let new: entities::post::ActiveModel = entities::post::ActiveModel {
        text: ActiveValue::Set(req_body.text.clone()),
        title: ActiveValue::Set(req_body.title.clone()),
        id: ActiveValue::Set(thread_rng().gen()),
    };
    Post::insert(new).exec(&connection).await.expect("go away");
    println!("inserted!");
    HttpResponse::Ok().body(req_body.text.clone())
}

#[get("/post")]
async fn get_users() -> impl Responder {
    let connection = establish_connection();
    let stuff = Post::find().all(&connection).await.expect("go away");
    web::Json(stuff) // same as return web::Json(results);
}

async fn manual_hello() -> impl Responder {
    HttpResponse::Ok().body("Hey there!")
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    startup_logger();

    HttpServer::new(|| {
        App::new()
            .service(hello)
            .service(echo)
            .service(get_users)
            .service(add_post)
            .route("/hey", web::get().to(manual_hello))
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await
}

fn startup_logger() {
    let (default_filter, default_write) = match in_release_build() {
        true => ("info", "always"),
        false => ("debug", "always"),
    };

    let env = env_logger::Env::default()
        .filter_or("MY_LOG", default_filter)
        .write_style_or("MY_LOG_STYLE", default_write);

    env_logger::init_from_env(env);

    log::trace!(
        "This is a trace log. If you are running a release build, this should NOT be visible by default."
    );
    log::debug!("This is a debug log. This should only be visible in debug builds.");
    log::info!("This is an info log. If you are in a release build, you should see [INFO] [WARN] and [ERROR] logs only.");
    log::warn!("This is a warning log. This should be visible in all builds.");
    log::error!("This is an error log. If you see this, something has gone horribly wrong.");

    log::info!("");
    log::info!("");
    log::info!("");
    log::info!("Logger set up successfully!");
}

#[cfg(debug_assertions)]
fn in_release_build() -> bool {
    false
}

#[cfg(not(debug_assertions))]
fn in_release_build() -> bool {
    true
}
