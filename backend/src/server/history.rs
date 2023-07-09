use actix_web::{
    web::{Query, ReqData},
    HttpResponse,
};
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter};

use crate::{
    entities,
    models::{GetRequestCountBody, GetRequestCountResponse, TokenClaims, GetRequestDetailsBody, SyphonResult, RequestInfo},
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

pub async fn get_previous_request_details(token: ReqData<TokenClaims>, query: Query<GetRequestDetailsBody>) -> SyphonResult<HttpResponse> {
    let db = db();
    let user = token.username;
    let requests = entities::requests::Entity::find()
        .filter(entities::requests::Column::Zid.eq(user))
        .filter(entities::requests::Column::QueueId.eq(query.queue_id))
        .find_with_related(entities::tags::Entity)
        .all(db).await?;
    let result = requests.iter().map(|(r, tag)| {
        let tags = tag.iter().map(|t| t.name.clone()).collect::<Vec<String>>();
        RequestInfo {
            request_id: r.request_id,
            zid: r.zid,
            queue_id: r.queue_id,
            title: r.title.clone(),
            description: r.description.clone(),
            order: r.order,
            is_clusterable: r.is_clusterable,
            status: r.status.clone(),
            tags,
        }
    }).collect::<Vec<_>>();
    Ok(HttpResponse::Ok().json(result))
}
