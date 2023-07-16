pub mod lobby;
pub mod messages;
pub mod start_connect;
pub mod websockets;

#[derive(Copy, Clone, Hash, PartialEq, Eq, Debug)]
/// Enume of channels that sockets can choose to listen on
pub enum SocketChannels {
    Notifications(i32),
    QueueData(i32),
    Request(i32),
    Announcements(i32),
    Chat(i32),
}

impl SocketChannels {
    fn inner_id(&self) -> i32 {
        match self {
            SocketChannels::Notifications(id) => *id,
            SocketChannels::QueueData(id) => *id,
            SocketChannels::Request(id) => *id,
            SocketChannels::Announcements(id) => *id,
            SocketChannels::Chat(id) => *id,
        }
    }

    pub async fn is_allowed(self, zid: i32) -> bool {
        match self {
            SocketChannels::Notifications(id) => Self::is_allowed_notifications(id, zid).await,
            SocketChannels::QueueData(id) => Self::is_allowed_queue_data(id, zid).await,
            SocketChannels::Request(id) => Self::is_allowed_request(id, zid).await,
            SocketChannels::Announcements(id) => Self::is_allowed_announcements(id, zid).await,
            SocketChannels::Chat(id) => Self::is_allowed_chat(id, zid).await,
        }
    }

    /// Checks if the user is allowed to listen to notifications for the given queue
    /// This is always true
    async fn is_allowed_notifications(q_id: i32, zid: i32) -> bool {
        true
    }
    /// Checks if the user is allowed to listen to queue data for the given queue
    /// Only true if they are a tutor for the course
    async fn is_allowed_queue_data(q_id: i32, zid: i32) -> bool {
        todo!()
    }
    /// Checks if the user is allowed to listen to request data for the given queue
    /// Only true if they are a tutor for the course OR they are the requester
    async fn is_allowed_request(q_id: i32, zid: i32) -> bool {
        todo!()
    }
    /// Checks if the user is allowed to listen to announcements for the given queue
    /// This is always true
    async fn is_allowed_announcements(q_id: i32, zid: i32) -> bool {
        true
    }
    /// Checks if the user is allowed to listen to chat for the given queue
    /// Only true if they are a tutor for the course OR they are the requester
    async fn is_allowed_chat(q_id: i32, zid: i32) -> bool {
        todo!()
    }
}
