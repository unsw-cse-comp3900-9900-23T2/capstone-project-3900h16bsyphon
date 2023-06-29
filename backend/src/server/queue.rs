use actix_web::{HttpResponse, web::{Query, ReqData, self}};
use log::info;
use sea_orm::{DatabaseConnection, ActiveValue, ActiveModelTrait, EntityTrait, QuerySelect, QueryFilter, ColumnTrait, FromQueryResult,};
use serde::{Serialize, Deserialize};
use serde_json::json;
use chrono::{NaiveDateTime};
use sea_orm::entity::prelude::*;
use crate::{database_utils::db_connection, entities, server::user::validate_user};

use super::auth::TokenClaims;

#[derive(Deserialize, Debug, Clone, Serialize)]
pub struct FAQs{
    pub question: String,
    pub answer: String,
}

#[derive(Deserialize, Debug, Clone)]
pub struct CreateQueueRequest{
    pub title: String,
    pub time_start: NaiveDateTime,
    pub time_end: NaiveDateTime,
    pub tags: Vec<String>,
    pub is_visible: bool,
    pub is_available: bool,
    pub time_limit: Option<i32>,
    pub announcement: String,
    pub course_id: i32,
}

pub async fn create_queue(token: ReqData<TokenClaims>, req_body: web::Json<CreateQueueRequest>) -> HttpResponse {
    let db: &DatabaseConnection = &db_connection().await;
    if let Err(e) = validate_user(&token, db).await {
        log::debug!("failed to verify user:{:?}", e);
        return e;
    }
    let req_body = req_body.into_inner();
    info!("Queue creation request: {:?}", req_body);
    let queue = entities::queues::ActiveModel {
        queue_id: ActiveValue::NotSet,
        title: ActiveValue::Set(req_body.title),
        start_time: ActiveValue::Set(req_body.time_start),
        end_time: ActiveValue::Set(req_body.time_end),
        is_visible: ActiveValue::Set(req_body.is_visible),
        is_available: ActiveValue::Set(req_body.is_available),
        time_limit: ActiveValue::Set(req_body.time_limit),
        course_offering_id: ActiveValue::Set(req_body.course_id),
        announcement: ActiveValue::Set(req_body.announcement),
    };

    let queue = queue.insert(db).await.expect("Db broke");
    HttpResponse::Ok().json(json!({"queue_id": queue.queue_id}))
}

#[derive(Deserialize)]
pub struct GetQueuesByCourseQuery {
    course_id: i32
}

pub async fn get_queues_by_course(token: ReqData<TokenClaims>, query: Query<GetQueuesByCourseQuery>) -> HttpResponse {
    let db: &DatabaseConnection = &db_connection().await;
    if let Err(e) = validate_user(&token, db).await {
        log::debug!("failed to verify user:{:?}", e);
        return e;
    }
    let mut the_course = entities::course_offerings::Entity::find_by_id(query.course_id)
        .select_only()
        .left_join(entities::queues::Entity)
        .column(entities::course_offerings::Column::Title)
        .column(entities::course_offerings::Column::CourseCode)
        .column(entities::queues::Column::QueueId)
        .column(entities::queues::Column::StartTime)
        .column(entities::queues::Column::EndTime)
        .column(entities::queues::Column::Title)
        .column(entities::queues::Column::IsVisible)
        .into_json()
        .all(db)
        .await.expect("db broke");
    let tutors = entities::tutors::Entity::find()
        .select_only()
        .left_join(entities::users::Entity)
        .column(entities::users::Column::FirstName)
        .filter(entities::tutors::Column::CourseOfferingId.eq(query.course_id))
        .filter(entities::tutors::Column::IsCourseAdmin.eq(true))
        .into_json()
        .all(db).await.expect("db broke");
    info!("{:?}", tutors);
    the_course.iter_mut()
        .for_each(|it| { it.as_object_mut().unwrap().insert("course_admins".to_owned(), tutors.clone().into()); });
    HttpResponse::Ok().json(the_course)
}
#[derive(Debug, Clone, Serialize, Deserialize, FromQueryResult)]
pub struct QueueReturnModel {
    queue_id: i32,
    title: String,
    course_offering_id: i32,
    is_available: bool,
    is_visible: bool,
    start_time: Option<DateTime>,
    end_time: Option<DateTime>,
}

pub async fn get_active_queues(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = &db_connection().await;
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }

    let queues_result = entities::queues::Entity::find()
        .select_only()
        .column(entities::queues::Column::QueueId)
        .column(entities::queues::Column::Title)
        .column(entities::queues::Column::CourseOfferingId)
        .column(entities::queues::Column::IsAvailable)
        .column(entities::queues::Column::IsVisible)
        .column(entities::queues::Column::StartTime)
        .column(entities::queues::Column::EndTime)
        .filter(entities::queues::Column::IsVisible.eq(true))
        .filter(entities::queues::Column::IsAvailable.eq(true))
        .into_model::<QueueReturnModel>()
        .all(db)
        .await;

    // return queues result result
    match queues_result {
        Ok(queues_result) => HttpResponse::Ok().json(web::Json(queues_result)),
        Err(e) => {
            log::warn!("Db broke?: {:?}", e);
            HttpResponse::InternalServerError().json("Db Broke")
        }
    }
}
