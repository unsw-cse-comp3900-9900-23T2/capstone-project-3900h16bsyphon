use crate::{
    entities::{self, faqs},
    models::{
        AddFaqRequest, GetFaqsQuery, DeleteFaqQuery, UpdateFaqRequest, SyphonResult, SyphonError,
    },
    utils::db::db,
};
use actix_web::{
    web::{self, Query},
    HttpResponse, http::StatusCode,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, ActiveValue};
use serde_json::json;

pub async fn create_faqs(
    req_body: web::Json<AddFaqRequest>,
) -> SyphonResult<HttpResponse>{
    let db = db();

    log::info!("Add faq request: {:?}", req_body);
    let req_body = req_body.into_inner();

    let faq = entities::faqs::ActiveModel::from(req_body.clone())
    .insert(db)
    .await
    .expect("Db broke");

    Ok(HttpResponse::Ok().json(faq))
}

pub async fn update_faqs(
    req_body: web::Json<UpdateFaqRequest>,
) -> SyphonResult<HttpResponse>{
    let db = db();

    log::info!("Update faq request: {:?}", req_body);
    let req_body = req_body.into_inner();

    let existed_faq = faqs::Entity::find_by_id(req_body.faq_id)
        .one(db)
        .await
        .expect("Db broke");

    if existed_faq.is_none() {
        return Err(SyphonError::Json(json!({"error": "Faq not found"}), StatusCode::NOT_FOUND));
    }
    faqs::ActiveModel {
        question: ActiveValue::Set(req_body.question),
        answer: ActiveValue::Set(req_body.answer),
        ..existed_faq.clone().unwrap().into()
    }.update(db).await.expect("Db broke");

    Ok(HttpResponse::Ok().json(json!({"success": "Faq updated"})))
}

pub async fn list_faqs(
    query: Query<GetFaqsQuery>,
) -> SyphonResult<HttpResponse> {
    let db = db();

    let faq = entities::faqs::Entity::find()
        .filter(entities::faqs::Column::CourseOfferingId.eq(query.course_offering_id))
        .all(db)
        .await
        .expect("Db broke");

    Ok(HttpResponse::Ok().json(faq))
}

pub async fn delete_faqs(
    query: Query<DeleteFaqQuery>,
) -> SyphonResult<HttpResponse>{
    let db = db();

    let _res = entities::faqs::Entity::delete_by_id(query.faq_id)
        .exec(db)
        .await
        .expect("Db broke");

    Ok(HttpResponse::Ok().json(json!({"success": "Faq deleted"})))
}
