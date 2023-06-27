use actix_web::{dev::ServiceRequest, web, HttpMessage, HttpResponse, Responder};

use actix_web_httpauth::extractors::{
    basic::BasicAuth,
    bearer::{self, BearerAuth},
    AuthenticationError,
};

use hmac::{Hmac, Mac};
use jwt::{SignWithKey, VerifyWithKey};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::Sha256;

use crate::{database_utils::db_connection, entities, SECRET};
use entities::users;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TokenClaims {
    pub username: i32,
    pub password: String,
}

impl TokenClaims {
    fn new(username: i32, password: impl Into<String>) -> Self {
        Self {
            username,
            password: password.into(),
        }
    }
}

/// Handler that validates a bearer token. This is used as the source
/// for our `HttpAuthentication` middleware.
pub async fn validator(
    req: ServiceRequest,
    credentials: BearerAuth,
) -> Result<ServiceRequest, (actix_web::Error, ServiceRequest)> {
    let key: hmac::Hmac<Sha256> = Hmac::new_from_slice(SECRET.as_bytes()).unwrap();
    let token_string = credentials.token();

    // Validate token
    let claims: Result<TokenClaims, &str> = token_string
        .verify_with_key(&key)
        .map_err(|_| "invalid token");

    match claims {
        Ok(value) => {
            req.extensions_mut().insert(value);
            Ok(req)
        }
        Err(_) => {
            let config_data = req
                .app_data::<bearer::Config>()
                .cloned()
                .unwrap_or_default()
                .scope("");
            Err((AuthenticationError::from(config_data).into(), req))
        }
    }
}

/// Hit this endpoint with BasicAuth info to get a BearerAuth token
/// Use that token in the Authorization header to access other endpoints
pub async fn auth(credentials: BasicAuth) -> impl Responder {
    let pass = credentials.password();
    let zid = match CreateUserBody::verify_zid(credentials.user_id()) {
        Ok(zid) => zid,
        Err(e) => return HttpResponse::BadRequest().json(json!{{"zid": e}}),
    };

    let jwt_secret = Hmac::<Sha256>::new_from_slice(SECRET.as_bytes()).unwrap();
    match pass {
        None => HttpResponse::Unauthorized().body("no password"),
        Some(pass) => {
            // 1. check user in db
            let db = &db_connection().await;
            let db_user = users::Entity::find_by_id(zid)
                .one(db)
                .await
                .map_err(|e| {
                    log::warn!("DB Brokee when finding user ??:\n\t{}", e);
                    HttpResponse::InternalServerError().body("AHHHH ME BROKEY BAD")
                });
            let user: users::Model = match db_user {
                Err(e) => return e,
                Ok(None) => return HttpResponse::Unauthorized().json(json!{{"zid": "user not found"}}),
                Ok(Some(user)) => user,
            };

            // Verify Pw Validity
            if let Err(e) = CreateUserBody::verify_password(pass) {
                return HttpResponse::BadRequest().json(json!{{"password": e}});
            }
            if user.hashed_pw != hash_pass(pass).unwrap() {
                return HttpResponse::BadRequest().json(json!{{"password": "incorrect password"}});
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

pub async fn create_user(body: web::Json<CreateUserBody>) -> HttpResponse  {
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
            return HttpResponse::Conflict().body(format!("User Already Exists: {}", prev_user.zid))
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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateUserBody {
    pub first_name: String,
    pub last_name: String,
    pub zid: String,
    pub password: String,
}

impl CreateUserBody {
    pub fn verify_user(&self) -> Result<(), HttpResponse> {
        let errs = json!({
            "first_name": Self::verify_name(&self.first_name),
            "last_name": Self::verify_name(&self.last_name),
            "password": Self::verify_password(&self.password),
            "zid": Self::verify_zid(&self.zid),
        });
        match errs.as_object().unwrap().iter().all(|(_, v)| v.is_object() && v.as_object().unwrap().contains_key("Ok")) {
            true => Ok(()),
            false => Err(
                HttpResponse::BadRequest()
                    .json(
                        errs.as_object().unwrap()
                            .iter().map(
                                |(key, value)| (key.to_owned(), value.as_object().unwrap().get("Err").unwrap_or(&json!("")).to_owned())
                            ).collect::<serde_json::Map<String, serde_json::Value>>()
                    )
            )
        }
    }

    pub fn verify_zid(zid: &str) -> Result<i32, String> {
        if !zid.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Err("zid must be ascii alphanumeric only".to_string());
        }
        let zid = zid.as_bytes();
        let zid = match zid.get(0) {
            Some(z) if *z == 'z' as u8 => &zid[1..],
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

    fn verify_name(name: &str) -> Result<(), String> {
        match name {
            n if !(3..=16).contains(&n.len()) => {
                Err("name too short".to_string())
            }
            n if !n.chars().all(|c| c.is_ascii_alphabetic()) => {
                Err("name must be alphanumeric or space".to_string())
            }
            _ => Ok(()),
        }
    }

    fn verify_password(pass: &str) -> Result<(), String> {
        match pass {
            p if !(8..=28).contains(&p.len()) => {
                Err("password must be 8 chars".to_string())
            }
            p if !p.is_ascii() => Err("password must be ascii".to_string()),
            p if !p.chars().any(|c| c.is_ascii_uppercase()) => {
                Err("password must have uppercase".to_string())
            }
            p if !p.chars().any(|c| c.is_ascii_lowercase()) => {
                Err("password must have lowercase".to_string())
            }
            p if !p.chars().any(|c| c.is_ascii_digit()) => {
                Err("password must have digit".to_string())
            }
            _ => Ok(()),
        }
    }
}

fn hash_pass(pass: &str) -> Result<String, argon2::Error> {
    argon2::hash_encoded(
        pass.as_bytes(),
        SECRET.as_bytes(),
        &argon2::Config::default(),
    )
}
