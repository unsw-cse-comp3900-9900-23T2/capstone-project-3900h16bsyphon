use actix::Actor;
use actix::Context;
use actix::Handler;
use actix::Recipient;

use std::collections::BTreeSet;
use std::collections::HashMap;

use crate::sockets::messages::WsMessage;
use uuid::Uuid;

use super::messages::{Connect, Disconnect, DisconnectAll, WsAction};
use super::SocketChannels;

type Socket = Recipient<WsMessage>;

#[derive(Default)]
pub struct Lobby {
    pub(super) sessions: HashMap<Uuid, SessionData>,
    /// Map zid to all connections for this person
    pub(super) connections: HashMap<i32, BTreeSet<Uuid>>,
    /// Map request_id to all sockets listeninig to that chat
    pub(super) chat_rooms: HashMap<i32, BTreeSet<Uuid>>,
    /// Stores all messages that have been sent to a chat
    /// for a given request_id
    /// Value: (sender_id: i32, content: String)
    /// TODO: Should probably be bounded buffer not vec
    pub(super) chat_playback: HashMap<i32, Vec<(i32, String)>>,
    /// Map request_id to all sockets listening to that req
    pub(super) requests: HashMap<i32, BTreeSet<Uuid>>,
    /// Map queue_id to all sockets listening to annoucements
    pub(super) annoucements: HashMap<i32, BTreeSet<Uuid>>,
    // TODO: queue data - more complex
    pub(super) queues: HashMap<i32, BTreeSet<Uuid>>,
    pub(super) notifications: HashMap<i32, BTreeSet<Uuid>>,
}

impl Lobby {
    /// Send message to a singular socket
    pub(super) fn _send_message(&self, message: WsMessage, target_id: &Uuid) {
        match self.sessions.get(target_id) {
            Some(session) => session.socket.do_send(message),
            None => {
                log::warn!("Cannot send message. No session for {}", target_id);
                log::warn!("Trying to send: {:?}", message);
            }
        }
    }

    /// Broadcast a message to all sockets in a room
    pub(super) fn broadcast_message(&self, message: WsMessage, targets: &BTreeSet<Uuid>) {
        for target in targets {
            self._send_message(message.clone(), target);
        }
    }
}

impl Actor for Lobby {
    type Context = Context<Self>;

    fn started(&mut self, _ctx: &mut Self::Context) {
        log::info!("Lobby Started");
    }

    fn stopping(&mut self, _ctx: &mut Self::Context) -> actix::Running {
        log::error!("LOBBY STOPPING");
        actix::Running::Stop
    }

    fn stopped(&mut self, _ctx: &mut Self::Context) {
        log::error!("LOBBY STOPPED");
        log::error!("LOBBY STOPPED");
    }
}

impl Handler<Disconnect> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: Disconnect, _ctx: &mut Self::Context) -> Self::Result {
        let SessionData {
            zid,
            id,
            socket,
            channels,
        } = match self.sessions.remove(&msg.id) {
            Some(data) => data,
            None => return,
        };

        self.connections.entry(zid).or_default().remove(&id);
        if self.connections.get(&zid).expect("created").is_empty() {
            self.connections.remove(&zid);
        }

        for channel in channels {
            match channel {
                SocketChannels::Notifications(zid) => self.notifications.entry(zid),
                SocketChannels::QueueData(q_id) => self.queues.entry(q_id),
                SocketChannels::Announcements(q_id) => self.annoucements.entry(q_id),
                SocketChannels::Chat(r_id) => self.chat_rooms.entry(r_id),
                SocketChannels::Request(r_id) => self.requests.entry(r_id),
            }
            .or_default()
            .remove(&id);
        }

        socket.do_send(WsMessage::Text("Disconnected".to_string()));
    }
}

impl Handler<DisconnectAll> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: DisconnectAll, ctx: &mut Self::Context) -> Self::Result {
        match self.connections.get(&msg.zid) {
            Some(connections) => connections,
            None => return,
        }
        .clone()
        .into_iter()
        .for_each(|id| Handler::<Disconnect>::handle(self, Disconnect { id }, ctx));
    }
}

pub struct SessionData {
    zid: i32,
    id: Uuid,
    socket: Socket,
    channels: Vec<SocketChannels>,
}

impl From<Connect> for SessionData {
    fn from(value: Connect) -> Self {
        Self {
            zid: value.zid,
            id: value.self_id,
            socket: value.addr,
            channels: value.channels,
        }
    }
}

impl Handler<Connect> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: Connect, _ctx: &mut Self::Context) -> Self::Result {
        log::info!("New lobby connection: {:?}", msg);
        let Connect {
            channels,
            self_id: uuid,
            zid,
            ..
        } = msg.clone();

        self.sessions.insert(uuid, SessionData::from(msg));
        self.connections.entry(zid).or_default().insert(uuid);

        for channel in &channels {
            log::debug!("Inserting into channel {:?}", channel);
            match channel {
                SocketChannels::Notifications(zid) => self.notifications.entry(*zid),
                SocketChannels::QueueData(q_id) => self.queues.entry(*q_id),
                SocketChannels::Announcements(q_id) => self.annoucements.entry(*q_id),
                SocketChannels::Chat(req_id) => self.chat_rooms.entry(*req_id),
                SocketChannels::Request(req_id) => self.requests.entry(*req_id),
            }
            .or_default()
            .insert(uuid);

            log::warn!("CHAN NOTIF: {:?}", self.notifications);

            if let SocketChannels::Chat(req_id) = channel {
                self.send_chat_playback(*req_id, uuid);
            }
        }
    }
}

impl Handler<WsAction> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: WsAction, _ctx: &mut Self::Context) -> Self::Result {
        log::info!("Lobby Handling WsAction: {:?}", msg);
        match msg {
            WsAction::Def => todo!(),
            WsAction::SendMsg {
                request_id,
                content,
                sender,
            } => self.handle_send_msg(request_id, content, sender),
        }
    }
}

// Implementation of lobby actions that send messages
// back to WsConn
impl Lobby {
    /// For a given chat request, send all messages in the backlog
    /// to the target socket. Helpful for when a new socket
    /// just joins
    fn send_chat_playback(&mut self, request_id: i32, target: Uuid) {
        match self.chat_playback.get(&request_id) {
            Some(backlog) => backlog,
            None => return,
        }
        .iter()
        .map(|(sender, content)| WsMessage::MessageOut {
            request_id,
            content: content.clone(),
            sender: *sender,
        })
        .for_each(|msg| self._send_message(msg, &target));
    }

    fn handle_send_msg(&mut self, request_id: i32, content: String, sender: i32) {
        self.chat_playback
            .entry(request_id)
            .or_default()
            .push((sender, content.clone()));
        let targets = match self.chat_rooms.get(&request_id) {
            Some(sockets) => sockets,
            None => return,
        };
        let message = WsMessage::MessageOut {
            sender,
            content,
            request_id,
        };
        self.broadcast_message(message, targets);
    }
}
