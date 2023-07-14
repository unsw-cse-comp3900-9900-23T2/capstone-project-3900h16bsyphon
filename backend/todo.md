
Add sockets for the following 4 places:
- Notifications
- Order / Queue Changes
- Chat
- Announcements

- Give a route to connect a socket that listens to any of the above

```
GET /ws/notifications
GET /ws/queue/{id}       - For a student to listen to a status
GET /ws/queue/           - For a tutor to listen to *all* queues
GET /ws/chat/{request}   - Tutors have access + student of the chat
GET /ws/announcements    - All to access announcements
```

```rust
enum ListenEvents {
    Notifications(queue: i32),
    QueueData(queue: i32),
    Announcements(queue: i32),
    Chat(request: i32)
}
```


- Actor framework
