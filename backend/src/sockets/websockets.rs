use actix::{
    fut, Actor, ActorContext, ActorFutureExt, Addr, AsyncContext, ContextFutureSpawner, Handler,
    Running, StreamHandler, WrapFuture,
};
use actix_web_actors::ws;
use log;
use serde_json::json;
use std::time::{Duration, Instant};
use uuid::Uuid;

use crate::sockets::{
    lobby::Lobby,
    messages::{try_parse_ws_action, Connect, Disconnect},
};
use crate::utils::auth::validate_raw_token;

use super::messages::WsMessage;
use super::SocketChannels;
// use crate::lobby::Lobby; // as well as this
//

const HEARTBEAT_INTERVAL: Duration = Duration::from_secs(10);
const CLIENT_TIMEOUT: Duration = Duration::from_secs(30);

#[derive(Debug)]
pub struct WsConn {
    /// zid of the user who created this connection
    zid: Option<i32>,
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
    pub fn new(channels: Vec<SocketChannels>, lobby_addr: Addr<Lobby>) -> Self {
        Self {
            zid: None,
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
                log::info!(
                    "Disconnecting failed heartbeat on {:?}; Socket: {}",
                    zid,
                    id
                );
                act.lobby_addr.do_send(Disconnect { id: act.id });
                ctx.stop();
                return;
            }

            ctx.ping(b"PING");
        });
    }

    fn is_authed(&self) -> bool {
        self.zid.is_some()
    }

    fn try_auth(&mut self, raw_tok: &str, ctx: &mut <Self as Actor>::Context) {
        validate_raw_token(raw_tok.into())
            .into_actor(self)
            .then(move |res, conn, ctx| match res {
                Ok(tok) => {
                    ctx.text(json!({"type": "auth", "success": true}).to_string());
                    conn.zid = Some(tok.username);
                    conn.connect_to_lobby(ctx);
                    fut::ready(())
                }
                Err(_) => {
                    log::info!("Conn failed to auth: {}", conn.id);
                    ctx.text(json!({"type": "auth", "success": false}).to_string());
                    ctx.stop();
                    fut::ready(())
                }
            })
            .wait(ctx);
    }

    /// Tries to connect to lobby
    /// # Safety
    /// You MUST ensure that the actor has been authed before calling this.
    fn connect_to_lobby(&self, ctx: &mut <Self as Actor>::Context) {
        log::debug!("Connecting to lobby: {}", self.id);
        // TODO: cleanup notif to not actly have a field
        let channels = self
            .channels
            .clone()
            .into_iter()
            .map(|c| match c {
                SocketChannels::Notifications(_) => SocketChannels::Notifications(self.get_zid()),
                chan => chan,
            })
            .collect::<Vec<_>>();
        self.lobby_addr
            .send(Connect {
                addr: ctx.address().recipient(),
                channels,
                self_id: self.id,
                zid: self.get_zid(),
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

    fn get_zid(&self) -> i32 {
        self.zid.expect("Not Called Before Auth")
    }
}

impl Actor for WsConn {
    type Context = ws::WebsocketContext<Self>;

    fn started(&mut self, ctx: &mut Self::Context) {
        // Only do heartbeat. Do not actually send a Connect
        // to the lobby just yet. Do that on auth
        self.hb(ctx);
        log::info!("Starting connection: {}", self.id);
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
        log::trace!(
            "WsConn Recieved {:?};\n\tHandler zid: {:?}; Connection: {:?}",
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
            Ok(ws::Message::Text(s)) => {
                let raw_text = String::from(s);
                // Should NOT be left in prod as it will capture BearerTokens
                log::debug!("Recieved message as String: {}", raw_text);

                // On connection, first message must be auth, or this actor
                // will Robin Williams itself
                if !self.is_authed() {
                    self.try_auth(&raw_text, ctx);
                    return;
                }

                let action = match try_parse_ws_action(&raw_text, self.get_zid()) {
                    Ok(action) => action,
                    Err(e) => {
                        log::info!("Failed to parse action: {:?} for z{}", e, self.get_zid());
                        return;
                    }
                };

                self.lobby_addr.do_send(action);
            }
            Err(_) => todo!("handle this or die ig?"),
        }
    }
}

impl Handler<WsMessage> for WsConn {
    type Result = ();

    fn handle(&mut self, msg: WsMessage, ctx: &mut Self::Context) -> Self::Result {
        let as_json = msg.as_json();
        log::info!(
            "Conn z{} Socket {} handling {:?}",
            self.get_zid(),
            self.id,
            as_json
        );
        ctx.text(as_json.to_string());
    }
}
