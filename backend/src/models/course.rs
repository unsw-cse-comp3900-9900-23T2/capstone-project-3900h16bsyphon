use actix_web::HttpResponse;
use chrono::NaiveDate;
use futures::future::join_all;
use regex::Regex;
use sea_orm::FromQueryResult;
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::server::course::check_user_exists;

pub const INV_CODE_LEN: usize = 6;

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct CourseOfferingReturnModel {
    pub course_offering_id: i32,
    pub course_code: String,
    pub title: String,
    pub start_date: Option<NaiveDate>,
    pub tutor_invite_code: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetCourseTagsQuery {
    pub course_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateOfferingBody {
    pub course_code: String,
    pub title: String,
    pub start_date: Option<NaiveDate>,
    pub admins: Option<Vec<i32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddTutorToCourseBody {
    pub tutor_id: i32,
    pub course_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AddTutorToCoursesBody {
    pub tutor_id: i32,
    pub course_ids: Vec<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JoinWithTutorLink {
    pub tutor_link: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct TutorAnalyticsInfo {
    pub zid: i32,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct RequestInfo {
    pub request_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsWaitTime {
    pub full_name: String,
    pub average_wait: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalyticsWaitTimeResult {
    pub wait_times: Vec<AnalyticsWaitTime>
}

#[derive(Deserialize)]
pub struct GetOfferingByIdQuery {
    pub course_id: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GetTagAnalytics {
    pub course_offering_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TagAnalytics {
    pub tag_id: i32,
    pub name: String,
    pub is_priority: bool,
    pub request_ids: Vec<i32>
}

impl CreateOfferingBody {
    pub async fn validate(&self) -> Result<(), HttpResponse> {
        let errs = json!({
            "course_code": Self::validate_code(&self.course_code).err(),
            "title": Self::validate_title(&self.title).err(),
            "admins": Self::validate_tutors(self.admins.as_ref().unwrap_or(&Vec::new())).await.err(),
        });
        match errs.as_object().unwrap().values().any(|v| !v.is_null()) {
            true => Err(HttpResponse::BadRequest().json(errs)),
            false => Ok(()),
        }
    }

    pub async fn validate_tutors(tutors: &[i32]) -> Result<(), Vec<i32>> {
        // TODO: check_user_exists should be in user
        let tutor_queries = join_all(tutors.iter().map(|id| check_user_exists(*id)));
        let non_exist = tutor_queries
            .await
            .into_iter()
            .filter_map(Result::ok)
            .filter_map(Result::err)
            .collect::<Vec<i32>>();

        match non_exist.is_empty() {
            true => Ok(()),
            false => Err(non_exist),
        }
    }

    pub fn validate_title(title: &str) -> Result<(), String> {
        if title
            .chars()
            .any(|c| !c.is_ascii_alphanumeric() && !c.is_ascii_punctuation() && c != ' ')
        {
            return Err(String::from(
                "Only alphanumeric characters, spaces, and punctuation allowed",
            ));
        }
        if !(3..=26).contains(&title.len()) {
            return Err(String::from("Title must be between 3 and 26 characters"));
        }
        Ok(())
    }

    pub fn validate_code(code: &str) -> Result<(), String> {
        if !Regex::new("^[A-Z]{4}[0-9]{4}$").unwrap().is_match(code) {
            return Err(String::from(
                "Invalid Course Code. Must Match ^[A-Z]{4}[0-9]{4}$",
            ));
        }
        Ok(())
    }
}
