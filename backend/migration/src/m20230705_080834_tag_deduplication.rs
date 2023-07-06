use sea_orm_migration::prelude::*;

use crate::m20230625_103838_create_all_tables::{Tags, Queues};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        manager
            .alter_table(
                Table::alter()
                    .table(Tags::Table)
                    .drop_column(Tags::QueueId)
                    .drop_column(Tags::IsPriority)
                    .to_owned(),
        ).await?;

        manager
        .create_table(
            Table::create()
            .table(QueueTags::Table)
            .if_not_exists()
            .col(ColumnDef::new(QueueTags::TagId).integer().not_null())
            .col(ColumnDef::new(QueueTags::QueueId).integer().not_null())
            .col(ColumnDef::new(QueueTags::IsPriority).boolean().not_null())
            .foreign_key(
                ForeignKey::create()
                .from(QueueTags::Table, QueueTags::TagId)
                .to(Tags::Table, Tags::TagId),
            )
            .foreign_key(
                ForeignKey::create()
                .from(QueueTags::Table, QueueTags::QueueId)
                .to(Queues::Table, Queues::QueueId),
            )
            .primary_key(Index::create().col(QueueTags::QueueId).col(QueueTags::TagId))
            .to_owned()
        )
        .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
                .alter_table(Table::alter()
                .add_column_if_not_exists(
                    ColumnDef::new(Tags::QueueId)
                        .integer()
                        .not_null(),
                )
                .add_foreign_key(TableForeignKey::new()
                    .from_tbl(Queues::Table)
                    .from_col(Queues::QueueId)
                    .to_tbl(Tags::Table)
                    .to_col(Tags::QueueId)
                )
                .add_column(ColumnDef::new(Tags::IsPriority).boolean().not_null())
            .to_owned())
            .await
    }
}

#[derive(Iden)]
enum QueueTags {
    Table,
    TagId,
    QueueId,
    IsPriority,
}
