use sea_orm::{EntityTrait, ModelTrait};

use crate::{
    entities,
    models::{SyphonError, SyphonResult},
    utils::db::db,
};

pub mod lobby;
pub mod messages;
pub mod start_connect;
pub mod websockets;

#[derive(Copy, Clone, Hash, PartialEq, Eq, Debug)]
/// Enum of channels that sockets can choose to listen on
pub enum SocketChannels {
    Notifications(i32),
    QueueData(i32),
    Request(i32),
    Announcements(i32),
    Chat(i32),
}

impl SocketChannels {
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
    async fn is_allowed_notifications(_q_id: i32, _zid: i32) -> bool {
        true
    }
    /// Checks if the user is allowed to listen to announcements for the given queue
    /// This is always true
    async fn is_allowed_announcements(_q_id: i32, _zid: i32) -> bool {
        true
    }
    /// Checks if the user is allowed to listen to queue data for the given queue
    /// Only true if they are a tutor for the course
    async fn is_allowed_queue_data(q_id: i32, zid: i32) -> bool {
        is_tutor_queue(q_id, zid).await.unwrap_or(false)
    }
    /// Checks if the user is allowed to listen to request data for the given queue
    /// Only true if they are a tutor for the course OR they are the requester
    async fn is_allowed_request(r_id: i32, zid: i32) -> bool {
        is_tutor_or_owns_request(r_id, zid).await.unwrap_or(false)
    }
    /// Checks if the user is allowed to listen to chat for the given queue
    /// Only true if they are a tutor for the course OR they are the requester
    async fn is_allowed_chat(r_id: i32, zid: i32) -> bool {
        is_tutor_or_owns_request(r_id, zid).await.unwrap_or(false)
    }
}

async fn is_tutor_queue(queue_id: i32, zid: i32) -> SyphonResult<bool> {
    let db = db();
    let course_id = entities::queues::Entity::find_by_id(queue_id)
        .one(db)
        .await?
        .ok_or(SyphonError::QueueNotExist(queue_id))?
        .course_offering_id;

    Ok(entities::tutors::Entity::find_by_id((zid, course_id))
        .one(db)
        .await?
        .is_some())
}

async fn is_tutor_or_owns_request(request_id: i32, zid: i32) -> SyphonResult<bool> {
    let request = entities::requests::Entity::find_by_id(request_id)
        .one(db())
        .await?
        .ok_or(SyphonError::RequestNotExist(request_id))?;

    Ok(zid == request.zid || is_tutor_queue(request.queue_id, zid).await?)
}
