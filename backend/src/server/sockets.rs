use actix::Addr;
use actix_web::{web, HttpRequest, HttpResponse};
use uuid::Uuid;

use crate::utils::sockets::{lobby::Lobby, websockets::WsConn};

pub async fn start_socket_conn(
    req: HttpRequest,
    stream: web::Payload,
    path: web::Path<Uuid>,
    server: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    let group_id: Uuid = path.into_inner();
    let wsconn = WsConn::new(group_id, server.get_ref().clone());
    actix_web_actors::ws::start(wsconn, &req, stream)
}
