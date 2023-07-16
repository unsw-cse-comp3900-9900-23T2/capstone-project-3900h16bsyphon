//! `SeaORM` Entity. Generated by sea-orm-codegen 0.11.3

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "users")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub zid: i32,
    pub first_name: String,
    pub last_name: String,
    pub hashed_pw: String,
    pub is_org_admin: bool,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(has_many = "super::messages::Entity")]
    Messages,
    #[sea_orm(has_many = "super::request_status_log::Entity")]
    RequestStatusLog,
    #[sea_orm(has_many = "super::requests::Entity")]
    Requests,
}

impl Related<super::messages::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Messages.def()
    }
}

impl Related<super::request_status_log::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::RequestStatusLog.def()
    }
}

impl Related<super::requests::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Requests.def()
    }
}

impl Related<super::course_offerings::Entity> for Entity {
    fn to() -> RelationDef {
        super::tutors::Relation::CourseOfferings.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::tutors::Relation::Users.def().rev())
    }
}

impl Related<super::queues::Entity> for Entity {
    fn to() -> RelationDef {
        super::queue_tutors::Relation::Queues.def()
    }
    fn via() -> Option<RelationDef> {
        Some(super::queue_tutors::Relation::Users.def().rev())
    }
}

impl ActiveModelBehavior for ActiveModel {}
