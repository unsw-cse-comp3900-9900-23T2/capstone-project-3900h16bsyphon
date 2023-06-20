use sea_orm::entity::prelude::*;
use sea_orm_migration::{
    prelude::{ColumnDef, *},
    sea_orm::{DeriveActiveEnum, EnumIter, Schema},
};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        let db = manager.get_database_backend();
        let s = Schema::new(db);
        // s.create_enum_from_entity(db);
        manager
            .create_table(
                Table::create()
                    .table(UserData::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(UserData::Zid)
                            .integer()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(UserData::Name).string().not_null())
                    .col(ColumnDef::new(UserData::HashedPw).string().not_null())
                    // .col(
                    //     ColumnDef::new(UserData::AdminStatus)
                    //         .enumeration(
                    //             UserData::AdminStatus,
                    //             vec![UserType::SuperAdmin, UserType::Normal],
                    //         )
                    //         .not_null(),
                    // )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        // todo!();

        manager
            .drop_table(Table::drop().table(UserData::Table).to_owned())
            .await
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum UserData {
    Table,
    Zid,
    Name,
    HashedPw,
    AdminStatus,
}

#[derive(Iden, EnumIter, DeriveActiveEnum)]
#[sea_orm(rs_type = "i32", db_type = "Integer")]
enum UserType {
    #[sea_orm(num_value = 0)]
    SuperAdmin,
    #[sea_orm(num_value = 1)]
    Normal,
}
