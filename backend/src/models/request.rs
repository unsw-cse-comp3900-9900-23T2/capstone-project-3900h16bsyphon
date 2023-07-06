use serde::{Deserialize, Serialize};

use crate::entities;
use entities::sea_orm_active_enums::Statuses;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateRequest {
    pub queue_id: i32,
    pub title: String,
    pub description: String,
    pub tags: Vec<i32>,
    pub is_clusterable: bool,
    pub status: Option<Statuses>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestInfoBody {
    pub request_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AllRequestsForQueueBody {
    pub queue_id: i32,
}
