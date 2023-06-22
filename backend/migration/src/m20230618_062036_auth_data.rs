use sea_orm_migration::prelude::*;

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
                    .col(ColumnDef::new(UserData::FirstName).string().not_null())
                    .col(ColumnDef::new(UserData::LastName).string().not_null())
                    .col(ColumnDef::new(UserData::HashedPw).string().not_null())
                    .col(
                        ColumnDef::new(UserData::IsOrgAdmin)
                            .boolean()
                            .default(false)
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
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
    FirstName,
    LastName,
    HashedPw,
    IsOrgAdmin,
}
