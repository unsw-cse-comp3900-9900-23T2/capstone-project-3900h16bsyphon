use actix::Addr;
use actix_web::{
    http::StatusCode,
    web::{self, ReqData},
    HttpRequest, HttpResponse,
};
use sea_orm::{EntityTrait, ModelTrait};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::{
    entities,
    models::{SyphonError, SyphonResult, TokenClaims},
    sockets::{lobby::Lobby, websockets::WsConn, SocketChannels},
    utils::db::db,
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

pub fn conn_notifications(
    req: HttpRequest,
    queue_id: web::Path<i32>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let queue_id = queue_id.into_inner();

    log::info!("Starting Notification({}) socket", queue_id);

    let conn = WsConn::new(
        vec![SocketChannels::Notifications(queue_id)],
        unbox(lobby_addr),
    );
    actix_web_actors::ws::start(conn, &req, stream)
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
    //
    // let db = db();
    // // Check that tutor or, owns request
    // let request = entities::requests::Entity::find_by_id(req_id)
    //     .one(db)
    //     .await?
    //     .ok_or(SyphonError::RequestNotExist(req_id))?;
    // let course_offering_id = entities::queues::Entity::find_by_id(request.queue_id)
    //     .one(db)
    //     .await?
    //     .expect("Q exists because request exists")
    //     .course_offering_id;
    // let is_tutor = entities::tutors::Entity::find_by_id((
    //     .one(db)
    //     .await?
    //     .is_some();
    // if
    //     return Err(SyphonError::NotTutor);
    // }
    //
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

fn unbox(lobby: web::Data<Addr<Lobby>>) -> Addr<Lobby> {
    lobby.into_inner().as_ref().to_owned()
}