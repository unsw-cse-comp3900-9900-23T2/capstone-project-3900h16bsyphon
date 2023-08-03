use actix::{fut, Actor, ActorFutureExt, ContextFutureSpawner, Handler, WrapFuture};
use futures::{future::join, FutureExt};

use crate::models::{QueueRequest, RequestInfoBody};
use crate::server::{
    queue::get_queue_by_id_not_web,
    request::{all_requests_for_queue_not_web, request_info_not_web},
};
use crate::sockets::messages::WsMessage;
use crate::utils::notifs::all_unseen_notifs;

use super::{lobby::Lobby, messages::HttpServerAction, SocketChannels};

impl Handler<HttpServerAction> for Lobby {
    type Result = ();

    fn handle(&mut self, msg: HttpServerAction, ctx: &mut Self::Context) -> Self::Result {
        log::debug!("Lobby Handling HttpServerAction: {:?}", msg);
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

    fn invalidate_queue_data(&mut self, queue_id: i32, ctx: &mut <Self as Actor>::Context) {
        log::debug!("Invalidating queue {}", queue_id);
        let queue_fut = get_queue_by_id_not_web(queue_id);
        let requests_fut = all_requests_for_queue_not_web(queue_id);
        let queue_and_req_fut = join(queue_fut, requests_fut).then(|(q_res, reqs_res)| async {
            match (q_res, reqs_res) {
                (Ok(q), Ok(r)) => Ok((q, r)),
                _ => Err(()),
            }
        });

        queue_and_req_fut
            .into_actor(self)
            .then(move |res, lobby, _ctx| {
                let (queue, requests) = match res {
                    Ok((q, rs)) => (q, rs),
                    Err(_) => {
                        log::error!("Failed to invalidate queue {}", queue_id);
                        return fut::ready(());
                    }
                };

                let targets = lobby.queues.entry(queue_id).or_default().clone();
                let ws_msg = WsMessage::QueueData {
                    queue_id,
                    content: (queue, requests),
                };
                log::debug!(
                    "Broadcasting queue data: {:?} , targets {:?}",
                    ws_msg,
                    targets
                );
                lobby.broadcast_message(ws_msg, &targets);
                fut::ready(())
            })
            .wait(ctx);
    }

    fn invalidate_request(&mut self, request_id: i32, ctx: &mut <Self as Actor>::Context) {
        request_info_not_web(RequestInfoBody { request_id })
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
                log::debug!(
                    "Broadcasting request data: {:?} , targets {:?}",
                    ws_msg,
                    targets
                );
                lobby.broadcast_message(ws_msg, &targets);

                fut::ready(())
            })
            .wait(ctx);
    }

    fn invalidate_announcements(&mut self, _key: i32, _ctx: &mut <Self as Actor>::Context) {
        unimplemented!("Announcements not handled here")
    }

    fn invalidate_chat(&mut self, _key: i32, _ctx: &mut <Self as Actor>::Context) {
        log::error!("Chat is handled direntry(key).or_default().clone();ectly between the actor and the connection");
    }

    fn invalidate_notifications(&mut self, key: i32, ctx: &mut <Self as Actor>::Context) {
        let targets = self.notifications.entry(key).or_default().clone();
        log::debug!(
            "Invalidating notifications for {} of targets: {:?}",
            key,
            targets
        );
        if targets.is_empty() {
            return;
        }
        let notifs_fut = all_unseen_notifs(key);
        notifs_fut
            .into_actor(self)
            .then(move |notifs, lobby, _ctx| {
                let msgs: Vec<WsMessage> = match notifs {
                    Ok(notifs) => notifs.into_iter().map(WsMessage::from).collect(),
                    Err(e) => {
                        log::error!("Failed to invalidate notifications for {}: {}", key, e);
                        return fut::ready(());
                    }
                };
                for msg in msgs {
                    lobby.broadcast_message(msg, &targets);
                }

                fut::ready(())
            })
            .wait(ctx);
    }
}
