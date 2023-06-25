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
    #[sea_orm(has_many = "super::course_admins::Entity")]
    CourseAdmins,
    #[sea_orm(has_many = "super::messages::Entity")]
    Messages,
    #[sea_orm(has_many = "super::queue_tutors::Entity")]
    QueueTutors,
    #[sea_orm(has_many = "super::requests::Entity")]
    Requests,
    #[sea_orm(has_many = "super::tutors::Entity")]
    Tutors,
}

impl Related<super::course_admins::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::CourseAdmins.def()
    }
}

impl Related<super::messages::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Messages.def()
    }
}

impl Related<super::queue_tutors::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::QueueTutors.def()
    }
}

impl Related<super::requests::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Requests.def()
    }
}

impl Related<super::tutors::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Tutors.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
