use actix::Addr;
use actix_web::{
    http::StatusCode,
    web::{self, ReqData},
    HttpRequest, HttpResponse,
};
use sea_orm::EntityTrait;
use serde_json::json;

use crate::{
    entities,
    models::{SyphonError, SyphonResult, TokenClaims},
    sockets::{lobby::Lobby, websockets::WsConn, SocketChannels},
    utils::db::db,
};

pub async fn start_socket_conn(
    token: ReqData<TokenClaims>,
    req: HttpRequest,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let addr = lobby_addr.into_inner().as_ref().to_owned();
    let connection = WsConn::new(token.username, vec![], addr);
    actix_web_actors::ws::start(connection, &req, stream)
}

pub fn conn_notifications(
    token: ReqData<TokenClaims>,
    req: HttpRequest,
    queue_id: web::Path<i32>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let queue_id = queue_id.into_inner();

    log::info!(
        "Starting Notification({}) socket for {}",
        queue_id,
        token.username
    );

    let conn = WsConn::new(
        token.username,
        vec![SocketChannels::Notifications(queue_id)],
        unbox(lobby_addr),
    );
    actix_web_actors::ws::start(conn, &req, stream)
}

pub struct ConnAnnouncementsQuery {
    pub queue_id: i32,
}

pub async fn conn_announcements(
    token: ReqData<TokenClaims>,
    req: HttpRequest,
    queue_id: web::Query<ConnAnnouncementsQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let queue_id = queue_id.queue_id;

    log::info!(
        "Starting Announcements({}) socket for {}",
        queue_id,
        token.username
    );

    let conn = WsConn::new(
        token.username,
        vec![SocketChannels::Announcements(queue_id)],
        unbox(lobby_addr),
    );
    actix_web_actors::ws::start(conn, &req, stream)
}

pub struct ConnRequestQuery {
    pub request_id: i32,
}

pub async fn conn_request(
    token: ReqData<TokenClaims>,
    req: HttpRequest,
    req_id: web::Query<ConnRequestQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let req_id = req_id.request_id;

    log::info!("Starting Request({}) socket for {}", req_id, token.username);
    let db = db();
    // Check that tutor or, owns request
    let request = entities::requests::Entity::find_by_id(req_id)
        .one(db)
        .await?
        .ok_or(SyphonError::RequestNotExist(req_id))?;
    let tutor_model = entities::tutors::Entity::find_by_id((token.username, request.queue_id))
        .one(db)
        .await?;
    // Can edit self. Only tutors can edit others
    let _editing_self = match (token.username == request.zid, tutor_model) {
        (false, None) => return Err(SyphonError::Json(json!("Not Tutor"), StatusCode::FORBIDDEN)),
        (true, _) => true,
        (false, Some(_)) => false,
    };

    let conn = WsConn::new(
        token.username,
        vec![SocketChannels::Request(req_id)],
        unbox(lobby_addr),
    );

    Ok(actix_web_actors::ws::start(conn, &req, stream)?)
}

fn unbox(lobby: web::Data<Addr<Lobby>>) -> Addr<Lobby> {
    lobby.into_inner().as_ref().to_owned()
}
