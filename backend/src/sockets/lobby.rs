use actix::Actor;
use actix::Context;
use actix::Handler;
use actix::Recipient;
use std::collections::BTreeSet;
use std::collections::HashMap;

use crate::sockets::messages::WsMessage;
use uuid::Uuid;

use super::messages::Connect;
use super::messages::Disconnect;
use super::messages::DisconnectAll;
use super::SocketChannels;

type Socket = Recipient<WsMessage>;

pub struct Lobby {
    /// Map zid to all connections for this person
    connections: HashMap<i32, BTreeSet<Uuid>>,
    /// SocketId -> (zid, Socket) / Maybe not needed?
    sessions: HashMap<Uuid, SessionData>,
    /// Map request_id to all sockets listeninig to that chat
    chat_rooms: HashMap<i32, BTreeSet<Uuid>>,
    /// Map request_id to all sockets listening to that req
    requests: HashMap<i32, BTreeSet<Uuid>>,
    /// Map queue_id to all sockets listening to annoucements
    annoucements: HashMap<i32, BTreeSet<Uuid>>,
    // TODO: queue data - more complex
    queues: HashMap<i32, BTreeSet<Uuid>>,
}

impl Lobby {
    fn _send_message(&self, message: &str, target_id: &Uuid) {
        match self.sessions.get(target_id) {
            Some(session) => session.socket.do_send(WsMessage(message.to_string())),
            None => {
                log::warn!("Cannot send message. No session for {}", target_id);
            }
        }
    }
}

impl Default for Lobby {
    fn default() -> Self {
        Self {
            connections: HashMap::new(),
            sessions: HashMap::new(),
            chat_rooms: HashMap::new(),
            requests: HashMap::new(),
            annoucements: HashMap::new(),
            queues: HashMap::new(),
        }
    }
}

impl Actor for Lobby {
    type Context = Context<Self>;
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
                SocketChannels::Notifications(_) => todo!(),
                SocketChannels::QueueData(q_id) => self.queues.entry(q_id),
                SocketChannels::Announcements(q_id) => self.annoucements.entry(q_id),
                SocketChannels::Chat(r_id) => self.chat_rooms.entry(r_id),
                SocketChannels::Request(r_id) => self.requests.entry(r_id),
            }
            .or_default()
            .remove(&id);
        }

        socket.do_send(WsMessage("Disconnected".to_string()));
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

struct SessionData {
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
        let Connect {
            channels,
            self_id: uuid,
            zid,
            ..
        } = msg.clone();
        self.sessions.insert(uuid, SessionData::from(msg));
        self.connections.entry(zid).or_default().insert(uuid);
        // Insert into corresponding channels if not there
        for channel in channels {
            match channel {
                SocketChannels::Notifications(_queue_id) => todo!(),
                SocketChannels::QueueData(q_id) => {
                    self.annoucements.entry(q_id).or_default().insert(uuid);
                }
                SocketChannels::Announcements(q_id) => {
                    self.annoucements.entry(q_id).or_default().insert(uuid);
                }
                SocketChannels::Chat(req_id) => {
                    self.chat_rooms.entry(req_id).or_default().insert(uuid);
                }
                SocketChannels::Request(req_id) => {
                    self.chat_rooms.entry(req_id).or_default().insert(uuid);
                }
            }
        }
    }
}
