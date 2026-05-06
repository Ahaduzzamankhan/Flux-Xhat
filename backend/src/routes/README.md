# Routes Module

HTTP endpoint handlers organized by feature.

## Files

- **mod.rs** — Route initialization and router setup
- **health.rs** — Health check endpoint for deployment monitoring
- **auth.rs** — Login, register, and profile endpoints
- **chats.rs** — Chat creation, listing, and message retrieval
- **uploads.rs** — Signed URL generation for R2 file uploads
- **users.rs** — User search and profile lookups
- **ws.rs** — WebSocket connection handling and message fanout

## Endpoint Summary

### Auth Routes
- `POST /auth/register` — Create new user
- `POST /auth/login` — Authenticate and get JWT
- `GET /auth/me` — Current authenticated user profile

### Chat Routes
- `POST /chats` — Create 1-on-1 chat
- `GET /chats` — List user's chats
- `GET /chats/:chat_id` — Get chat details
- `GET /chats/:chat_id/messages` — Fetch encrypted messages

### User Routes
- `GET /users/search?q=...` — Search users by email/username
- `GET /users/:uid` — Get user profile
- `PATCH /users/me` — Update authenticated user profile

### Upload Routes
- `POST /uploads/signed-url` — Get signed R2 PUT URL

### WebSocket
- `GET /ws?token=JWT` — WebSocket connection for real-time messaging

## Error Handling

Each route validates input, checks auth permissions, and returns appropriate HTTP status codes:
- `200` — Success
- `400` — Bad request / validation error
- `401` — Unauthorized
- `404` — Not found
- `500` — Server error
