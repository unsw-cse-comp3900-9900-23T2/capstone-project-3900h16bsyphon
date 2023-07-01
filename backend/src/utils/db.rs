use std::env;

use futures::executor::block_on;
use log::info;
use sea_orm::{ConnectOptions, Database, DatabaseConnection};

use lazy_static::__Deref;

lazy_static! {
    static ref DB: DatabaseConnection = {
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        info!("database url: {}", database_url);
        let opt = ConnectOptions::new(database_url)
            .max_connections(100)
            .min_connections(5)
            .to_owned();
        block_on(async { Database::connect(opt).await.unwrap() })
    };
}

pub fn initialise_db() {
    lazy_static::initialize(&DB);
}

#[inline(always)]
pub fn db() -> &'static DatabaseConnection {
    DB.deref()
}
