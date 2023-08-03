use futures::future::join_all;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, ModelTrait,
    QueryFilter,
};

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

pub async fn all_notifs(zid: i32) -> SyphonResult<Vec<entities::notification::Model>> {
    let db = db();
    let notifs = entities::users::Entity::find_by_id(zid)
        .one(db)
        .await?
        .expect("user will exist - called internally")
        .find_related(entities::notification::Entity)
        .all(db)
        .await?;

    Ok(notifs)
}

pub async fn mark_notifs_as_seen(zid: i32) -> SyphonResult<Vec<entities::notification::Model>> {
    let db = db();
    let notifs = all_notifs(zid).await?;

    let update_fut = notifs.clone().into_iter().map(|n| {
        entities::notification::ActiveModel {
            seen: ActiveValue::Set(true),
            ..n.into()
        }
        .update(db)
    });

    let updated_notifs = join_all(update_fut)
        .await
        .into_iter()
        .filter_map(Result::ok)
        .collect::<Vec<_>>();
    log::warn!("updated_notifs = {:?}", updated_notifs);

    Ok(updated_notifs)
}
