use sea_orm::ActiveValue;
use serde::{Deserialize, Serialize};

use crate::entities;


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AddFaqRequest {
    pub course_offering_id: i32,
    pub question: String,
    pub answer: String,
}

impl From<AddFaqRequest> for entities::faqs::ActiveModel {
    fn from(value: AddFaqRequest) -> Self {
        Self {
            faq_id: ActiveValue::NotSet,
            course_offering_id: ActiveValue::Set(value.course_offering_id),
            question: ActiveValue::Set(value.question),
            answer: ActiveValue::Set(value.answer),
        }
    }
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetFaqsQuery {
    pub course_offering_id: i32,
}


#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct DeleteFaqQuery {
    pub faq_id: i32,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct UpdateFaqRequest {
    pub faq_id: i32,
    pub question: String,
    pub answer: String,
}