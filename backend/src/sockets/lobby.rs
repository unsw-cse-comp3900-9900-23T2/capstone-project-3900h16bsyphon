use actix::Actor;
use actix::Context;
use actix::Handler;
use actix::Recipient;
use std::collections::HashMap;

use crate::sockets::messages::WsMessage;
use uuid::Uuid;

use super::messages::ClientActorMessage;
use super::messages::Connect;
use super::messages::Disconnect;

type Socket = Recipient<WsMessage>;

// TODO: use DashMap - worry abt Send / Sync
pub struct Lobby {
    /// Map zid to all connections for this person
    connections: HashMap<i32, Vec<Socket>>,
    /// request to thing
    sessions: HashMap<Uuid, Socket>,
    /// Map request_id to all sockets listeninig to that chat
    chat_rooms: HashMap<i32, Vec<Socket>>,
    /// Map queue_id to all sockets listening to annoucements
    annoucements: HashMap<i32, Vec<Socket>>,
    // TODO: queue data - more complex
    queues: HashMap<i32, Vec<Socket>>,
}

impl Lobby {
    fn send_message(&self, message: &str, target_id: &Uuid) {
        match self.sessions.get(target_id) {
            Some(socket_recipient) => socket_recipient.do_send(WsMessage(message.to_string())),
            None => {
                println!("No socket found for id {}", target_id);
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

    fn handle(&mut self, msg: Disconnect, ctx: &mut Self::Context) -> Self::Result {
        if let Some(_) = self.sessions.remove(&msg.id) {
            self.rooms
                .get(&msg.room_id)
                .unwrap()
                .iter()
                .filter(|conn_id| *conn_id.to_owned() != msg.id)
                .for_each(|user_id| {
                    self.send_message(&format!("{} disconnected", &msg.id), user_id)
                });
        }
        // Remove Client from lobby or, clean up entire room
        // if no other clients are connected
        if let Some(lobby) = self.rooms.get_mut(&msg.room_id) {
            match lobby.len() > 1 {
                true => drop(lobby.remove(&msg.id)),
                false => drop(self.rooms.remove(&msg.room_id)),
            }
        }
    }
}

impl Handler<Connect> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: Connect, ctx: &mut Self::Context) -> Self::Result {
        ()
    }
}

impl Handler<WsMessage> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) -> Self::Result {
        ()
    }
}

impl Handler<ClientActorMessage> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: ClientActorMessage, ctx: &mut Self::Context) -> Self::Result {
        ()
    }
}
