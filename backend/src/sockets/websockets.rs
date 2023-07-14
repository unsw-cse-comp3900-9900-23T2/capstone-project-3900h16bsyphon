use actix::{fut, ActorContext, ActorFutureExt};
use actix::{Actor, ActorFuture, Addr, ContextFutureSpawner, Running, StreamHandler, WrapFuture};
use actix::{AsyncContext, Handler};
use actix_web_actors::ws;
use actix_web_actors::ws::Message::Text;
use log;
use std::time::{Duration, Instant};
use uuid::Uuid;

use crate::sockets;
use sockets::{
    lobby::Lobby,
    messages::{ClientActorMessage, Connect, Disconnect},
};

use super::messages::WsMessage;
use super::SocketChannels;
// use crate::lobby::Lobby; // as well as this
//

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(10);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Debug)]
pub struct WsConn {
    /// zid of the user who created this connection
    zid: i32,
    /// ID assigned to us by the socket
    id: Uuid,
    /// Each socket exists in a `room` (map from Uuid to socket id)
    channels: Vec<SocketChannels>,
    /// Address of lobby that this socket exists in
    lobby_addr: Addr<Lobby>,
    /// Heartbeat. Used to check if socket is still alive every N seconds
    hb: Instant,
}

impl WsConn {
    pub fn new(zid: i32, channels: Vec<SocketChannels>, lobby_addr: Addr<Lobby>) -> Self {
        Self {
            zid,
            id: Uuid::new_v4(),
            channels,
            lobby_addr,
            hb: Instant::now(),
        }
    }

    fn hb(&self, ctx: &mut ws::WebsocketContext<Self>) {
        let Self { zid, id, .. } = *self;
        ctx.run_interval(HEARTBEAT_INTERVAL, move |act, ctx| {
            if Instant::now().duration_since(act.hb) > CLIENT_TIMEOUT {
                log::info!("Disconnecting failed heartbeat on {}; Socket: {}", zid, id);
                act.lobby_addr.do_send(Disconnect { id: act.id });
                ctx.stop();
                return;
            }

            ctx.ping(b"PING");
        });
    }
}

impl Actor for WsConn {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        self.hb(ctx);
        log::info!("Starting connection: {}", self.id);

        self.lobby_addr
            .send(Connect {
                addr: ctx.address().recipient(),
                channels: self.channels.clone(),
                self_id: self.id,
                zid: self.zid,
            })
            .into_actor(self)
            .then(|res, _, ctx| {
                match res {
                    Ok(_res) => (),
                    _ => ctx.stop(),
                }
                fut::ready(())
            })
            .wait(ctx);
    }

    fn stopping(&mut self, _: &mut Self::Context) -> Running {
        // Don't need to await. We don't care if this message gets read.
        // We kill ourselves anyways
        self.lobby_addr.do_send(Disconnect { id: self.id });
        Running::Stop
    }
}

impl StreamHandler<Result<ws::Message, ws::ProtocolError>> for WsConn {
    fn handle(&mut self, msg: Result<ws::Message, ws::ProtocolError>, ctx: &mut Self::Context) {
        log::info!(
            "WsConn Recieved {:?};\n\tHandler zid: {}; Connection: {:?}",
            msg,
            self.zid,
            self.id
        );
        match msg {
            Ok(ws::Message::Ping(msg)) => {
                self.hb = Instant::now();
                ctx.pong(&msg);
            }
            Ok(ws::Message::Pong(_)) => {
                self.hb = Instant::now();
            }
            Ok(ws::Message::Binary(bin)) => ctx.binary(bin),
            Ok(ws::Message::Close(reason)) => {
                ctx.close(reason);
                ctx.stop();
            }
            // dont think we need to deal w/ continuation frames
            Ok(ws::Message::Continuation(_)) => {
                ctx.stop();
            }
            Ok(ws::Message::Nop) => (),
            // Let the lobby deal w/ text messages and figure out where to
            // redirect
            Ok(Text(s)) => {
                // ctx.binary("data");
                ctx.text("{\"type\": \"text\", \"data\": \"data\"}");
                log::debug!("Is a message of the text type");
                let s1 = String::from(s);
                log::debug!("As String: {}", s1);
                // Current not actually taking in any messages from the client
                // For chat, will probably do this through clients only
                // Other stuff will just be done through HTTP actions
                // self.lobby_addr.do_send(ClientActorMessage {
                //     id: self.id,
                //     msg: s.into(),
                // })
            }
            Err(_) => todo!("handle this or die ig?"),
        }
    }
}

impl Handler<WsMessage> for WsConn {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) -> Self::Result {
        ctx.text(msg.0)
    }
}
