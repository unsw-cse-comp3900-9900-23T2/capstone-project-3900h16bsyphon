use actix_web::{web::ReqData, HttpResponse};

use crate::{
    models::{SyphonResult, TokenClaims},
    utils::notifs::{all_notifs, mark_notifs_as_seen, all_unseen_notifs},
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
