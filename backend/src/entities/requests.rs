//! `SeaORM` Entity. Generated by sea-orm-codegen 0.11.3

use super::sea_orm_active_enums::Statuses;
use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "requests")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub request_id: i32,
    pub zid: i32,
    pub queue_id: i32,
    pub title: String,
    pub description: String,
    pub order: i32,
    pub is_clusterable: bool,
    pub status: Option<Statuses>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::clusters::Entity")]
    Clusters,
    #[sea_orm(has_many = "super::logs::Entity")]
    Logs,
    #[sea_orm(has_many = "super::messages::Entity")]
    Messages,
    #[sea_orm(
        belongs_to = "super::queues::Entity",
        from = "Column::QueueId",
        to = "super::queues::Column::QueueId",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Queues,
    #[sea_orm(has_many = "super::request_images::Entity")]
    RequestImages,
    #[sea_orm(has_many = "super::request_tags::Entity")]
    RequestTags,
    #[sea_orm(
        belongs_to = "super::users::Entity",
        from = "Column::Zid",
        to = "super::users::Column::Zid",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Users,
}

impl Related<super::clusters::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Clusters.def()
    }
}

impl Related<super::logs::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Logs.def()
    }
}

impl Related<super::messages::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Messages.def()
    }
}

impl Related<super::queues::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Queues.def()
    }
}

impl Related<super::request_images::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RequestImages.def()
    }
}

impl Related<super::request_tags::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RequestTags.def()
    }
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Users.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
