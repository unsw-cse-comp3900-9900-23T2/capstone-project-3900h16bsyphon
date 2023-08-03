use actix::Addr;
use actix_web::{http::StatusCode, web, HttpRequest, HttpResponse};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{
    models::{SyphonError, SyphonResult},
    sockets::{lobby::Lobby, websockets::WsConn, SocketChannels},
    utils::unbox,
};

pub async fn start_socket_conn(
    req: HttpRequest,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let addr = lobby_addr.into_inner().as_ref().to_owned();
    let connection = WsConn::new(vec![], addr);
    actix_web_actors::ws::start(connection, &req, stream)
}

#[derive(Debug, Serialize, Deserialize, Clone, Hash, PartialEq, Eq)]
pub struct ConnNotificationQuery {
    pub zid: String,
}
pub async fn conn_notifications(
    req: HttpRequest,
    // web::Query(qry): web::Query<ConnNotificationQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    // TODO: This shouldnt use token - FE needs to store persist data on zid
    // let zid = validate_raw_token(qry.zid)
    //     .await
    //     .map_err(|_| SyphonError::NotTutor)?
    //     .username;

    log::info!("Starting Notification() socket");

    let conn = WsConn::new(vec![SocketChannels::Notifications(0)], unbox(lobby_addr));
    let res = actix_web_actors::ws::start(conn, &req, stream)
        .map_err(|_| SyphonError::Json(json!("Socket Failed"), StatusCode::INTERNAL_SERVER_ERROR));

    log::debug!("NOTIF RES: {:?}", res);
    res
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, Hash, PartialEq, Eq)]
pub struct ConnAnnouncementsQuery {
    pub queue_id: i32,
}

pub async fn conn_announcements(
    req: HttpRequest,
    web::Query(qry): web::Query<ConnAnnouncementsQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let queue_id = qry.queue_id;

    log::info!("Starting Announcements({}) socket", queue_id);

    let conn = WsConn::new(
        vec![SocketChannels::Announcements(queue_id)],
        unbox(lobby_addr),
    );
    actix_web_actors::ws::start(conn, &req, stream)
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, Hash, PartialEq, Eq)]
pub struct ConnRequestQuery {
    pub request_id: i32,
}

pub async fn conn_request(
    req: HttpRequest,
    web::Query(query): web::Query<ConnRequestQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    log::info!("Starting Request({}) socket", query.request_id);
    let conn = WsConn::new(
        vec![SocketChannels::Request(query.request_id)],
        unbox(lobby_addr),
    );
    Ok(actix_web_actors::ws::start(conn, &req, stream)?)
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, Hash, PartialEq, Eq)]
pub struct ConnQueueQuery {
    pub queue_id: i32,
}

pub async fn conn_queue(
    req: HttpRequest,
    web::Query(req_id): web::Query<ConnQueueQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let conn = WsConn::new(
        vec![SocketChannels::QueueData(req_id.queue_id)],
        unbox(lobby_addr),
    );
    actix_web_actors::ws::start(conn, &req, stream)
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, Hash, PartialEq, Eq)]
pub struct ConnChatQuery {
    pub request_id: i32,
}

pub async fn conn_chat(
    req: HttpRequest,
    web::Query(qry): web::Query<ConnChatQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let conn = WsConn::new(
        vec![SocketChannels::Chat(qry.request_id)],
        unbox(lobby_addr),
    );
    actix_web_actors::ws::start(conn, &req, stream)
}
