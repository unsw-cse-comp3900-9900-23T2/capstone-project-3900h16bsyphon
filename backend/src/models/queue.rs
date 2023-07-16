use chrono::NaiveDateTime;
use sea_orm::{ActiveValue, FromQueryResult};
use serde::{Deserialize, Serialize};

use crate::entities;

#[derive(Serialize, Deserialize, Debug, Clone, FromQueryResult)]
pub struct Tag {
    pub tag_id: i32,
    pub name: String,
    pub is_priority: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetQueueTagsQuery {
    pub queue_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CreateQueueRequest {
    pub title: String,
    pub start_time: NaiveDateTime,
    pub end_time: NaiveDateTime,
    pub tags: Vec<Tag>,
    pub is_visible: bool,
    pub is_available: bool,
    pub time_limit: Option<i32>,
    pub announcement: String,
    pub course_id: i32,
}

impl From<CreateQueueRequest> for entities::queues::ActiveModel {
    fn from(value: CreateQueueRequest) -> Self {
        Self {
            queue_id: ActiveValue::NotSet,
            title: ActiveValue::Set(value.title),
            start_time: ActiveValue::Set(value.start_time),
            end_time: ActiveValue::Set(value.end_time),
            is_visible: ActiveValue::Set(value.is_visible),
            is_available: ActiveValue::Set(value.is_available),
            time_limit: ActiveValue::Set(value.time_limit),
            is_sorted_by_previous_request_count: ActiveValue::Set(false),
            course_offering_id: ActiveValue::Set(value.course_id),
            announcement: ActiveValue::Set(value.announcement),
        }
    }
}

#[derive(Deserialize)]
pub struct GetQueuesByCourseQuery {
    pub course_id: i32,
}

#[derive(Deserialize)]
pub struct GetActiveQueuesQuery {
    pub queue_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct QueueReturnModel {
    pub queue_id: i32,
    pub title: String,
    pub course_offering_id: i32,
    pub is_available: bool,
    pub is_visible: bool,
    pub start_time: Option<NaiveDateTime>,
    pub end_time: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetQueueByIdQuery {
    pub queue_id: i32,
}

impl From<i32> for GetQueueByIdQuery {
    fn from(queue_id: i32) -> Self {
        Self { queue_id }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FlipTagPriority {
    pub queue_id: i32,
    pub is_priority: bool,
    pub tag_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateQueueRequest {
    pub queue_id: i32,
    pub title: String,
    pub start_time: NaiveDateTime,
    pub end_time: NaiveDateTime,
    pub tags: Vec<Tag>,
    pub is_visible: bool,
    pub is_available: bool,
    pub time_limit: Option<i32>,
    pub announcement: String,
    pub course_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateQueuePreviousRequestCount {
    pub queue_id: i32,
    pub is_sorted_by_previous_request_count: bool,
}
