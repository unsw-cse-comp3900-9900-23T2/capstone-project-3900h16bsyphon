use actix::{prelude::Message, Recipient};
use serde_json::{json, map};
use uuid::Uuid;

use super::SocketChannels;

#[derive(Clone, Debug, Message)]
#[rtype(result = "()")]
/// WsConn actually responds to this to pipe to actual client
pub enum WsMessage {
    /// Send raw text - should deprecate this
    Text(String),
    MessageOut {
        sender: i32,
        content: String,
        request_id: i32,
    },
}

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

/// Actions that the Websocket can read and send to the lobby
#[derive(Clone, Debug, PartialEq, Eq, Hash, Message)]
#[rtype(result = "()")]
pub enum WsAction {
    Def,
    SendMsg {
        request_id: i32,
        content: String,
        sender: i32,
    },
    Announcement {
        content: String,
        sender: i32,
    },
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum WsActionParseError {
    NoTypeGiven,
    NotJson,
    InvalidType,
}

// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////
// End of Struct Definitions
// /////////////////////////////////////////////////////////////////////////////
// /////////////////////////////////////////////////////////////////////////////

impl WsMessage {
    pub fn as_json(&self) -> serde_json::Value {
        let base = self.as_json_inner();
        self.inject_type(base)
    }

    fn get_type(&self) -> String {
        match self {
            WsMessage::Text(_) => "text",
            WsMessage::MessageOut { .. } => "message",
        }
        .into()
    }

    pub fn as_json_inner(&self) -> serde_json::Value {
        match self {
            WsMessage::Text(text) => json!({
                "content": text,
            }),
            WsMessage::MessageOut {
                sender,
                content,
                request_id,
            } => json!({
                "sender": sender,
                "content": content,
                "request_id": request_id,
            }),
        }
    }

    fn inject_type(&self, base: serde_json::Value) -> serde_json::Value {
        base.as_object().unwrap().insert(
            String::from("type"),
            serde_json::Value::String(self.get_type()),
        );
        base
    }
}

pub fn try_parse_ws_action(raw: &str, zid: i32) -> Result<WsAction, WsActionParseError> {
    let as_json =
        serde_json::from_str::<serde_json::Value>(raw).map_err(|_| WsActionParseError::NotJson)?;

    let action_type = as_json
        .get("type")
        .ok_or(WsActionParseError::NoTypeGiven)?
        .as_str()
        .ok_or(WsActionParseError::InvalidType)?;

    match action_type {
        "send_msg" => WsAction::SendMsg {
            request_id: get_int("request_id", &as_json)?,
            content: get_str("content", &as_json)?.into(),
            sender: zid,
        },
        "announcement" => WsAction::Announcement {
            content: get_str("content", &as_json)?.into(),
            sender: zid,
        },
        _ => Err(WsActionParseError::InvalidType)?,
    };

    Ok(WsAction::Def)
}

fn get_str<'k, 'json>(
    key: &'k str,
    json: &'json serde_json::Value,
) -> Result<&'json str, WsActionParseError> {
    Ok(json
        .get(key)
        .ok_or(WsActionParseError::InvalidType)?
        .as_str()
        .ok_or(WsActionParseError::InvalidType)?)
}

fn get_int(key: &str, json: &serde_json::Value) -> Result<i32, WsActionParseError> {
    return Ok(TryFrom::<i64>::try_from(
        json.get(key)
            .ok_or(WsActionParseError::InvalidType)?
            .as_i64()
            .ok_or(WsActionParseError::InvalidType)?,
    )
    .map_err(|_| WsActionParseError::InvalidType)?);
}
