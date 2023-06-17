use actix_web::{middleware, web, App, HttpServer};

pub mod database_utils;
pub mod entities;
pub mod prelude;
pub mod server;

use crate::prelude::*;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenv::dotenv().ok();
    startup_logger();
    dbg!(std::env::var("DATABASE_URL").expect("SECRET must be set"));
    dbg!(std::env::var("SECRET").expect("SECRET must be set"));

    HttpServer::new(|| {
        App::new()
            .wrap(middleware::Logger::default())
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
