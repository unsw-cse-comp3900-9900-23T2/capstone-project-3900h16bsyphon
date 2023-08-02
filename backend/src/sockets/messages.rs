use actix::{prelude::Message, Recipient};
use log::debug;
use serde_json::json;
use uuid::Uuid;

use crate::entities;
use crate::entities::queues::Model as QueueModel;
use crate::models::QueueRequest;

use super::SocketChannels;

#[derive(Clone, Debug, Message)]
#[rtype(result = "()")]
/// These are the messages that a WsConn receives from the lobby.
/// WsConn actually responds to these by piping them to the client.
pub enum WsMessage {
    /// Send raw text - should deprecate this
    Text(String),
    MessageOut {
        sender: i32,
        content: String,
        request_id: i32,
    },
    RequestData {
        request_id: i32,
        content: QueueRequest,
    },
    QueueData {
        queue_id: i32,
        content: (QueueModel, Vec<QueueRequest>),
    },
    Notification {
        content: String,
    }
}

/// Actions from the client, that have been parsed by the WsConn
/// and are ready to be sent to the lobby.
/// The lobby will deal w/ these actions and redirect
/// them to further clients as needed
#[derive(Clone, Debug, PartialEq, Eq, Hash, Message)]
#[rtype(result = "()")]
pub enum WsAction { /// This doesn't do anything, i just use it as a stub
    /// for when i need to return smth and dont want `todo!()`
    Def,
    /// Client asking to send a message to a given request
    SendMsg {
        request_id: i32,
        content: String,
        sender: i32,
    },
}

#[derive(Clone, Debug, PartialEq, Eq, Hash, Message)]
#[rtype(result = "()")]
pub enum HttpServerAction {
    /// A message to invalidate a set of keys (channels) in the lobby.
    /// For each key, the lobby with send out updated messages
    /// to all clients that are subscribed to a channel with
    /// an affected key.
    InvalidateKeys(Vec<SocketChannels>),
}

#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub enum WsActionParseError {
    NoTypeGiven,
    NotJson,
    InvalidType,
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
            WsMessage::RequestData { .. } => "request_data",
            WsMessage::QueueData { .. } => "queue_data",
            WsMessage::Notification { .. } => "notification",
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
            WsMessage::RequestData {
                request_id,
                content,
            } => json!({
                "request_id": request_id,
                "content": content,
            }),
            WsMessage::QueueData { queue_id, content } => json!({
                "queue_id": queue_id,
                "queue": content.0,
                "requests": content.1,
            }),
            WsMessage::Notification { content } => json!({
                "content": content,
            }),
        }
    }

    fn inject_type(&self, mut base: serde_json::Value) -> serde_json::Value {
        base.as_object_mut().as_mut().unwrap().insert(
            String::from("type"),
            serde_json::Value::String(self.get_type()),
        );
        base
    }
}

pub fn try_parse_ws_action(raw: &str, zid: i32) -> Result<WsAction, WsActionParseError> {
    let as_json =
        serde_json::from_str::<serde_json::Value>(raw).map_err(|_| WsActionParseError::NotJson)?;

    let action_type = get_str("type", &as_json)?;
    debug!("action_type: {}", action_type);
    let msg = match action_type {
        "message" => WsAction::SendMsg {
            request_id: get_int("request_id", &as_json)?,
            content: get_str("content", &as_json)?.into(),
            sender: zid,
        },
        _ => return Err(WsActionParseError::InvalidType),
    };

    Ok(msg)
}

fn get_str<'json>(
    key: &str,
    json: &'json serde_json::Value,
) -> Result<&'json str, WsActionParseError> {
    json.get(key)
        .ok_or(WsActionParseError::InvalidType)?
        .as_str()
        .ok_or(WsActionParseError::InvalidType)
}

fn get_int(key: &str, json: &serde_json::Value) -> Result<i32, WsActionParseError> {
    TryFrom::<i64>::try_from(
        json.get(key)
            .ok_or(WsActionParseError::InvalidType)?
            .as_i64()
            .ok_or(WsActionParseError::InvalidType)?,
    )
    .map_err(|_| WsActionParseError::InvalidType)
}

impl From<entities::notification::Model> for WsMessage {
    fn from(notif: entities::notification::Model) -> Self {
        WsMessage::Notification {
            content: notif.content,
        }
    }
}
