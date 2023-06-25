use std::env;

use futures::executor::block_on;
use sea_orm::{Database, DatabaseConnection, DbErr};

async fn run() -> Result<DatabaseConnection, DbErr> {
    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
    let db = Database::connect(&database_url).await?;
    log::info!("connected to db: {}", database_url);
    Ok(db)
}

pub fn establish_connection() -> DatabaseConnection {
    let connection = block_on(run());
    connection.unwrap()
}
