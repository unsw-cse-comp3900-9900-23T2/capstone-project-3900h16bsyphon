use std::env;

use sea_orm::{Database, DatabaseConnection, ConnectOptions};

lazy_static! {
    pub static ref DB: DatabaseConnection = {
        let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set");
        let mut opt = ConnectOptions::new(database_url);
        opt.max_connections(100).min_connections(5);
        async_std::task::block_on(async {
            Database::connect(opt).await.unwrap()
        })
    };
}
