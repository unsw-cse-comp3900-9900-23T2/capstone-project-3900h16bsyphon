use actix::Addr;
use actix_web::{
    web::{self, ReqData},
    HttpRequest, HttpResponse,
};

use crate::{
    models::TokenClaims,
    sockets::{lobby::Lobby, websockets::WsConn},
};

pub async fn start_socket_conn(
    token: ReqData<TokenClaims>,
    req: HttpRequest,
    stream: web::Payload,
    server: web::Data<Addr<Lobby>>,
) -> Result<HttpResponse, actix_web::Error> {
    log::debug!("called fn");
    let addr = server.into_inner().as_ref().to_owned();
    let connection = WsConn::new(token.username, vec![], addr);
    actix_web_actors::ws::start(connection, &req, stream)
}
