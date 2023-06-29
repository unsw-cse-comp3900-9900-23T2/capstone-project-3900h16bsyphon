use actix_web::{web, HttpResponse, Responder};

use actix_web_httpauth::extractors::basic::BasicAuth;

use hmac::{Hmac, Mac};
use jwt::SignWithKey;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serde_json::json;
use sha2::Sha256;

use crate::{
    database_utils::db_connection, entities, models::auth::CreateUserBody,
    models::auth::TokenClaims, SECRET, utils::auth::hash_pass,
};
use entities::users;

/// Hit this endpoint with BasicAuth info to get a BearerAuth token
/// Use that token in the Authorization header to access other endpoints
pub async fn auth(credentials: BasicAuth) -> impl Responder {
    let pass = credentials.password();
    let zid = match CreateUserBody::verify_zid(credentials.user_id()) {
        Ok(zid) => zid,
        Err(e) => return HttpResponse::BadRequest().json(json! {{"zid": e}}),
    };

    let jwt_secret = Hmac::<Sha256>::new_from_slice(SECRET.as_bytes()).unwrap();
    match pass {
        None => HttpResponse::Unauthorized().json("no password"),
        Some(pass) => {
            // 1. check user in db
            let db = &db_connection().await;
            let db_user = users::Entity::find_by_id(zid).one(db).await.map_err(|e| {
                log::warn!("DB Brokee when finding user ??:\n\t{}", e);
                HttpResponse::InternalServerError().json("AHHHH ME BROKEY BAD")
            });
            let user: users::Model = match db_user {
                Err(e) => return e,
                Ok(None) => {
                    return HttpResponse::Unauthorized().json(json! {{"zid": "user not found"}})
                }
                Ok(Some(user)) => user,
            };

            // Verify Pw Validity
            if let Err(e) = CreateUserBody::verify_password(pass) {
                return HttpResponse::BadRequest().json(json! {{"password": e}});
            }
            if user.hashed_pw != hash_pass(pass).unwrap() {
                return HttpResponse::BadRequest().json(json! {{"password": "incorrect password"}});
            }

            // Create Claims Token
            let token_claim = TokenClaims::new(user.zid, user.hashed_pw);
            let signed_token = token_claim
                .sign_with_key(&jwt_secret)
                .expect("Sign is valid");

            return HttpResponse::Ok().json(signed_token);
        }
    }
}

pub async fn create_user(body: web::Json<CreateUserBody>) -> HttpResponse {
    let user = body.into_inner();
    if let Err(e) = user.verify_user() {
        log::debug!("failed to verify user:{:?}", e);
        return e;
    }

    let hash = hash_pass(&user.password).expect("validates hashability");

    let actual_zid = CreateUserBody::verify_zid(&user.zid).expect("already verified");
    let db = &db_connection().await;

    // Check if user already exists
    let prev_user_res = users::Entity::find_by_id(actual_zid)
        .one(db)
        .await
        .map_err(|e| {
            log::warn!("DB Brokee when finding user ??:\n\t{}", e);
            HttpResponse::InternalServerError().body("AHHHH ME BROKEY BAD")
        });
    match prev_user_res {
        Err(e) => return e,
        Ok(Some(prev_user)) => {
            return HttpResponse::Conflict().json(json!({
                "zid": format!("User Already Exists: {}", prev_user.zid)
            }))
        }
        Ok(_) => {}
    };

    // Insert the new user into Db
    let active_user: users::ActiveModel = users::ActiveModel {
        zid: ActiveValue::Set(actual_zid),
        first_name: ActiveValue::Set(user.first_name),
        last_name: ActiveValue::Set(user.last_name),
        hashed_pw: ActiveValue::Set(hash.clone()),
        is_org_admin: ActiveValue::Set(false),
    };

    let created_user = active_user.insert(db).await.expect("Db broke");

    HttpResponse::Ok().json(created_user)
}

pub async fn make_admin(zid: &str) {
    let zid = CreateUserBody::verify_zid(&zid).expect("Admin zid must be valid z0000000");
    log::info!("Making {} an admin", zid);
    let db = &db_connection().await;

    let user = users::Entity::find_by_id(zid)
        .one(db)
        .await
        .map_err(|e| {
            log::warn!("DB Broke when finding admin ??:\n\t{}", e);
        })
        .unwrap()
        .unwrap();

    users::ActiveModel {
        is_org_admin: ActiveValue::Set(true),
        ..user.into()
    }
    .update(db)
    .await
    .expect("Db broke");
    log::info!("Made {} an admin", zid);
}
