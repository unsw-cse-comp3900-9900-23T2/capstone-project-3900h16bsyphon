pub mod lobby;
pub mod messages;
pub mod start_connect;
pub mod websockets;

#[derive(Copy, Clone, Hash, PartialEq, Eq, Debug)]
/// Enume of channels that sockets can choose to listen on
enum SocketChannels {
    Notifications(i32),
    QueueData(i32),
    Announcements(i32),
    Chat(i32),
}
