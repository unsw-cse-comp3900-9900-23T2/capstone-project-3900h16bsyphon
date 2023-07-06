use actix_web::HttpResponse;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::server::auth::parse_zid;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TokenClaims {
    pub username: i32,
    pub password: String,
}

impl TokenClaims {
    pub fn new(username: i32, password: impl Into<String>) -> Self {
        Self {
            username,
            password: password.into(),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AuthTokenClaims {
    pub username: i32,
    pub password: String,
}

impl From<TokenClaims> for AuthTokenClaims {
    fn from(value: TokenClaims) -> Self {
        Self {
            username: value.username,
            password: value.password,
        }
    }
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
            "first_name": Self::verify_name(&self.first_name).err(),
            "last_name": Self::verify_name(&self.last_name).err(),
            "password": Self::verify_password(&self.password).err(),
            "zid": Self::verify_zid(&self.zid).err(),
        });
        match errs.as_object().unwrap().iter().all(|(_, v)| v.is_null()) {
            true => Ok(()),
            false => Err(HttpResponse::BadRequest().json(errs)),
        }
    }

    pub fn verify_zid(zid: &str) -> Result<i32, String> {
        parse_zid(zid)
    }

    pub fn verify_name(name: &str) -> Result<(), String> {
        match name {
            n if !(3..=16).contains(&n.len()) => Err("name too short".to_string()),
            n if !n.chars().all(|c| c.is_ascii_alphabetic()) => {
                Err("name must be alphabetic or space".to_string())
            }
            _ => Ok(()),
        }
    }

    pub fn verify_password(pass: &str) -> Result<(), String> {
        match pass {
            p if !(8..=28).contains(&p.len()) => Err("password must be 8 chars".to_string()),
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
