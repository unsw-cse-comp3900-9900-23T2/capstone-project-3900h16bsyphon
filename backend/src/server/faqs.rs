use crate::{
    entities,
    models::{
        TokenClaims, AddFaqRequest, GetFaqsQuery,
    },
    test_is_user,
    utils::db::db,
};
use actix_web::{
    web::{self, Query, ReqData},
    HttpResponse,
};
use sea_orm::{ActiveModelTrait, ColumnTrait, EntityTrait, QueryFilter };

pub async fn add_faqs(
    token: ReqData<TokenClaims>,
    req_body: web::Json<AddFaqRequest>,
) -> HttpResponse {
    let db = db();
    test_is_user!(token, db);


    let req_body = req_body.into_inner();

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