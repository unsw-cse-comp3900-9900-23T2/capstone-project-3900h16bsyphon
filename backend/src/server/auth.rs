use actix_web::{http::StatusCode, web, HttpResponse};
use actix_web_httpauth::extractors::basic::BasicAuth;

use hmac::{Hmac, Mac};
use jwt::SignWithKey;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serde_json::json;
use sha2::Sha256;

use crate::{
    entities::users,
    models::auth::CreateUserBody,
    models::{auth::TokenClaims, SyphonError, SyphonResult},
    utils::auth::hash_pass,
    utils::db::db,
    SECRET,
};

/// Hit this endpoint with BasicAuth info to get a BearerAuth token
/// Use that token in the Authorization header to access other endpoints
pub async fn auth(credentials: BasicAuth) -> SyphonResult<HttpResponse> {
    let pass = credentials.password();
    let zid = match CreateUserBody::verify_zid(credentials.user_id()) {
        Ok(zid) => zid,
        Err(e) => {
            return Err(SyphonError::Json(
                json!({ "zid": e }),
                StatusCode::BAD_REQUEST,
            ))
        }
    };

    let jwt_secret = Hmac::<Sha256>::new_from_slice(SECRET.as_bytes()).unwrap();
    match pass {
        None => Err(SyphonError::Json(json!("no_password"), StatusCode::BAD_REQUEST)),
        Some(pass) => {
            // 1. check user in db
            let db = db();
            let db_user = users::Entity::find_by_id(zid).one(db).await.map_err(|e| {
                log::warn!("DB Brokee when finding user ??:\n\t{}", e);
                e
            })?;
            let user: users::Model = match db_user {
                None => {
                    return Ok(HttpResponse::Unauthorized().json(json! {{"zid": "user not found"}}))
                }
                Some(user) => user,
            };

            // Verify Pw Validity
            if let Err(e) = CreateUserBody::verify_password(pass) {
                return Err(SyphonError::Json(json! ({"password": e}), StatusCode::BAD_REQUEST));
            }
            if user.hashed_pw != hash_pass(pass).unwrap() {
                return Err(SyphonError::Json(json! {{"password": "incorrect password"}}, StatusCode::BAD_REQUEST));
            }

            // Create Claims Token
            let token_claim = TokenClaims::new(user.zid, user.hashed_pw);
            let signed_token = token_claim
                .sign_with_key(&jwt_secret)
                .expect("Sign is valid");

            Ok(HttpResponse::Ok().json(signed_token))
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
    let db = db();

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
    let zid = CreateUserBody::verify_zid(zid).expect("Admin zid must be valid z0000000");
    log::info!("Making {} an admin", zid);
    let db = db();

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

pub fn parse_zid(zid: &str) -> Result<i32, String> {
    if !zid.chars().all(|c| c.is_ascii_alphanumeric()) {
        return Err("zid must be ascii alphanumeric only".to_string());
    }
    let zid = zid.as_bytes();
    let zid = match zid.first() {
        Some(z) if *z == b'z' => &zid[1..],
        _ => zid,
    };
    if zid.len() != 7 {
        return Err(format!(
            "zid must have 7 numbers. Got zid with {} numbers",
            zid.len()
        ));
    }
    std::str::from_utf8(zid)
        .expect("Was ascii before")
        .parse::<u32>()
        .map_err(|_| "zid must be z followed by numbers".to_string())
        .map(|z| z as i32)
}
