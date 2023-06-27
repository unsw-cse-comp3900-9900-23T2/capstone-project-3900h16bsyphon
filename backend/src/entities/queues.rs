//! `SeaORM` Entity. Generated by sea-orm-codegen 0.11.3

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "queues")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub queue_id: i32,
    pub start_time: DateTime,
    pub end_time: DateTime,
    pub is_visible: bool,
    pub is_available: bool,
    pub time_limit: Option<Time>,
    pub announcement: String,
    pub course_offering_id: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::course_offerings::Entity",
        from = "Column::CourseOfferingId",
        to = "super::course_offerings::Column::CourseOfferingId",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    CourseOfferings,
    #[sea_orm(has_many = "super::requests::Entity")]
    Requests,
    #[sea_orm(has_many = "super::tags::Entity")]
    Tags,
}

impl Related<super::course_offerings::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::CourseOfferings.def()
    }
}

impl Related<super::requests::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Requests.def()
    }
}

impl Related<super::tags::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tags.def()
    }
}

impl Related<super::users::Entity> for Entity {
    fn to() -> RelationDef {
        super::queue_tutors::Relation::Users.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::queue_tutors::Relation::Queues.def().rev())
    }
}

impl ActiveModelBehavior for ActiveModel {}
