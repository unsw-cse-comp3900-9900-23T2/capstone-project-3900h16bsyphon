use actix::Addr;
use actix_web::{web, HttpRequest, HttpResponse};
use uuid::Uuid;

use crate::utils::sockets::{lobby::Lobby, websockets::WsConn};

pub async fn start_socket_conn(
    req: HttpRequest,
    stream: web::Payload,
    server: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let wsconn = WsConn::new(Uuid::new_v4(), server.get_ref().clone());
    actix_web_actors::ws::start(wsconn, &req, stream)
}
