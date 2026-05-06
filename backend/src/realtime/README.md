# Realtime Module

WebSocket connection management for real-time message delivery and presence notifications.

## Files

- **mod.rs** — WebSocket handler and connection manager

## Connection Flow

1. Client connects: `GET /ws?token=JWT`
2. Server validates JWT token
3. Establishes WebSocket connection
4. Server broadcasts incoming messages to recipient
5. Server sends typing indicators and presence updates
6. Connection closes on client disconnect or timeout

## Message Types

### Client → Server

```json
{
  "type": "send_message",
  "chat_id": "...",
  "recipient_id": "...",
  "encrypted_content": "...",
  "nonce": "...",
  "media": []
}
```

```json
{
  "type": "typing",
  "chat_id": "...",
  "recipient_id": "...",
  "is_typing": true
}
```

```json
{
  "type": "reaction",
  "chat_id": "...",
  "message_id": "...",
  "emoji": "👍"
}
```

### Server → Client

```json
{
  "type": "message",
  "message": { /* full message object */ }
}
```

```json
{
  "type": "typing",
  "chat_id": "...",
  "sender_id": "...",
  "is_typing": true
}
```

```json
{
  "type": "presence",
  "user_id": "...",
  "online": true
}
```

## State Management

- In-memory connection registry (HashMap of active connections)
- Routes messages only to connected recipients
- Persists undelivered messages in Firestore if recipient offline
- Cleans up stale connections on server restart
