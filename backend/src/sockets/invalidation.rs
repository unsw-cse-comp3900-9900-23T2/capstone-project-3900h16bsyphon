use actix::{fut, Actor, ActorFutureExt, ContextFutureSpawner, Handler, WrapFuture};

use crate::{
    models::{QueueRequest, RequestInfoBody, TokenClaims},
    server::{queue::get_queue_by_id_not_web, request::request_info_not_web},
    sockets::messages::WsMessage,
};

use super::{lobby::Lobby, messages::HttpServerAction, SocketChannels};

impl Handler<HttpServerAction> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: HttpServerAction, ctx: &mut Self::Context) -> Self::Result {
        match msg {
            HttpServerAction::InvalidateKeys(keys) => {
                keys.into_iter().for_each(|k| self.invalidate_key(k, ctx))
            }
        }
    }
}

impl Lobby {
    fn invalidate_key(&mut self, key: SocketChannels, ctx: &mut <Self as Actor>::Context) {
        (match key {
            SocketChannels::Notifications(_) => Self::invalidate_notifications,
            SocketChannels::QueueData(_) => Self::invalidate_queue_data,
            SocketChannels::Request(_) => Self::invalidate_request,
            SocketChannels::Announcements(_) => Self::invalidate_announcements,
            SocketChannels::Chat(_) => Self::invalidate_chat,
        })(self, key.inner_id(), ctx);
    }

    fn invalidate_queue_data(&mut self, queue_id: i32, _ctx: &mut <Self as Actor>::Context) {
        let queue_fut = get_queue_by_id_not_web(queue_id);
        // queue_fut.into_actor(self).then(|res, lobby, _ctx| {
        //     let queue = match res {
        //         Ok(queue) => queue,
        //         Err(e) => {
        //             log::error!("Failed to invalidate queue {}: {}", queue_id, e);
        //             return fut::ready(());
        //         }
        //     };

            fut::ready(())
        });

        unimplemented!("Queue data not handled yet")
    }

    fn invalidate_request(&mut self, request_id: i32, ctx: &mut <Self as Actor>::Context) {
        request_info_not_web(TokenClaims::master(), RequestInfoBody { request_id })
            .into_actor(self)
            .then(move |req_info, lobby, _ctx| {
                // Unpack the request info
                let req_info: QueueRequest = match req_info {
                    Ok(res) => {
                        log::info!("Invalidating request {}", request_id);
                        res
                    }
                    Err(e) => {
                        log::error!("Failed to invalidate request {}: {}", request_id, e);
                        return fut::ready(());
                    }
                };

                let targets = lobby.requests.entry(request_id).or_default().clone();
                let ws_msg = WsMessage::RequestData {
                    request_id,
                    content: req_info,
                };
                lobby.broadcast_message(ws_msg, &targets);

                fut::ready(())
            })
            .wait(ctx);
    }

    fn invalidate_announcements(&mut self, _key: i32, _ctx: &mut <Self as Actor>::Context) {
        unimplemented!("Announcements not handled yet")
    }

    fn invalidate_chat(&mut self, _key: i32, _ctx: &mut <Self as Actor>::Context) {
        log::error!("Chat is handled directly between the actor and the connection");
    }

    fn invalidate_notifications(&mut self, _key: i32, _ctx: &mut <Self as Actor>::Context) {
        unimplemented!("Notifications not handled yet")
    }
}
