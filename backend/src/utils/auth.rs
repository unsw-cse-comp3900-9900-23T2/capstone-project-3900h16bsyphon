use actix_web::{dev::ServiceRequest, HttpMessage, HttpResponse};

use actix_web_httpauth::{
    extractors::{
        bearer::{self, BearerAuth},
        AuthenticationError,
    },
    headers::www_authenticate::bearer::Bearer,
};

use hmac::{Hmac, Mac};
use jwt::VerifyWithKey;
use sea_orm::EntityTrait;

use sha2::Sha256;

use crate::{
    entities,
    models::auth::{AuthTokenClaims, TokenClaims},
    utils::db::db,
    SECRET,
};

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

/// Handler that validates a bearer token. This is used as the source
/// for our `HttpAuthentication` middleware.
pub async fn validator_admin(
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
            let db = db();
            match entities::users::Entity::find_by_id(value.username)
                .one(db)
                .await
                .map_err(|e| {
                    log::warn!("DB Broke when finding user ??:\n\t{}", e);
                    HttpResponse::InternalServerError().body("AHHHH ME BROKEY BAD")
                })
                .expect("Db broke")
                .expect("User exists cos token is valid")
                .is_org_admin
            {
                true => {
                    req.extensions_mut().insert(AuthTokenClaims::from(value));
                    Ok(req)
                }
                false => Err((auth_err_from_req(&req).into(), req)),
            }
        }
        Err(_) => Err((auth_err_from_req(&req).into(), req)),
    }
}

fn auth_err_from_req(req: &ServiceRequest) -> AuthenticationError<Bearer> {
    AuthenticationError::from(
        req.app_data::<bearer::Config>()
            .cloned()
            .unwrap_or_default()
            .scope(""),
    )
}

pub fn hash_pass(pass: &str) -> Result<String, argon2::Error> {
    argon2::hash_encoded(
        pass.as_bytes(),
        SECRET.as_bytes(),
        &argon2::Config::default(),
    )
}

#[macro_export]
macro_rules! test_is_user {
    ($token: expr, $db: expr) => {{
        use super::user::validate_user;
        if let Err(e) = validate_user(&$token, $db).await {
            log::debug!("failed to verify user:{:?}", e);
            return e;
        }
    }};
}
