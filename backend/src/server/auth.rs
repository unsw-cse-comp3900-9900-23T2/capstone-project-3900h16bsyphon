use std::hash::Hasher;

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};

use actix_web::{
    dev::ServiceRequest,
    error::Error,
    web::{self, Data},
    App, HttpMessage, HttpResponse, HttpServer, Responder,
};

use actix_web_httpauth::{
    extractors::{
        bearer::{self, BearerAuth},
        AuthenticationError,
    },
    middleware::HttpAuthentication,
};

use hmac::{Hmac, Mac};
use jwt::VerifyWithKey;
use serde::{Deserialize, Serialize};
use sha2::Sha256;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TokenClaims {
    pub username: String,
    pub password: String,
}

use crate::SECRET;

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
    name: String,
    zid: String,
    password: String,
}

pub async fn create_user(body: web::Json<CreateUserBody>) -> impl Responder {
    let user = body.into_inner();
    if let Err(e) = verify_user(&user) {
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

    log::debug!("Hashed: {}", hash);
    log::warn!("TODO: create user and insert into database");

    HttpResponse::Ok().json(user)
}

fn verify_user(user: &CreateUserBody) -> Result<(), HttpResponse> {
    match &user.name {
        n if !(3..=16).contains(&n.len()) => {
            return Err(HttpResponse::BadRequest().body("name too short"))
        }
        n if !n.chars().all(|c| c.is_ascii_alphabetic() && c != ' ') => {
            return Err(HttpResponse::BadRequest().body("name must be alphanumeric or space"))
        }
        _ => {}
    }
    match &user.password {
        p if !(8..=24).contains(&p.len()) => {
            return Err(HttpResponse::BadRequest().body("password must be 8 chars"))
        }
        p if !p.is_ascii() => return Err(HttpResponse::BadRequest().body("password must be ascii")),
        p if !p.chars().any(|c| c.is_ascii_uppercase()) => {
            return Err(HttpResponse::BadRequest().body("password must have uppercase"))
        }
        p if !p.chars().any(|c| c.is_ascii_lowercase()) => {
            return Err(HttpResponse::BadRequest().body("password must have lowercase"))
        }
        p if !p.chars().any(|c| c.is_ascii_digit()) => {
            return Err(HttpResponse::BadRequest().body("password must have digit"))
        }
        _ => {}
    }
    if !user.password.is_ascii() {
        return Err(HttpResponse::BadRequest().body("password must be ascii"));
    }
    if user.password.len() < 8 {
        return Err(HttpResponse::BadRequest().body("password too short (min 8)"));
    }
    Ok(())
}
