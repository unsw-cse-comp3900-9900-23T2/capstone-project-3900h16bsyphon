use chrono::NaiveDateTime;
use sea_orm::{ActiveValue, FromQueryResult};
use serde::{Deserialize, Serialize};

use crate::entities;

use super::{RequestDuration, TimeStampModel};

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
pub struct CloseQueueRequest {
    pub queue_id: i32,
    pub end_time: NaiveDateTime,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateQueuePreviousRequestCount {
    pub queue_id: i32,
    pub is_sorted_by_previous_request_count: bool,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetQueueRequestCount {
    pub queue_id: i32
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetQueueSummaryQuery {
    pub queue_id: i32
}


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetQueueRequestCountResponse {
    pub count: u64,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetRemainingStudents {
    pub queue_id: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct QueueInformationModel {
    pub title: String,
    pub course_code: String,
    pub start_time: NaiveDateTime,
    pub end_time: NaiveDateTime,
}


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QueueTutorSummaryData {
    pub zid: i32,
    pub first_name: String,
    pub last_name: String,
    pub total_seen: i32,
    pub total_seeing: i32,
    pub average_time: i32,
    pub tags_worked_on: Vec<Tag>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QueueTagSummaryData {
    pub tag: Tag,
    pub duration: RequestDuration
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct QueueSummaryData {
    pub title: String,
    pub course_code: String,
    pub start_time: TimeStampModel,
    pub end_time: TimeStampModel,
    pub duration: RequestDuration,
    pub tutorSummaries: Vec<QueueTutorSummaryData>,
    pub tagSummaries: Vec<QueueTagSummaryData>,
}

