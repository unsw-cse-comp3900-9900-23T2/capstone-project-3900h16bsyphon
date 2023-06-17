use actix_web::{web, App, HttpServer};

pub mod database_utils;
pub mod entities;
pub mod prelude;
pub mod server;

use crate::prelude::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    startup_logger();

    HttpServer::new(|| {
        App::new()
            .service(server::echo)
            .route("/", web::get().to(server::hello))
    })
    .bind(("0.0.0.0", 8000))?
    .run()
    .await?;

    log::info!("Server ended. Exiting Now");

    Ok(())
}
