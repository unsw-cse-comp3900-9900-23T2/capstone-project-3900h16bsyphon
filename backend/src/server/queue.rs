use crate::{
    entities,
    models::{CreateQueueRequest, GetQueuesByCourseQuery, QueueReturnModel, GetQueueByIdQuery, GetActiveQueuesQuery},
    server::user::validate_user,
    test_is_user,
    utils::db::db,
};
use actix_web::{
    web::{self, Query, ReqData},
    HttpResponse,
};

use sea_orm::{
    ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, QuerySelect, EntityOrSelect,
};
use serde_json::json;

use crate::models::auth::TokenClaims;

pub async fn create_queue(
    token: ReqData<TokenClaims>,
    req_body: web::Json<CreateQueueRequest>,
) -> HttpResponse {
    let db = db();
    test_is_user!(token, db);
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
        .column(entities::queues::Column::IsAvailable)
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
        .map(|json| {
            json.as_object()
                .unwrap()
                .get("first_name")
                .unwrap()
                .as_str()
                .unwrap()
                .to_string()
        })
        .collect::<Vec<_>>();

    the_course.iter_mut().for_each(|it| {
        it.as_object_mut()
            .unwrap()
            .insert("course_admins".to_owned(), tutors.clone().into());
    });
    HttpResponse::Ok().json(the_course)
}

pub async fn get_is_open(token: ReqData<TokenClaims>, query: Query<GetActiveQueuesQuery>) -> HttpResponse {
    let db = db();
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }
    let queues_result = entities::queues::Entity::find()
        .select()
        .filter(entities::queues::Column::QueueId.eq(query.queue_id))
        .into_model::<QueueReturnModel>()
        .one(db)
        .await.expect("db broke");

    // return queues result result
    match queues_result {
        Some(queues_result) => HttpResponse::Ok().json(
            json!({
                "is_open" : web::Json(queues_result.is_available)
            })
        ),
        None => HttpResponse::BadRequest().json("no queue found")
    }
}
