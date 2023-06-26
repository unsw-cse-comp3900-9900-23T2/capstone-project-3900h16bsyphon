use actix_web::{middleware, web, App, HttpServer};
use actix_web_httpauth::middleware::HttpAuthentication;

pub mod database_utils;
pub mod entities;
pub mod prelude;
pub mod server;

use crate::prelude::*;

use server::auth::validator;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    startup_logger();
    std::env::var("SECRET").expect("SECRET must be set");
    register_org_admins().await;

    // Auth middleware
    let amw = HttpAuthentication::bearer(validator);

    HttpServer::new(move || {
        App::new()
            .wrap(middleware::Logger::default())
            .service(server::echo)
            .route("/", web::get().to(server::hello))
            .route("/auth/signup", web::post().to(server::auth::create_user))
            .route("/auth/login", web::post().to(server::auth::auth))
            .route(
                "/auth/hello",
                web::get().to(server::hello).wrap(amw.clone()),
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
