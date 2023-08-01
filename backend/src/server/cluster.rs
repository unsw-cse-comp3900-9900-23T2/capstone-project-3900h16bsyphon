use actix::Addr;
use actix_web::http::StatusCode;
use actix_web::web::{self, ReqData};
use actix_web::HttpResponse;
use serde_json::json;

use crate::entities;
use crate::models::auth::TokenClaims;
use crate::models::request::*;
use crate::models::{SyphonError, SyphonResult};
use crate::sockets::lobby::Lobby;
use crate::sockets::messages::HttpServerAction;
use crate::sockets::SocketChannels;
use crate::utils::db::db;
use futures::future::join_all;

use sea_orm::{ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, QuerySelect};

pub async fn cluster_requests(
    web::Json(body): web::Json<ClusterRequestsBody>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let current_ids: Vec<i32> = entities::clusters::Entity::find()
        .column(entities::clusters::Column::ClusterId)
        .distinct_on([entities::clusters::Column::ClusterId])
        .into_tuple()
        .all(db)
        .await?;
    let new_id = current_ids.into_iter().max().unwrap_or(0) + 1;
    let requests = entities::requests::Entity::find()
        .filter(entities::requests::Column::RequestId.is_in(body.request_ids.clone()))
        .all(db)
        .await?;
    if requests.iter().any(|r| !r.is_clusterable) {
        return Err(SyphonError::Json(
            json!("One or more requests are not clusterable"),
            StatusCode::BAD_REQUEST,
        ));
    }

    let cluster_insertion = body.request_ids.iter().map(|r| {
        entities::clusters::ActiveModel {
            cluster_id: ActiveValue::Set(new_id),
            request_id: ActiveValue::Set(*r),
        }
        .insert(db)
    });
    join_all(cluster_insertion).await;
    let mut keys_to_invalidate = vec![SocketChannels::QueueData(body.queue_id)];
    keys_to_invalidate.append(
        &mut body
            .request_ids
            .into_iter()
            .map(|r| SocketChannels::Request(r))
            .collect(),
    );

    let action = HttpServerAction::InvalidateKeys(keys_to_invalidate);

    lobby.do_send(action);
    Ok(HttpResponse::Ok().json(new_id))
}

pub async fn join_cluster(
    _token: ReqData<TokenClaims>,
    web::Json(body): web::Json<JoinClusterRequest>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    let request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!("request not found"),
            StatusCode::NOT_FOUND,
        ))?;

    if !request.is_clusterable {
        return Err(SyphonError::Json(
            json!("request is not clusterable"),
            StatusCode::BAD_REQUEST,
        ));
    }

    let existing_cluster = entities::clusters::Entity::find()
        .filter(entities::clusters::Column::RequestId.eq(body.request_id))
        .one(db)
        .await?;

    match existing_cluster {
        Some(cluster) => {
            if cluster.cluster_id == body.cluster_id {
                Ok(HttpResponse::Ok().json("request already in this cluster"))
            } else {
                Err(SyphonError::Json(
                    json!("request already in another cluster"),
                    StatusCode::BAD_REQUEST,
                ))
            }
        }
        None => {
            let _ = entities::clusters::ActiveModel {
                cluster_id: ActiveValue::Set(body.cluster_id),
                request_id: ActiveValue::Set(body.request_id),
            }
            .insert(db)
            .await?;
            let keys_to_invalidate = vec![
                SocketChannels::QueueData(request.queue_id),
                SocketChannels::Request(request.request_id),
            ];
            lobby.do_send(HttpServerAction::InvalidateKeys(keys_to_invalidate));
            Ok(HttpResponse::Ok().json(()))
        }
    }
}

pub async fn edit_cluster(
    _token: ReqData<TokenClaims>,
    web::Json(body): web::Json<EditClusterRequest>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let db = db();

    let cluster = entities::clusters::Entity::find()
        .filter(entities::clusters::Column::ClusterId.eq(body.cluster_id))
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!("cluster not found"),
            StatusCode::NOT_FOUND,
        ))?;

    let request = entities::requests::Entity::find()
        .filter(entities::requests::Column::RequestId.is_in(vec![cluster.request_id]))
        .one(db)
        .await?;

    let queue_id = request.unwrap().queue_id;

    entities::clusters::Entity::delete_many()
        .filter(entities::clusters::Column::ClusterId.eq(body.cluster_id))
        .exec(db)
        .await?;

    let items = body
        .request_ids
        .into_iter()
        .map(|request_id| entities::clusters::ActiveModel {
            request_id: ActiveValue::Set(request_id),
            cluster_id: sea_orm::ActiveValue::Set(body.cluster_id),
        });

    entities::clusters::Entity::insert_many(items)
        .exec(db)
        .await?;
    let keys_to_invalidate = vec![SocketChannels::QueueData(queue_id)];
    lobby.do_send(HttpServerAction::InvalidateKeys(keys_to_invalidate));
    Ok(HttpResponse::Ok().json(()))
}

pub async fn leave_cluster(
    _token: ReqData<TokenClaims>,
    web::Json(body): web::Json<LeaveClusterRequest>,
    lobby: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let db = db();
    entities::clusters::Entity::delete_many()
        .filter(entities::clusters::Column::RequestId.eq(body.request_id))
        .exec(db)
        .await?;

    let request = entities::requests::Entity::find_by_id(body.request_id)
        .one(db)
        .await?
        .ok_or(SyphonError::Json(
            json!("request not found"),
            StatusCode::NOT_FOUND,
        ))?;

    // delete cluster if there's only one request left
    let clusters = entities::clusters::Entity::find()
        .filter(entities::clusters::Column::ClusterId.eq(body.cluster_id))
        .all(db)
        .await?;

    if clusters.len() == 1 {
        entities::clusters::Entity::delete_many()
            .filter(entities::clusters::Column::ClusterId.eq(body.cluster_id))
            .exec(db)
            .await?;
    }

    let keys_to_invalidate = vec![
        SocketChannels::QueueData(request.queue_id),
        SocketChannels::Request(request.request_id),
    ];
    lobby.do_send(HttpServerAction::InvalidateKeys(keys_to_invalidate));
    Ok(HttpResponse::Ok().json(()))
}
