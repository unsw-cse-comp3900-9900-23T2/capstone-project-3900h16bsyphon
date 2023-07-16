use actix::{prelude::Message, Recipient};
use uuid::Uuid;

use super::SocketChannels;

#[derive(Message)]
#[rtype(result = "()")]
/// WsConn actually responds to this to pipe to actual client
pub struct WsMessage(pub String);

#[derive(Message, Debug, Clone)]
#[rtype(result = "()")]
/// WsConnect asking to get put in a lobby
pub struct Connect {
    pub addr: Recipient<WsMessage>,
    pub channels: Vec<SocketChannels>,
    pub self_id: Uuid,
    pub zid: i32,
}

#[derive(Message)]
#[rtype(result = "()")]
/// WsConn asking to be removed from a lobby and
/// consequently, all associated channels.
pub struct Disconnect {
    pub id: Uuid,
}

/// A WsConn asking to remove *all* associated connections
/// for the given user from the lobby.
#[derive(Message)]
#[rtype(result = "()")]
pub struct DisconnectAll {
    pub zid: i32,
}

#[derive(Message)]
#[rtype(result = "()")]
/// Client sends this to lobby
/// Lobby echoes this out
pub struct ClientActorMessage {
    pub id: Uuid,
    pub msg: String,
    pub room_id: Uuid,
}
