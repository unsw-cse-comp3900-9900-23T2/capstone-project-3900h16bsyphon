use actix_web::{HttpResponse, web::Query};
use sea_orm::{ColumnTrait, EntityTrait, EntityOrSelect, QueryFilter, QueryOrder, QuerySelect};

use crate::{models::{GetRequestLogById, SyphonResult}, utils::db::db, entities};

pub async fn get_start_time(
    query: Query<GetRequestLogById>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let log = entities::request_status_log::Entity::find()
        .select()
        .filter(entities::request_status_log::Column::RequestId.eq(query.request_id))
        .filter(entities::request_status_log::Column::Status.eq("seeing"))
        .order_by_desc(entities::request_status_log::Column::EventTime)
        .limit(1)
        .one(db)
        .await
        .expect("db broke");

    Ok(HttpResponse::Ok().json(log))
}
