use std::env;

use futures::executor::block_on;
use sea_orm::{Database, DatabaseConnection, DbErr};

async fn run() -> Result<DatabaseConnection, DbErr> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(&database_url).await?;
    log::info!("connected to db: {}", database_url);
    Ok(db)
}

pub async fn db_connection() -> DatabaseConnection {
    run().await.expect("failed to connect to db")
}

pub fn db_connection_sync() -> DatabaseConnection {
    let connection = block_on(run());
    connection.unwrap()
}
