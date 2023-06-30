use actix_cors::Cors;
use actix_web::{http, middleware, web, App, HttpServer};
use actix_web_httpauth::middleware::HttpAuthentication;

pub mod database_utils;
pub mod entities;
pub mod prelude;
pub mod server;

use crate::prelude::*;

use server::auth::validator;
#[macro_use]
extern crate lazy_static;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    startup_logger();
    std::env::var("SECRET").expect("SECRET must be set");
    register_org_admins().await;

    // Auth middleware
    let amw = HttpAuthentication::bearer(validator);

    HttpServer::new(move || {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin("http://127.0.0.1:3000")
            .allowed_origin("http://frontend:3000")
            .allowed_methods(vec!["GET", "POST", "PUT"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
            .allowed_header(http::header::CONTENT_TYPE)
            .expose_headers(&[actix_web::http::header::CONTENT_DISPOSITION])
            .supports_credentials()
            .max_age(3600);
        App::new()
            .wrap(middleware::Logger::default())
            .wrap(cors)
            .service(server::echo)
            .route("/", web::get().to(server::hello))
            .route("/auth/signup", web::post().to(server::auth::create_user))
            .route("/auth/login", web::post().to(server::auth::auth))
            .route(
                "/auth/hello",
                web::get().to(server::hello).wrap(amw.clone()),
            )
            .route(
                "/user/list",
                web::get().to(server::user::get_users).wrap(amw.clone())
            )
            .route(
                "/user/profile",
                web::get()
                    .to(server::user::get_user)
                    .wrap(amw.clone()),
            )
            .route(
                "/queue/create", 
                web::post().to(server::queue::create_queue)
                .wrap(amw.clone())
            )
            .route(
                "/queue/get_by_course", 
                web::get().to(server::queue::get_queues_by_course)
                .wrap(amw.clone())
            )
            .route(
                "/course/create_offering",
                web::post()
                    .to(server::course::create_offering)
                    .wrap(amw.clone()),
            )
            .route("/courses/get_tutored", 
                web::get().to(server::course::get_courses_tutored)
                .wrap(amw.clone())
            )
            .route(
                "/course/get",
                web::get()
                    .to(server::course::get_offering_by_id)
                    .wrap(amw.clone()),
            )
            .route(
                "/course/list",
                web::get()
                    .to(server::course::get_offerings)
                    .wrap(amw.clone()),
            )
            .route(
                "/course/join_with_tutor_link",
                web::put()
                    .to(server::course::join_with_tutor_link)
                    .wrap(amw.clone()),
            )
            .route(
                "/request/create",
                web::post().to(server::request::create_request).wrap(amw.clone()),
            )
            .route("/{tail:.*}", web::get().to(server::res404))
            .route("/{tail:.*}", web::post().to(server::res404))
    })
    .bind({
        let host = host_port_from_env();
        log::info!("Starting server at (Host, Port): {:?}", host);
        host
    })?
    .run()
    .await?;

    log::info!("Server ended. Exiting Now");

    Ok(())
}
