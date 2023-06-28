//! `SeaORM` Entity. Generated by sea-orm-codegen 0.11.3

use sea_orm::entity::prelude::*;
use serde::{Deserialize, Serialize};

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize, Deserialize)]
#[sea_orm(table_name = "clusters")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub request_id: i32,
    #[sea_orm(primary_key, auto_increment = false)]
    pub cluster_id: i32,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {
    #[sea_orm(
        belongs_to = "super::requests::Entity",
        from = "Column::RequestId",
        to = "super::requests::Column::RequestId",
        on_update = "NoAction",
        on_delete = "NoAction"
    )]
    Requests,
}

impl Related<super::requests::Entity> for Entity {
    fn to() -> RelationDef {
        Relation::Requests.def()
    }
}

impl ActiveModelBehavior for ActiveModel {}
