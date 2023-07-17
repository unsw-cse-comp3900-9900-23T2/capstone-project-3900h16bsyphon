use actix::{Actor, Handler};

use super::{
    lobby::Lobby,
    messages::{HttpServerAction, InvalidateKeys},
    SocketChannels,
};

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

    fn invalidate_queue_data(&mut self, _queue_id: i32, _ctx: &mut <Self as Actor>::Context) {
        unimplemented!("Queue data not handled yet")
    }

    fn invalidate_request(&mut self, _request_id: i32, _ctx: &mut <Self as Actor>::Context) {
        unimplemented!("Requests not handled yet")
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
