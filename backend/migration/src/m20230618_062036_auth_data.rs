use sea_orm_migration::prelude::*;
use strum::IntoEnumIterator;
use strum_macros::EnumIter;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
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
                    .col(
                        ColumnDef::new(UserData::Perms)
                            .enumeration(UserData::Perms, UserType::iter())
                            .not_null(),
                    )
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
    Perms,
}

#[derive(Iden, EnumIter)]
enum UserType {
    SuperAdmin,
    Normal,
}