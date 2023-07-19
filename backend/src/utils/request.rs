use actix_web::{web::ReqData, HttpResponse};
use futures::future::try_join;
use sea_orm::ActiveModelTrait;
use sea_orm::ActiveValue;
use sea_orm::EntityTrait;
use sea_orm::IntoActiveModel;
use sea_orm::ModelTrait;

use crate::entities;
use crate::models;
use crate::utils;
use models::{MoveDirection, SyphonError, SyphonResult, TokenClaims};
use utils::db::db;

use super::user::is_tutor_queue;

pub async fn move_request(
    token: ReqData<TokenClaims>,
    request_id: i32,
    direction: MoveDirection,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let request = entities::requests::Entity::find_by_id(request_id)
        .one(db)
        .await?
        .ok_or(SyphonError::RequestNotExist(request_id))?;

    if !is_tutor_queue(request.queue_id, token.username).await? {
        return Err(SyphonError::NotTutor);
    }

    let all_reqs = entities::queues::Entity::find_by_id(request.queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(request.queue_id))?
        .find_related(entities::requests::Entity)
        .all(db)
        .await?;

    let prev_order = request.order;
    let new_order = match direction {
        MoveDirection::Up => prev_order - 1,
        MoveDirection::Down => prev_order + 1,
    };

    swap_order(&all_reqs, prev_order, new_order, db).await?;

    Ok(HttpResponse::Ok().json(()))
}

async fn swap_order(
    reqs: &Vec<entities::requests::Model>,
    order_a: i32,
    order_b: i32,
    db: &sea_orm::DatabaseConnection,
) -> SyphonResult<()> {
    let req_a = reqs.iter().find(|r| r.order == order_a);
    let req_b = reqs.iter().find(|r| r.order == order_b);

    if let (Some(a), Some(b)) = (req_a.cloned(), req_b.cloned()) {
        let res = try_join(
            entities::requests::ActiveModel {
                order: ActiveValue::Set(order_b),
                ..a.clone().into_active_model()
            }
            .update(db),
            entities::requests::ActiveModel {
                order: ActiveValue::Set(order_a),
                ..b.clone().into_active_model()
            }
            .update(db),
        )
        .await
        .map_err(|e| {
            log::error!("Error while swapping order: {:#?}", e);
            e
        })?;

        log::info!("swap order result: \n\t{:#?}\nTo:\n\t{:#?}", (a, b), res);
    }

    Ok(())
}
