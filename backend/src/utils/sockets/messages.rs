use actix::{prelude::Message, Recipient};
use uuid::Uuid;

#[derive(Message)]
#[rtype(result = "()")]
/// WsConn actually responds to this to pipe to actual client
pub struct WsMessage(pub String);

#[derive(Message)]
#[rtype(result = "()")]
/// WsConnect asking to get put in a lobby
pub struct Connect {
    pub addr: Recipient<WsMessage>,
    pub lobby_id: Uuid,
    pub self_id: Uuid,
}

#[derive(Message)]
#[rtype(result = "()")]
/// WsConn asking to get removed from a lobby
pub struct Disconnect {
    pub id: Uuid,
    pub room_id: Uuid,
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
