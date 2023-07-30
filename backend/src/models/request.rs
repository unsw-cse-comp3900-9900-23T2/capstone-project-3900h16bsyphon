use chrono::NaiveDateTime;
use sea_orm::FromQueryResult;
use serde::{Deserialize, Serialize};

use crate::entities;
use entities::sea_orm_active_enums::Statuses;

use super::Tag;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SerializedFile {
    pub file_name: String,
    pub file_content: String
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateRequest {
    pub queue_id: i32,
    pub title: String,
    pub description: String,
    pub tags: Vec<i32>,
    pub is_clusterable: bool,
    pub status: Statuses,
    pub files: Vec<SerializedFile>
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
    pub files: Vec<SerializedFile>
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
    pub cluster_id: Option<i32>,
    pub previous_requests: u64,
    pub course_offering_id: i32,
    pub images: Vec<String>
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
pub struct RequestDuration {
    pub hours: i64,
    pub minutes: i64,
    pub seconds: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RequestSummaryReturnModel {
    pub tutors: Vec<TutorSummaryDetails>,
    pub start_time: Option<TimeStampModel>,
    pub end_time: TimeStampModel,
    pub duration: Option<RequestDuration>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MoveRequestOrderingBody {
    pub request_id: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub enum MoveDirection {
    Up,
    Down,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeleteImageQuery {
    pub request_id: i32,
    pub image_name: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ClusterRequestsBody {
    pub request_ids: Vec<i32>,
    pub queue_id: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AllRequestsForClusterBody {
    pub cluster_id: i32,
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JoinClusterRequest {
    pub request_id: i32,
    pub cluster_id: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LeaveClusterRequest {
    pub request_id: i32,
    pub cluster_id: i32,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DeleteClusterRequest {
    pub cluster_id: i32,
}

