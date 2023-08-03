use actix_web::{
    http::StatusCode,
    web::{self, ReqData},
    HttpResponse,
};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{
    entities,
    models::{SyphonError, SyphonResult, TokenClaims},
    utils::{
        db::db,
        notifs::{all_notifs, all_unseen_notifs, mark_notifs_as_seen},
    },
};

pub async fn all_notifications(token: ReqData<TokenClaims>) -> SyphonResult<HttpResponse> {
    let notifs = all_notifs(token.username).await?;
    Ok(HttpResponse::Ok().json(notifs))
}

pub async fn unseen_notifications(token: ReqData<TokenClaims>) -> SyphonResult<HttpResponse> {
    let notifs = all_unseen_notifs(token.username).await?;
    Ok(HttpResponse::Ok().json(notifs))
}

pub async fn mark_notifications_as_seen(token: ReqData<TokenClaims>) -> SyphonResult<HttpResponse> {
    let notifs = mark_notifs_as_seen(token.username).await?;
    Ok(HttpResponse::Ok().json(notifs))
}

#[derive(Deserialize, Serialize, Clone, Debug)]
pub struct DismissNotifQuery {
    pub notif_id: i32,
}

pub async fn dismiss_notif(
    _token: ReqData<TokenClaims>,
    body: web::Json<DismissNotifQuery>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let body = body.into_inner();
    log::warn!("DISMISSING NOTIF: {:?}", body);

    let notif_existing = entities::notification::Entity::find_by_id(body.notif_id)
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!("No such notification"),
            StatusCode::NOT_FOUND,
        ))?;

    entities::notification::ActiveModel {
        seen: ActiveValue::Set(true),
        ..notif_existing.into()
    }
    .update(db)
    .await?;

    Ok(HttpResponse::Ok().json("Dismissed"))
}
