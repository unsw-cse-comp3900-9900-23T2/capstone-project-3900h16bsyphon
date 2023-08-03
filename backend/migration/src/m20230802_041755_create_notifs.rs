use sea_orm_migration::prelude::*;

use crate::m20230625_103838_create_all_tables::Users;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        manager
            .create_table(
                Table::create()
                    .table(Notification::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Notification::NotifId)
                            .integer()
                            .auto_increment()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Notification::Zid).integer().not_null())
                    .col(ColumnDef::new(Notification::Content).string().not_null())
                    .col(ColumnDef::new(Notification::CreatedAt).date_time().not_null())
                    .col(ColumnDef::new(Notification::Seen).boolean().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .from(Notification::Table, Notification::Zid)
                            .to(Users::Table, Users::Zid),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(Table::drop().table(Notification::Table).to_owned())
            .await
    }
}

#[derive(Iden)]
enum Notification {
    Table,
    NotifId,
    Zid,
    Content,
    Seen,
    CreatedAt,
}
