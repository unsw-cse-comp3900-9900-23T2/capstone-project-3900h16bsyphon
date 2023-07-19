use actix_web::{web::Query, HttpResponse};
use sea_orm::{ColumnTrait, EntityOrSelect, EntityTrait, QueryFilter, QueryOrder, QuerySelect};

use crate::{
    entities,
    models::{GetRequestLogById, SyphonResult},
    utils::db::db,
};

pub async fn get_start_time(query: Query<GetRequestLogById>) -> SyphonResult<HttpResponse> {
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
