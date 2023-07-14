use actix::Addr;
use actix_web::{
    http::StatusCode,
    web::{self, ReqData},
    HttpRequest, HttpResponse,
};
use sea_orm::EntityTrait;
use serde::{Deserialize, Serialize};
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

#[derive(Debug, Serialize, Deserialize, Copy, Clone, Hash, PartialEq, Eq)]
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

#[derive(Debug, Serialize, Deserialize, Copy, Clone, Hash, PartialEq, Eq)]
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

    let db = db();
    // Check that tutor or, owns request
    let request = entities::requests::Entity::find_by_id(req_id)
        .one(db)
        .await?
        .ok_or(SyphonError::RequestNotExist(req_id))?;
    let course_offering_id = entities::queues::Entity::find_by_id(request.queue_id)
        .one(db)
        .await?
        .expect("Q exists because request exists")
        .course_offering_id;
    let is_tutor = entities::tutors::Entity::find_by_id((token.username, course_offering_id))
        .one(db)
        .await?
        .is_some();
    if token.username != request.zid && !is_tutor {
        return Err(SyphonError::NotTutor);
    }

    log::info!("Starting Request({}) socket for {}", req_id, token.username);
    let conn = WsConn::new(
        token.username,
        vec![SocketChannels::Request(req_id)],
        unbox(lobby_addr),
    );

    Ok(actix_web_actors::ws::start(conn, &req, stream)?)
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, Hash, PartialEq, Eq)]
pub struct ConnQueueQuery {
    pub queue_id: i32,
}

pub async fn conn_queue(
    token: ReqData<TokenClaims>,
    req: HttpRequest,
    req_id: web::Query<ConnQueueQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    // Check if user is a tutor for the course the queue is for
    let db = db();
    let queue_id = req_id.queue_id;
    let queue_model = entities::queues::Entity::find_by_id(queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(queue_id))?;
    let course_offering_id = queue_model.course_offering_id;
    // Ensure user is a tutor for the course
    entities::tutors::Entity::find_by_id((token.username, course_offering_id))
        .one(db)
        .await?
        .ok_or(SyphonError::NotTutor)?;

    // Start the connection
    log::info!(
        "Starting Queue({}) socket for {}",
        req_id.queue_id,
        token.username
    );
    let conn = WsConn::new(
        token.username,
        vec![SocketChannels::QueueData(queue_id)],
        unbox(lobby_addr),
    );

    Ok(actix_web_actors::ws::start(conn, &req, stream)?)
}

#[derive(Debug, Serialize, Deserialize, Copy, Clone, Hash, PartialEq, Eq)]
pub struct ConnChatQuery {
    pub request_id: i32,
}

pub async fn conn_chat(
    token: ReqData<TokenClaims>,
    req: HttpRequest,
    req_id: web::Query<ConnQueueQuery>,
    stream: web::Payload,
    lobby_addr: web::Data<Addr<Lobby>>,
) -> SyphonResult<HttpResponse> {
    let req_id = req_id.queue_id;

    let db = db();
    // Check that tutor or, owns request
    // lol this is repeeated alot but its fine
    let request = entities::requests::Entity::find_by_id(req_id)
        .one(db)
        .await?
        .ok_or(SyphonError::RequestNotExist(req_id))?;
    let course_offering_id = entities::queues::Entity::find_by_id(request.queue_id)
        .one(db)
        .await?
        .expect("Q exists because request exists")
        .course_offering_id;
    let is_tutor = entities::tutors::Entity::find_by_id((token.username, course_offering_id))
        .one(db)
        .await?
        .is_some();
    if token.username != request.zid && !is_tutor {
        return Err(SyphonError::NotTutor);
    }

    // Start the connection
    log::info!("Starting Chat({}) socket for {}", req_id, token.username);
    let conn = WsConn::new(
        token.username,
        vec![SocketChannels::Chat(req_id)],
        unbox(lobby_addr),
    );

    Ok(actix_web_actors::ws::start(conn, &req, stream)?)
}

fn unbox(lobby: web::Data<Addr<Lobby>>) -> Addr<Lobby> {
    lobby.into_inner().as_ref().to_owned()
}
