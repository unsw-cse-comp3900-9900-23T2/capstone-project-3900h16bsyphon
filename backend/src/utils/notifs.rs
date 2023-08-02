use sea_orm::{EntityTrait, ModelTrait, QueryFilter, ColumnTrait};

use crate::{entities, models::SyphonResult};

use super::db::db;

pub async fn all_unseen_notifs(zid: i32) -> SyphonResult<Vec<entities::notification::Model>> {
    let db = db();
    let notifs = entities::users::Entity::find_by_id(zid)
        .one(db)
        .await?
        .expect("user will exist - called internally")
        .find_related(entities::notification::Entity)
        .filter(entities::notification::Column::Seen.eq(false))
        .all(db)
        .await?;

    Ok(notifs)
}
