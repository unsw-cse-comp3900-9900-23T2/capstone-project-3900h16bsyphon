use crate::entities::sea_orm_active_enums::Statuses;
use crate::models::logs::*;
use crate::models::SyphonResult;
use crate::{entities, utils::db::db};
use actix_web::{web::Query, HttpResponse};
use sea_orm::{ColumnTrait, EntityOrSelect, EntityTrait, QueryFilter, QueryOrder, QuerySelect};

pub async fn get_start_time(query: Query<GetRequestLogById>) -> SyphonResult<HttpResponse> {
    let db = db();
    let log = entities::request_status_log::Entity::find()
        .select()
        .filter(entities::request_status_log::Column::RequestId.eq(query.request_id))
        .filter(entities::request_status_log::Column::Status.eq(Statuses::Seeing))
        .order_by_desc(entities::request_status_log::Column::EventTime)
        .limit(1)
        .one(db)
        .await?;

    Ok(HttpResponse::Ok().json(log))
}
