pub use sea_orm_migration::prelude::*;

mod m20220101_000001_create_table;
mod m20230618_062036_auth_data;
mod m20230625_103838_create_all_tables;
mod m20230705_080834_tag_deduplication;
mod m20230802_041755_create_notifs;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
    fn migrations() -> Vec<Box<dyn MigrationTrait>> {
        vec![
            Box::new(m20220101_000001_create_table::Migration),
            Box::new(m20230618_062036_auth_data::Migration),
            Box::new(m20230625_103838_create_all_tables::Migration),
            Box::new(m20230705_080834_tag_deduplication::Migration),
        ]
    }
}
