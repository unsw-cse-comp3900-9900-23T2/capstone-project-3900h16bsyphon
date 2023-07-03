use crate::{
    entities,
    models::{CreateQueueRequest, GetQueuesByCourseQuery, QueueReturnModel, GetQueueByIdQuery},
    server::user::validate_user,
    utils::db::db,
};
use actix_web::{
    web::{self, Query, ReqData},
    HttpResponse,
};

use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QuerySelect,
};

use crate::models::auth::TokenClaims;

pub async fn create_queue(
    token: ReqData<TokenClaims>,
    req_body: web::Json<CreateQueueRequest>,
) -> HttpResponse {
    let db = db();
    if let Err(e) = validate_user(&token, db).await {
        log::debug!("failed to verify user:{:?}", e);
        return e;
    }
    let req_body = req_body.into_inner();
    log::info!("Queue creation request: {:?}", req_body);
    let queue = entities::queues::ActiveModel::from(req_body)
        .insert(db)
        .await
        .expect("Db broke");
    HttpResponse::Ok().json(queue)
}

pub async fn get_queue_by_id(token: ReqData<TokenClaims>, query: Query<GetQueueByIdQuery>) -> HttpResponse {
    let db = db();
    if let Err(e) = validate_user(&token, db).await {
        log::debug!("failed to verify user:{:?}", e);
        return e;
    }
    let queue = entities::queues::Entity::find_by_id(query.queue_id)
        .one(db)
        .await
        .expect("Db broke");
    match queue {
        Some(q) => HttpResponse::Ok().json(web::Json(q)),
        None => {
            HttpResponse::NotFound().json("No queue of that id!")
        }
    }
}

pub async fn get_queues_by_course(
    token: ReqData<TokenClaims>,
    query: Query<GetQueuesByCourseQuery>,
) -> HttpResponse {
    let db = db();
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
        .await
        .expect("db broke");
    let tutors = entities::tutors::Entity::find()
        .select_only()
        .left_join(entities::users::Entity)
        .column(entities::users::Column::FirstName)
        .filter(entities::tutors::Column::CourseOfferingId.eq(query.course_id))
        .filter(entities::tutors::Column::IsCourseAdmin.eq(true))
        .into_json()
        .all(db)
        .await
        .expect("db broke")
        .iter()
        .map(|json| json.as_object().unwrap().get("first_name").unwrap().as_str().unwrap().to_string()).collect::<Vec<_>>();

    log::info!("{:?}", tutors);
    the_course.iter_mut().for_each(|it| {
        it.as_object_mut()
            .unwrap()
            .insert("course_admins".to_owned(), tutors.clone().into());
    });
    HttpResponse::Ok().json(the_course)
}

pub async fn get_active_queues(token: ReqData<TokenClaims>) -> HttpResponse {
    let db = db();
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
