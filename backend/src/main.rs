use actix_web::{web, App, HttpServer};

pub mod database_utils;
pub mod entities;
pub mod prelude;
pub mod server;

use crate::prelude::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    startup_logger();
    dotenv::dotenv().ok();

    HttpServer::new(|| {
        App::new()
            .service(server::echo)
            .route("/", web::get().to(server::hello))
            .route("/{tail:.*}", web::get().to(server::res404))
            .route("/{tail:.*}", web::post().to(server::res404))
    })
    .bind(host_port_from_env())?
    .run()
    .await?;

    log::info!("Server ended. Exiting Now");

    Ok(())
}
