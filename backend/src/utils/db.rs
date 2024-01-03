use std::env;

use futures::executor::block_on;
use sea_orm::{ConnectOptions, Database, DatabaseConnection};

use lazy_static::__Deref;

lazy_static! {
    static ref DB: DatabaseConnection = {
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let opt = ConnectOptions::new(database_url)
            .max_connections(100)
            .min_connections(5)
            .to_owned();
        // # Safety:
        // Happens only during initialisation.
        // No other threads are running.
        // We force initialisation to happen in main, before other futures
        // can be created.
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
