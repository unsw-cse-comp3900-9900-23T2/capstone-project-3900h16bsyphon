use actix::fut;
use actix::spawn;
use actix::Actor;
use actix::ActorFutureExt;
use actix::Context;
use actix::ContextFutureSpawner;
use actix::Handler;
use actix::Recipient;
use actix::WrapFuture;
use actix_web::web;
use futures::future::join_all;
use std::collections::BTreeSet;
use std::collections::HashMap;
use std::convert::identity;

use crate::sockets::messages::WsMessage;
use uuid::Uuid;

use super::messages::Connect;
use super::messages::Disconnect;
use super::messages::DisconnectAll;
use super::messages::WsAction;
use super::SocketChannels;

type Socket = Recipient<WsMessage>;

pub struct Lobby {
    sessions: HashMap<Uuid, SessionData>,
    /// Map zid to all connections for this person
    connections: HashMap<i32, BTreeSet<Uuid>>,
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
    /// Send message to a singular socket
    fn _send_message(&self, message: WsMessage, target_id: &Uuid) {
        match self.sessions.get(target_id) {
            Some(session) => session.socket.do_send(message),
            None => {
                log::warn!("Cannot send message. No session for {}", target_id);
            }
        }
    }

    /// Broadcast a message to all sockets in a room
    fn broadcast_message(&self, message: WsMessage, targets: &BTreeSet<Uuid>) {
        for target in targets {
            self._send_message(message.clone(), target);
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

    fn handle(&mut self, msg: Connect, ctx: &mut Self::Context) -> Self::Result {
        let Connect {
            channels,
            self_id: uuid,
            zid,
            ..
        } = msg.clone();

        // Validate that the user is allowed to join all channels
        // they claimed. If anything invalid, remove them
        // from sessions and proceed
        // web::block
        let channels2 = channels.clone();
        join_all(channels.into_iter().map(move |c| c.is_allowed(zid.clone())))
            .into_actor(self)
            .then(move |res, act, _ctx| {
                // Any false => not allowed
                if res.iter().any(|v| !v) {
                    act._send_message(WsMessage::Text("FORBIDDEN: DIE".into()), &uuid);
                    return fut::ready(());
                }
                act.sessions.insert(uuid, SessionData::from(msg));
                act.connections.entry(zid).or_default().insert(uuid);
                // Insert into corresponding channels if not there
                for channel in &channels2 {
                    match channel {
                        SocketChannels::Notifications(_queue_id) => todo!(),
                        SocketChannels::QueueData(q_id) => act.annoucements.entry(*q_id),
                        SocketChannels::Announcements(q_id) => act.annoucements.entry(*q_id),
                        SocketChannels::Chat(req_id) => act.chat_rooms.entry(*req_id),
                        SocketChannels::Request(req_id) => act.chat_rooms.entry(*req_id),
                    }
                    .or_default()
                    .insert(uuid);
                }
                fut::ready(())
            })
            .wait(ctx);
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
    fn handle_send_msg(&self, request_id: i32, content: String, sender: i32) {
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
