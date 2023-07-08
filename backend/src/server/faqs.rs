use crate::{
    entities::{self, faqs},
    models::{
        TokenClaims, AddFaqRequest, GetFaqsQuery, DeleteFaqQuery,
    },
    test_is_user,
    utils::db::db,
};
use actix_web::{
    web::{self, Query, ReqData},
    HttpResponse,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter, ActiveValue};
use serde_json::json;

pub async fn add_faqs(
    token: ReqData<TokenClaims>,
    req_body: web::Json<AddFaqRequest>,
) -> HttpResponse {
    let db = db();
    test_is_user!(token, db);
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }

    log::info!("Add faq request: {:?}", req_body);
    let req_body = req_body.into_inner();

    let existed_faq = faqs::Entity::find_by_id(req_body.faq_id.unwrap())
        .one(db)
        .await
        .expect("Db broke");

    if existed_faq.is_some() {
        faqs::ActiveModel {
            question: ActiveValue::Set(req_body.question),
            answer: ActiveValue::Set(req_body.answer),
            ..existed_faq.clone().unwrap().into()
        }.update(db).await.expect("Db broke");

        return HttpResponse::Ok().json(existed_faq.clone().unwrap());
    }

    let faq = entities::faqs::ActiveModel::from(req_body.clone())
    .insert(db)
    .await
    .expect("Db broke");

    HttpResponse::Ok().json(faq)
}

pub async fn get_faqs(
    token: ReqData<TokenClaims>,
    query: Query<GetFaqsQuery>,
) -> HttpResponse {
    let db = db();
    test_is_user!(token, db);
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }
    let faq = entities::faqs::Entity::find()
        .filter(entities::faqs::Column::CourseOfferingId.eq(query.course_offering_id))
        .all(db)
        .await
        .expect("Db broke");

    HttpResponse::Ok().json(faq)
}

pub async fn delete_faqs(
    token: ReqData<TokenClaims>,
    query: Query<DeleteFaqQuery>,
) -> HttpResponse {
    let db = db();
    test_is_user!(token, db);
    let error = validate_user(&token, db).await.err();
    if error.is_some() {
        return error.unwrap();
    }
    let _res = entities::faqs::Entity::delete_by_id(query.faq_id)
        .exec(db)
        .await
        .expect("Db broke");
    HttpResponse::Ok().json(json!({"success": "Faq deleted"}))
}
