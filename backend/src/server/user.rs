use actix_web::{web::ReqData, HttpResponse};
use serde::{Deserialize, Serialize};

use crate::{entities, database_utils::db_connection};

use super::auth::TokenClaims;
use sea_orm::{EntityTrait, DatabaseConnection, QuerySelect, FromQueryResult, QueryFilter, ColumnTrait};

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct UserReturnModel {
    zid: i32,
    first_name: String,
    last_name: String,
}

pub async fn get_users(
    token: ReqData<TokenClaims>
) -> HttpResponse {
    let db = &db_connection().await;
    let error = validate_user(&token, db).await.err();
    if error.is_some() { return error.unwrap(); }
    // get all users from db
    let users = entities::users::Entity::find()
        .select_only()
        .column(entities::users::Column::Zid)
        .column(entities::users::Column::FirstName)
        .column(entities::users::Column::LastName)
        .filter(entities::users::Column::IsOrgAdmin.ne(true))
        .into_model::<UserReturnModel>()
        .all(db).await;

    // return users
    match users {
        Ok(users) => HttpResponse::Ok().json(users),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            HttpResponse::InternalServerError().json("Db Broke")
        }
    }
}

pub async fn validate_user(token: &ReqData<TokenClaims>, db: &DatabaseConnection) -> Result<(), HttpResponse> {
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

pub async fn validate_admin(token: &ReqData<TokenClaims>, db: &DatabaseConnection) -> Result<(), HttpResponse> {
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
