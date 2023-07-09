use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetRequestCountBody {
    pub zid: i32,
    pub queue_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetRequestDetailsBody {
    pub queue_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetRequestCountResponse {
    pub count: u64,
}
