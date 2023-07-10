use std::collections::HashMap;

use actix_web::{
    web::{Query, ReqData},
    HttpResponse, http::StatusCode,
};
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, QuerySelect};

use crate::{
    entities::{self},
    models::{GetRequestCountBody, GetRequestCountResponse, TokenClaims, GetRequestDetailsBody, SyphonResult, SyphonError},
    test_is_user,
    utils::db::db,
};

pub async fn get_request_count(
    token: ReqData<TokenClaims>,
    body: Query<GetRequestCountBody>,
) -> HttpResponse {
    let db = db();
    test_is_user!(token, db);
    let body = body.into_inner();
    let queue = entities::queues::Entity::find_by_id(body.queue_id)
        .one(db)
        .await
        .expect("db broke?");
    let course_offering_id = match queue {
        Some(q) => q.course_offering_id,
        None => return HttpResponse::BadRequest().json("queue does not exist!"),
    };
    let res = entities::requests::Entity::find()
        .left_join(entities::queues::Entity)
        .filter(entities::requests::Column::Zid.eq(body.zid))
        .filter(entities::queues::Column::CourseOfferingId.eq(course_offering_id))
        .count(db)
        .await
        .expect("db broke?");
    HttpResponse::Ok().json(GetRequestCountResponse { count: res })
}

pub async fn get_previous_tag_details(token: ReqData<TokenClaims>, query: Query<GetRequestDetailsBody>) -> SyphonResult<HttpResponse> {
    let db = db();
    let user = token.username;
    let course_offerings: i32 = entities::queues::Entity::find_by_id(query.queue_id)
        .column(entities::queues::Column::CourseOfferingId)
        .into_tuple()
        .one(db)
        .await?.ok_or(SyphonError::Json("Queue does not exist!".into(), StatusCode::BAD_REQUEST))?;
    let queues: Vec<i32> = entities::queues::Entity::find()
        .filter(entities::queues::Column::CourseOfferingId.eq(course_offerings))
        .into_tuple()
        .all(db).await?;
    let requests = entities::requests::Entity::find()
        .filter(entities::requests::Column::Zid.eq(user))
        .filter(entities::requests::Column::QueueId.is_in(queues))
        .find_with_related(entities::tags::Entity)
        .all(db).await?;
    let mut map = HashMap::new();
    for (_, tags) in &requests {
        for t in tags {
            match map.contains_key(t.name.as_str()) {
                true => map.insert(t.name.as_str(), map.get(t.name.as_str()).unwrap() + 1),
                false => map.insert(t.name.as_str(), 1),
            };
        }
    }
    Ok(HttpResponse::Ok().json(map))
}
