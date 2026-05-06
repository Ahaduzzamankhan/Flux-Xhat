# Private Chat Rust Backend

Axum + Tokio backend for a 1-on-1 encrypted chat app. It handles email/password auth, JWT sessions, WebSocket realtime fanout, Firestore metadata persistence, and Cloudflare R2 signed upload URLs. Message bodies are expected to arrive already encrypted by the mobile client; the server persists and forwards only ciphertext.

## Features

- `POST /auth/register` creates a Firebase `users/{uid}` profile and `auth_credentials/{email_key}` password record.
- `POST /auth/login` verifies Argon2 hashes and returns a JWT.
- `GET /auth/me` returns the authenticated profile.
- `POST /chats` creates an idempotent direct chat.
- `GET /chats` lists chats for the current user.
- `GET /chats/{chat_id}` reads one chat after participant authorization.
- `GET /chats/{chat_id}/messages` returns encrypted message metadata in timestamp order.
- `POST /uploads/signed-url` returns a signed Cloudflare R2 PUT URL.
- `GET /ws?token=JWT` opens a WebSocket for encrypted messages, typing, reactions, and presence.

## Run

```powershell
cd backend
copy .env.example .env
# edit .env and add firebase-service-account.json
cargo run
```

The server listens on `APP_HOST:APP_PORT`, defaulting to `0.0.0.0:8080`.

## Required Cloud Setup

1. Firebase
   - Create a Firebase project with Firestore in native mode.
   - Create a service account key and save it as `backend/firebase-service-account.json`.
   - Add the composite indexes in `docs/firestore-indexes.json`.
2. Cloudflare R2
   - Create an R2 bucket.
   - Create an R2 API token with object read/write permissions for the bucket.
   - Configure a public custom domain or worker and set `R2_PUBLIC_BASE_URL`.
3. Backend secrets
   - Generate a long random `JWT_SECRET`.
   - Never commit `.env` or the Firebase service account file.

## WebSocket Events

Client events are JSON tagged by `type`:

```json
{
  "type": "send_message",
  "chat_id": "direct_a_b",
  "recipient_id": "receiver-uid",
  "encrypted_content": "base64-ciphertext",
  "nonce": "base64-nonce",
  "media": []
}
```

Server message fanout:

```json
{
  "type": "message",
  "message": {
    "message_id": "uuid",
    "chat_id": "direct_a_b",
    "sender_id": "sender-uid",
    "recipient_id": "receiver-uid",
    "encrypted_content": "base64-ciphertext",
    "nonce": "base64-nonce",
    "media": [],
    "timestamp": "2026-05-05T12:00:00Z",
    "reactions": {}
  }
}
```

## Security Notes

- The backend never decrypts `encrypted_content`.
- Passwords are hashed using Argon2.
- JWTs are signed with `JWT_SECRET`; rotate by forcing clients to re-authenticate.
- Uploads use short-lived signed PUT URLs.
- Firestore rules should deny direct mobile writes to `auth_credentials`; clients should use the backend API.

