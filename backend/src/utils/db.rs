use std::env;

use futures::executor::block_on;
use log::info;
use sea_orm::{Database, DatabaseConnection, ConnectOptions};

use lazy_static::__Deref;

lazy_static! {
    static ref DB: DatabaseConnection = {
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        info!("database url: {}", database_url);
        let mut opt = ConnectOptions::new(database_url);
        opt.max_connections(100).min_connections(5);
        block_on(async {
            Database::connect(opt).await.unwrap()
        })
    };
}

pub fn initialise_db() {
    lazy_static::initialize(&DB);
}

#[inline(always)]
pub fn db() -> &'static DatabaseConnection {
    DB.deref()
}
