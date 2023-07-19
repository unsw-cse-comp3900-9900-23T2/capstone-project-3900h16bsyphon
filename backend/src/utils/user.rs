use actix_web::{web::ReqData, HttpResponse};
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::entities;
use crate::models::{SyphonError, SyphonResult, TokenClaims};
use crate::utils::db::db;

pub async fn validate_user(
    token: &ReqData<TokenClaims>,
    db: &DatabaseConnection,
) -> Result<(), HttpResponse> {
    let creator_id = token.username;
    let user = entities::users::Entity::find_by_id(creator_id)
        .one(db)
        .await;

    match user {
        Ok(Some(_)) => Ok(()),
        Ok(None) => Err(HttpResponse::Forbidden().json("User Does Not Exist")),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            Err(HttpResponse::InternalServerError().json("Db Broke"))
        }
    }
}

pub async fn validate_admin(
    token: &ReqData<TokenClaims>,
    db: &DatabaseConnection,
) -> Result<(), HttpResponse> {
    let creator_id = token.username;
    let user = entities::users::Entity::find_by_id(creator_id)
        .one(db)
        .await;

    // Validate Admin Perms
    match user {
        Ok(Some(user)) => {
            if !user.is_org_admin {
                return Err(HttpResponse::Forbidden().json("Not Admin"));
            }
        }
        Ok(None) => return Err(HttpResponse::Forbidden().json("User Does Not Exist")),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            return Err(HttpResponse::InternalServerError().json("Db Broke"));
        }
    }
    Ok(())
}

pub async fn is_tutor_queue(queue_id: i32, zid: i32) -> SyphonResult<bool> {
    let db = db();
    let course_id = entities::queues::Entity::find_by_id(queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(queue_id))?
        .course_offering_id;

    Ok(entities::tutors::Entity::find_by_id((zid, course_id))
        .one(db)
        .await?
        .is_some())
}

pub async fn is_tutor_or_owns_request(request_id: i32, zid: i32) -> SyphonResult<bool> {
    let request = entities::requests::Entity::find_by_id(request_id)
        .one(db())
        .await?
        .ok_or(SyphonError::RequestNotExist(request_id))?;

    Ok(zid == request.zid || is_tutor_queue(request.queue_id, zid).await?)
}
