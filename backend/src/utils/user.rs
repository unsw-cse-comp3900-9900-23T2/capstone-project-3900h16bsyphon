use actix_web::{web::ReqData, HttpResponse};
use sea_orm::{DatabaseConnection, EntityTrait};

use crate::{models::TokenClaims, entities};

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