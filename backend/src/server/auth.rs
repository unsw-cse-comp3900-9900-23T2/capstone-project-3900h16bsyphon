use actix_web::{dev::ServiceRequest, web, HttpMessage, HttpResponse, Responder};

use actix_web_httpauth::{
    extractors::{
        basic::BasicAuth,
        bearer::{self, BearerAuth},
        AuthenticationError,
    },
    headers::www_authenticate::bearer::Bearer,
};

use hmac::{Hmac, Mac};
use jwt::{SignWithKey, VerifyWithKey};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait};
use serde::{Deserialize, Serialize};
use serde_json::json;
use sha2::Sha256;

use crate::{
    database_utils::db_connection,
    entities,
    models::auth::{AuthTokenClaims, TokenClaims},
    SECRET,
};
use entities::users;
