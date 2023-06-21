use argon2::password_hash::{PasswordHasher, PasswordVerifier};

use actix_web::{dev::ServiceRequest, web, HttpMessage, HttpResponse, Responder};

use actix_web_httpauth::extractors::{
    basic::BasicAuth,
    bearer::{self, BearerAuth},
    AuthenticationError,
};

use hmac::{Hmac, Mac};
use jwt::VerifyWithKey;
use sea_orm::{ActiveModelTrait, ActiveValue, ConnectionTrait, EntityTrait};
use serde::{Deserialize, Serialize};
use sha2::Sha256;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TokenClaims {
    pub username: String,
    pub password: String,
}

use crate::{database_utils::establish_connection, prelude::discard, SECRET};

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

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct CreateUserBody {
    first_name: String,
    last_name: String,
    zid: String,
    password: String,
}

impl CreateUserBody {
    pub fn verify_user(&self) -> Result<(), HttpResponse> {
        Self::verify_name(&self.first_name)?;
        Self::verify_name(&self.last_name)?;
        Self::verify_password(&self.password)?;
        Self::verify_zid(&self.password)?;
        Ok(())
    }

    pub fn verify_zid(zid: &str) -> Result<i32, HttpResponse> {
        if !zid.chars().all(|c| c.is_ascii_alphanumeric()) {
            return Err(HttpResponse::BadRequest().body("zid must be ascii alphanumeric only"));
        }
        let zid = zid.as_bytes();
        let zid = match zid.get(0) {
            Some(z) if *z == 'z' as u8 => &zid[1..],
            _ => zid,
        };
        if zid.len() != 7 {
            return Err(HttpResponse::BadRequest().body("zid must be 7 chars"));
        }
        std::str::from_utf8(zid)
            .expect("Was ascii before")
            .parse::<u32>()
            .map_err(|_| HttpResponse::BadRequest().body("zid wont parse to number"))
            .map(|z| z as i32)
    }

    fn verify_name(name: &str) -> Result<(), HttpResponse> {
        match name {
            n if !(3..=16).contains(&n.len()) => {
                Err(HttpResponse::BadRequest().body("name too short"))
            }
            n if !n.chars().all(|c| c.is_ascii_alphabetic() && c != ' ') => {
                Err(HttpResponse::BadRequest().body("name must be alphanumeric or space"))
            }
            _ => Ok(()),
        }
    }

    fn verify_password(pass: &str) -> Result<(), HttpResponse> {
        match pass {
            p if !(8..=24).contains(&p.len()) => {
                Err(HttpResponse::BadRequest().body("password must be 8 chars"))
            }
            p if !p.is_ascii() => Err(HttpResponse::BadRequest().body("password must be ascii")),
            p if !p.chars().any(|c| c.is_ascii_uppercase()) => {
                Err(HttpResponse::BadRequest().body("password must have uppercase"))
            }
            p if !p.chars().any(|c| c.is_ascii_lowercase()) => {
                Err(HttpResponse::BadRequest().body("password must have lowercase"))
            }
            p if !p.chars().any(|c| c.is_ascii_digit()) => {
                Err(HttpResponse::BadRequest().body("password must have digit"))
            }
            _ => Ok(()),
        }
    }
}
/// Hit this endpoint with BasicAuth info to get a BearerAuth token
/// Use that token in the Authorization header to access other endpoints
pub async fn auth(credentials: BasicAuth) -> impl Responder {
    // let jwt_secret: Hmac<Sha256> = Hmac::new_from_slice(SECRET.as_bytes()).expect("valid hash");
    // let username = credentials.user_id();
    let pass = credentials.password();

    match pass {
        None => HttpResponse::Unauthorized().body("no password"),
        Some(_pass) => {
            // 1. check user in db
            // 2. build a verifier
            // let mut is_valid = Verfier::default()
            //  .with_hash(user.pass)
            //  .with_pass(pass)
            //  .with_secret_key(hash_secret)
            //  .verify(
            //  .unwrap()
            // todo!("check id and pass are valid from DB");
            todo!("Create token claims and sign with key and return if valid")
        }
    }
}

use crate::entities::user_data;

pub async fn create_user(body: web::Json<CreateUserBody>) -> impl Responder {
    let user = body.into_inner();
    if let Err(e) = user.verify_user() {
        log::debug!("failed to verify user:{:?}", e);
        return e;
    }

    let hash = argon2::Argon2::default()
        .hash_password(
            user.password.clone().as_bytes(),
            argon2::password_hash::Salt::from_b64(&SECRET).expect("salt must be valid"),
        )
        .map_err(|e| {
            log::warn!("failed to hash password: {}", e);
            return HttpResponse::InternalServerError().body("AHHHH ME BROKEY BAD");
        })
        .expect("already returned if err")
        .to_string();

    let actual_zid = CreateUserBody::verify_zid(&user.zid).expect("already verified");
    let db = &establish_connection();

    // Check if user already exists
    let prev_user_res = user_data::Entity::find_by_id(actual_zid)
        .one(db)
        .await
        .map_err(|e| {
            log::warn!("DB Brokee when finding user ??: {}", e);
            HttpResponse::InternalServerError().body("AHHHH ME BROKEY BAD")
        })
        .expect("alrdy returned if err");
    if let Some(prev_user) = prev_user_res {
        return HttpResponse::BadRequest().body(format!("User {} already exists", prev_user.zid));
    }

    // Insert the new user into Db
    let active_user: user_data::ActiveModel = user_data::ActiveModel {
        zid: ActiveValue::Set(actual_zid),
        first_name: ActiveValue::Set(user.first_name),
        last_name: ActiveValue::Set(user.last_name),
        hashed_pw: ActiveValue::Set(hash.clone()),
        is_user_admin: ActiveValue::Set(false),
    };

    let created_user = active_user.insert(db).await.expect("Db broke");

    HttpResponse::Ok().json(created_user)
}
