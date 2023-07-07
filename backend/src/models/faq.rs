use serde::{Deserialize, Serialize};


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AddFaqRequest {
    pub question: String,
    pub answer: String,
    pub queue_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FaqData {
    pub question: String,
    pub answer: String,
    pub course_offering_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetFaqsQuery {
    pub course_offering_id: i32,
}