pub mod auth;
pub mod db;
pub mod request;
pub mod user;

use crate::sockets::lobby::Lobby;

pub fn unbox(lobby: actix_web::web::Data<actix::Addr<Lobby>>) -> actix::Addr<Lobby> {
    lobby.into_inner().as_ref().to_owned()
}
