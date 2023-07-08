use sea_orm_migration::{
    prelude::*,
    sea_orm::{EnumIter, Iterable},
    sea_query::extension::postgres::Type,
};

use crate::{m20220101_000001_create_table::Post, m20230618_062036_auth_data::UserData};

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // drop old post example
        manager
            .drop_table(Table::drop().table(Post::Table).to_owned())
            .await?;
        // drop old userdata table (wrong table name)
        manager
            .drop_table(Table::drop().table(UserData::Table).to_owned())
            .await?;
        // Users table
        manager
            .create_table(
                Table::create()
                    .table(Users::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Users::Zid)
                            .integer()
                            .not_null()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Users::FirstName).string().not_null())
                    .col(ColumnDef::new(Users::LastName).string().not_null())
                    .col(ColumnDef::new(Users::HashedPw).string().not_null())
                    .col(
                        ColumnDef::new(Users::IsOrgAdmin)
                            .boolean()
                            .default(false)
                            .not_null(),
                    )
                    .to_owned(),
            )
            .await?;

        // Course offerings table
        manager
            .create_table(
                Table::create()
                    .table(CourseOfferings::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(CourseOfferings::CourseOfferingId)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(
                        ColumnDef::new(CourseOfferings::CourseCode)
                            .string()
                            .not_null(),
                    )
                    .col(ColumnDef::new(CourseOfferings::Title).string().not_null())
                    .col(ColumnDef::new(CourseOfferings::TutorInviteCode).string())
                    .col(ColumnDef::new(CourseOfferings::StartDate).date().not_null())
                    .to_owned(),
            )
            .await?;

        // Tutors table
        manager
            .create_table(
                Table::create()
                    .table(Tutors::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Tutors::Zid).integer().not_null())
                    .col(ColumnDef::new(Tutors::CourseOfferingId).integer().not_null())
                    .col(ColumnDef::new(Tutors::IsCourseAdmin).boolean().not_null().default(false))
                    .foreign_key(
                        ForeignKey::create()
                            .from(Tutors::Table, Tutors::Zid)
                            .to(Users::Table, Users::Zid),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .from(Tutors::Table, Tutors::CourseOfferingId)
                            .to(CourseOfferings::Table, CourseOfferings::CourseOfferingId),
                    )
                    .primary_key(Index::create().col(Tutors::Zid).col(Tutors::CourseOfferingId))
                    .to_owned(),
            )
            .await?;

        // Queues table
        manager
            .create_table(
                Table::create()
                    .table(Queues::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Queues::QueueId)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Queues::StartTime).date_time().not_null())
                    .col(ColumnDef::new(Queues::EndTime).date_time().not_null())
                    .col(ColumnDef::new(Queues::IsVisible).boolean().not_null())
                    .col(ColumnDef::new(Queues::IsAvailable).boolean().not_null())
                    .col(ColumnDef::new(Queues::TimeLimit).integer())
                    .col(ColumnDef::new(Queues::Title).string().not_null())
                    .col(ColumnDef::new(Queues::Announcement).string().not_null())
                    .col(ColumnDef::new(Queues::CourseOfferingId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(CourseOfferings::Table, CourseOfferings::CourseOfferingId)
                            .from(Queues::Table, Queues::CourseOfferingId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(QueueTutors::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(QueueTutors::Zid).integer().not_null())
                    .col(ColumnDef::new(QueueTutors::QueueId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(Users::Table, Users::Zid)
                            .from(QueueTutors::Table, QueueTutors::Zid),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .to(Queues::Table, Queues::QueueId)
                            .from(QueueTutors::Table, QueueTutors::QueueId),
                    )
                    .primary_key(Index::create().col(QueueTutors::Zid).col(QueueTutors::QueueId))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Faqs::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Faqs::CourseOfferingId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(CourseOfferings::Table, CourseOfferings::CourseOfferingId)
                            .from(Faqs::Table, Faqs::CourseOfferingId),
                    )
                    .col(ColumnDef::new(Faqs::Answer).string().not_null())
                    .col(ColumnDef::new(Faqs::Question).string().not_null())
                    .col(
                        ColumnDef::new(Faqs::FaqId)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_type(
                Type::create()
                    .as_enum(Statuses::Table)
                    .values(Statuses::iter().skip(1))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Requests::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Requests::RequestId)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Requests::Zid).integer().not_null())
                    .col(ColumnDef::new(Requests::QueueId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(Users::Table, Users::Zid)
                            .from(Requests::Table, Requests::Zid),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .to(Queues::Table, Queues::QueueId)
                            .from(Requests::Table, Requests::QueueId),
                    )
                    .col(ColumnDef::new(Requests::Title).string().not_null())
                    .col(ColumnDef::new(Requests::Description).string().not_null())
                    .col(ColumnDef::new(Requests::Order).integer().not_null())
                    .col(ColumnDef::new(Requests::IsClusterable).boolean().not_null())
                    .col(ColumnDef::new(Requests::Status).enumeration(Statuses::Table, Statuses::iter().skip(1)))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(RequestStatusLog::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(RequestStatusLog::LogId)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(RequestStatusLog::RequestId).integer().not_null())
                    .col(ColumnDef::new(RequestStatusLog::Status).enumeration(Statuses::Table, Statuses::iter().skip(1)))
                    .col(ColumnDef::new(RequestStatusLog::EventTime).date_time().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(Requests::Table, Requests::RequestId)
                            .from(RequestStatusLog::Table, RequestStatusLog::RequestId),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Clusters::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(Clusters::RequestId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                        .to(Requests::Table, Requests::RequestId)
                        .from(Clusters::Table, Clusters::RequestId),
                    )
                    .col(ColumnDef::new(Clusters::ClusterId).integer().not_null())
                    .primary_key(Index::create().col(Clusters::ClusterId).col(Clusters::RequestId))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(RequestImages::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(RequestImages::RequestId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(Requests::Table, Requests::RequestId)
                            .from(RequestImages::Table, RequestImages::RequestId),
                    )
                    .col(ColumnDef::new(RequestImages::ImageUrl).string().not_null())
                    .primary_key(Index::create().col(RequestImages::RequestId).col(RequestImages::ImageUrl))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Tags::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Tags::TagId)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Tags::QueueId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(Queues::Table, Queues::QueueId)
                            .from(Tags::Table, Tags::QueueId),
                    )
                    .col(ColumnDef::new(Tags::Name).string().not_null())
                    .col(ColumnDef::new(Tags::IsPriority).boolean().not_null())
                    .to_owned(),
            )
            .await?;
        manager
            .create_table(
                Table::create()
                    .table(RequestTags::Table)
                    .if_not_exists()
                    .col(ColumnDef::new(RequestTags::RequestId).integer().not_null())
                    .col(ColumnDef::new(RequestTags::TagId).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(Requests::Table, Requests::RequestId)
                            .from(RequestTags::Table, RequestTags::RequestId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .to(Tags::Table, Tags::TagId)
                            .from(RequestTags::Table, RequestTags::TagId),
                    )
                    .primary_key(Index::create().col(RequestTags::RequestId).col(RequestTags::TagId))
                    .to_owned(),
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table(Messages::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Messages::MessageId)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Messages::RequestId).integer().not_null())
                    .col(ColumnDef::new(Messages::Zid).integer().not_null())
                    .foreign_key(
                        ForeignKey::create()
                            .to(Requests::Table, Requests::RequestId)
                            .from(Messages::Table, Messages::RequestId),
                    )
                    .foreign_key(
                        ForeignKey::create()
                            .to(Users::Table, Users::Zid)
                            .from(Messages::Table, Messages::Zid),
                    )
                    .col(ColumnDef::new(Messages::MessageText).string().not_null())
                    .col(ColumnDef::new(Messages::MessageTime).date_time().not_null())
                    .to_owned(),
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .create_table(
                Table::create()
                    .table(Post::Table)
                    .if_not_exists()
                    .col(
                        ColumnDef::new(Post::Id)
                            .integer()
                            .not_null()
                            .auto_increment()
                            .primary_key(),
                    )
                    .col(ColumnDef::new(Post::Title).string().not_null())
                    .col(ColumnDef::new(Post::Text).string().not_null())
                    .to_owned(),
            )
            .await?;
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
            .await?;
        manager
            .drop_table(Table::drop().table(Messages::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(RequestTags::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Tags::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(RequestImages::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Clusters::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(RequestStatusLog::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Requests::Table).to_owned())
            .await?;
        manager
            .drop_type(Type::drop().name(Statuses::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Faqs::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(QueueTutors::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Queues::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Tutors::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(CourseOfferings::Table).to_owned())
            .await?;
        manager
            .drop_table(Table::drop().table(Users::Table).to_owned())
            .await?;
        Ok(())
    }
}

/// Learn more at https://docs.rs/sea-query#iden
#[derive(Iden)]
enum Users {
    Table,
    Zid,
    FirstName,
    LastName,
    HashedPw,
    IsOrgAdmin,
}

#[derive(Iden)]
enum CourseOfferings {
    Table,
    CourseOfferingId,
    CourseCode,
    Title,
    StartDate,
    TutorInviteCode,
}

#[derive(Iden)]
enum Tutors {
    Table,
    Zid,
    CourseOfferingId,
    IsCourseAdmin
}

#[derive(Iden)]
pub enum Queues {
    Table,
    QueueId,
    StartTime,
    EndTime,
    IsVisible,
    IsAvailable,
    TimeLimit,
    CourseOfferingId,
    Announcement,
    Title,
}

#[derive(Iden)]
enum QueueTutors {
    Table,
    QueueId,
    Zid,
}

#[derive(Iden, EnumIter)]
pub enum Statuses {
    Table,
    Unseen,
    Seen,
    Seeing,
    NotFound,
}

#[derive(Iden)]
enum Faqs {
    Table,
    CourseOfferingId,
    Question,
    Answer,
    FaqId
}

#[derive(Iden)]
enum RequestStatusLog {
    Table,
    LogId,
    RequestId,
    EventTime,
    Status,
}

#[derive(Iden)]
enum Requests {
    Table,
    RequestId,
    Zid,
    Title,
    Description,
    Status,
    QueueId,
    Order,
    IsClusterable,
}

#[derive(Iden)]
enum Clusters {
    Table,
    ClusterId,
    RequestId,
}

#[derive(Iden)]
enum RequestImages {
    Table,
    RequestId,
    ImageUrl,
}

#[derive(Iden)]
enum RequestTags {
    Table,
    RequestId,
    TagId,
}

#[derive(Iden)]
enum Messages {
    Table,
    MessageId,
    RequestId,
    MessageText,
    Zid,
    MessageTime
}

#[derive(Iden)]
pub enum Tags {
    Table,
    TagId,
    QueueId,
    IsPriority,
    Name,
}
