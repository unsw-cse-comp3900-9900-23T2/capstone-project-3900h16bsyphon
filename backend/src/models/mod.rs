pub mod auth;
pub mod course;
pub mod history;
pub mod queue;
pub mod request;
pub mod user;


use actix_web::HttpResponseBuilder;
pub use auth::*;
pub use course::*;
pub use history::*;
pub use queue::*;
pub use queue::*;
pub use request::*;
pub use user::*;

pub type SyphonResult<T> = Result<T, SyphonError>;

#[derive(Debug)]
pub enum SyphonError {
    Json(serde_json::Value, actix_web::http::StatusCode),
    DbError(sea_orm::DbErr)
}

impl std::fmt::Display for SyphonError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SyphonError::Json(val, _) => std::fmt::Display::fmt(val, f),
            SyphonError::DbError(_) => write!(f, "Internal Db Error")
        }
    }
}


impl SyphonError {
    fn deserialise_body(&self) -> Result<String, serde_json::Error> {
        match self {
            SyphonError::Json(body, _) => serde_json::to_string(body),
            SyphonError::DbError(_) => Ok(String::from("Internal Db Error")),
        }
    }
}

impl actix_web::ResponseError for SyphonError {
    fn status_code(&self) -> actix_web::http::StatusCode {
        match self {
            SyphonError::Json(_, code) => *code,
            SyphonError::DbError(_) => actix_web::http::StatusCode::INTERNAL_SERVER_ERROR
        }
    }

    fn error_response(&self) -> actix_web::HttpResponse<actix_web::body::BoxBody> {
        let json_body = self.deserialise_body().unwrap();

        HttpResponseBuilder::new(self.status_code()).json(json_body)
    }
}

impl From<sea_orm::DbErr> for SyphonError {
    fn from(err: sea_orm::DbErr) -> Self {
        log::error!("Db Error: {}", err);
        SyphonError::DbError(err)
    }
}
