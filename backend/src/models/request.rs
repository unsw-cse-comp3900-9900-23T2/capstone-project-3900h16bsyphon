use sea_orm::FromQueryResult;
use serde::{Deserialize, Serialize};
use chrono::NaiveDateTime;

use crate::entities;
use entities::sea_orm_active_enums::Statuses;

use super::Tag;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateRequest {
    pub queue_id: i32,
    pub title: String,
    pub description: String,
    pub tags: Vec<i32>,
    pub is_clusterable: bool,
    pub status: Statuses,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EditRequestBody {
    pub request_id: i32,
    pub queue_id: i32,
    pub title: String,
    pub description: String,
    pub tags: Vec<i32>,
    pub is_clusterable: bool,
    pub status: Statuses,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateRequestResponse {
    pub request_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestInfoBody {
    pub request_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestSummaryBody {
    pub request_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AllRequestsForQueueBody {
    pub queue_id: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct QueueRequest {
    pub request_id: i32,
    pub first_name: String,
    pub last_name: String,
    pub zid: i32,
    pub order: i32,
    pub queue_id: i32,
    pub title: String,
    pub description: String,
    pub is_clusterable: bool,
    pub status: Statuses,
    pub tags: Vec<Tag>,
    pub previous_requests: u64,
    pub course_offering_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PutRequestStatusBody {
    pub request_id: i32,
    pub status: Statuses,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct TutorSummaryDetails {
    pub zid: i32,
    pub first_name: String,
    pub last_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct TimeStampModel {
    pub event_time: NaiveDateTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RequestSummaryReturnModel {
    pub tutors: Vec<TutorSummaryDetails>,
    pub start_time: Option<TimeStampModel>,
    pub end_time: TimeStampModel,
}
