pub mod auth;
pub mod course;
pub mod faqs;
pub mod history;
pub mod logs;
pub mod queue;
pub mod request;
pub mod user;

use actix_web::HttpResponseBuilder;
pub use auth::*;
pub use course::*;
pub use faqs::*;
pub use history::*;
pub use logs::*;
pub use queue::*;
pub use queue::*;
pub use request::*;
use serde_json::Value;
pub use user::*;

pub type SyphonResult<T> = Result<T, SyphonError>;

#[derive(Debug)]
pub enum SyphonError {
    Json(serde_json::Value, actix_web::http::StatusCode),
    RequestNotExist(i32),
    QueueNotExist(i32),
    NotTutor,
    DbError(sea_orm::DbErr),
    ActixError(actix_web::Error),
    IoError(std::io::Error),
}

impl std::fmt::Display for SyphonError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SyphonError::Json(val, _) => std::fmt::Display::fmt(val, f),
            SyphonError::DbError(_) => write!(f, "Internal Db Error"),
            SyphonError::NotTutor => write!(f, "Not Tutor"),
            SyphonError::RequestNotExist(id) => write!(f, "Request {} does not exist", id),
            SyphonError::QueueNotExist(id) => write!(f, "Queue {} does not exist", id),
            SyphonError::ActixError(e) => write!(f, "{}", e),
            SyphonError::IoError(e) => write!(f, "{}", e),
        }
    }
}

impl SyphonError {
    fn serialise_body(&self) -> Result<String, serde_json::Error> {
        match self {
            SyphonError::Json(body, _) => serde_json::to_string(body),
            SyphonError::DbError(_) => Ok(String::from("Internal Db Error")),
            SyphonError::NotTutor => Ok(String::from("Not Tutor")),
            SyphonError::RequestNotExist(id) => Ok(format!("Request does not exist: {}", id)),
            SyphonError::QueueNotExist(id) => Ok(format!("Queue does not exist: {}", id)),
            SyphonError::ActixError(e) => Ok(e.as_response_error().to_string()),
            SyphonError::IoError(e) => Ok(e.to_string()),
        }
    }
}

impl actix_web::ResponseError for SyphonError {
    fn status_code(&self) -> actix_web::http::StatusCode {
        match self {
            SyphonError::Json(_, code) => *code,
            SyphonError::DbError(_) => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
            SyphonError::NotTutor => actix_web::http::StatusCode::FORBIDDEN,
            SyphonError::RequestNotExist(_) => actix_web::http::StatusCode::BAD_REQUEST,
            SyphonError::QueueNotExist(_) => actix_web::http::StatusCode::BAD_REQUEST,
            SyphonError::ActixError(e) => e.as_response_error().status_code(),
            SyphonError::IoError(_) => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR,
        }
    }

    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        let json_body: Value =
            serde_json::from_str(self.serialise_body().unwrap().as_str()).unwrap();

        HttpResponseBuilder::new(self.status_code()).json(json_body)
    }
}

impl From<sea_orm::DbErr> for SyphonError {
    fn from(err: sea_orm::DbErr) -> Self {
        log::error!("Db Error: {}", err);
        SyphonError::DbError(err)
    }
}

impl From<actix_web::Error> for SyphonError {
    fn from(err: actix_web::Error) -> Self {
        log::warn!("Actix Error: {}", err);
        SyphonError::ActixError(err)
    }
}

impl From<std::io::Error> for SyphonError {
    fn from(err: std::io::Error) -> Self {
        log::warn!("IO Error: {}", err);
        SyphonError::IoError(err)
    }
}
