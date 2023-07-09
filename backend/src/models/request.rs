use serde::{Deserialize, Serialize};

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
    pub status: Option<Statuses>,
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
pub struct AllRequestsForQueueBody {
    pub queue_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
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
    pub status: Option<Statuses>,
    pub tags: Vec<Tag>,
    pub course_offering_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PutRequestStatusBody {
    pub request_id: i32,
    pub status: Statuses,
}