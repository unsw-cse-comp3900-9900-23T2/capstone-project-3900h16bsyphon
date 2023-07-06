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

// impl From<CreateRequest> for entities::requests::ActiveModel {
//     fn from(value: CreateRequest) -> Self {
//         Self {
//             request_id: ActiveValue::NotSet,
//             zid: ActiveValue::Set(value.zid),
//             queue_id: ActiveValue::Set(value.queue_id),
//             title: ActiveValue::Set(value.title),
//             description: ActiveValue::Set(value.description),
//             order: ActiveValue::Set(value.order),
//             is_clusterable: ActiveValue::Set(value.is_clusterable),
//             status: ActiveValue::Set(value.status),
//         }
//     }
// }

#[derive(Debug, Serialize, Deserialize)]
pub struct RequestInfoBody {
    pub request_id: i32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AllRequestsForQueueBody {
    pub queue_id: i32,
}
