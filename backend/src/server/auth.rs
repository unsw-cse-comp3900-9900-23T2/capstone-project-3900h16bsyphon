use std::hash::Hasher;

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
struct CreateUserBody {
    name: String,
    zid: String,
    password: String,
}

async fn create_user(body: web::Json<CreateUserBody>) -> impl Responder {
    let user = body.into_inner();

    let hash = argonautica::Hasher::default()
        .with_password(user.password)
        .hash()
        .map_err(|_| log::warn!("failed to hash password"))
        .unwrap();

    todo!("create user and insert into database");

    HttpResponse::Ok().json(user)
}
