use std::collections::HashMap;

use actix_web::{
    web::{Query, ReqData},
    HttpResponse, http::StatusCode,
};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter, QuerySelect};

use crate::{
    entities::{self},
    models::{TokenClaims, GetRequestDetailsBody, SyphonResult, SyphonError},
    utils::db::db,
};

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
