//! This file contains all the prelude imports for the project.
//! Helps in keeping `main.rs` clean.


use actix_web::web::Json;
/// Secret used to hash passwords.
/// Requires `SECRET` to be set as and environemnt variable or in
/// a `.env` file in the root of the project, or a parent folder.
use serde::{Deserialize, Serialize};

use crate::server::auth::{create_user, CreateUserBody};

pub const SECRET: &'static str = dotenv_codegen::dotenv!("SECRET");
const DEFAULT_PORT: u16 = 8000;
const DEFAULT_HOST: &'static str = "0.0.0.0";

pub fn host_port_from_env() -> (String, u16) {
    let host = std::env::var("HOST_URL").unwrap_or(DEFAULT_HOST.into());
    let port = std::env::var("PORT")
        .as_ref()
        .map(String::as_str)
        .map(str::parse::<u16>)
        .ok()
        .map(Result::ok)
        .unwrap_or(None)
        .unwrap_or(DEFAULT_PORT);
    (host, port)
}

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    pub org_admins: Vec<CreateUserBody>,
}

pub async fn register_org_admins() {
    let admin_pass = std::env::var("ADMIN_PASS").expect("ADMIN_PASS not set");
    let created_res = create_user(Json(CreateUserBody {
        first_name: "Admin".into(),
        last_name: "Admin".into(),
        zid: "z0000000".into(),
        password: admin_pass,
    }))
    .await;
    match created_res.status() {
        actix_web::http::StatusCode::OK => log::info!("Created admin user"),
        actix_web::http::StatusCode::CONFLICT => log::warn!("Admin already exists"),
        actix_web::http::StatusCode::INTERNAL_SERVER_ERROR => {
            return log::error!("Internal Error While Creating Admin")
        }
        _ => return log::error!("Error when creating admin: {:?}", created_res),
    }
    // Add Admin Perms
    crate::server::auth::make_admin("z0000000").await;
}

#[cfg(debug_assertions)]
#[inline(always)]
pub const fn in_release_build() -> bool {
    false
}

#[cfg(not(debug_assertions))]
#[inline(always)]
pub const fn in_release_build() -> bool {
    true
}

/// Instantiates `env_logger` with the appropriate settings based on the environment.
/// Otherwise uses the defaults based on the build type (debug / release).
pub fn startup_logger() {
    let (default_filter, default_write) = match in_release_build() {
        true => ("info", "always"),
        false => ("debug", "always"),
    };

    let env = env_logger::Env::default()
        .filter_or("MY_LOG", default_filter)
        .write_style_or("MY_LOG_STYLE", default_write);

    env_logger::init_from_env(env);

    log::trace!(
        "This is a trace log. If you are running a release build, this should NOT be visible by default."
    );
    log::debug!("This is a debug log. This should only be visible in debug builds.");
    log::info!("This is an info log. If you are in a release build, you should see [INFO] [WARN] and [ERROR] logs only.");
    log::warn!("This is a warning log. This should be visible in all builds.");
    log::error!("This is an error log. If you see this, something has gone horribly wrong.");

    log::info!("");
    log::info!("");
    log::info!("");
    log::info!("Logger set up successfully!");
    log::info!("");
    log::info!("");
}
