# Firebase Module

Firebase Firestore database integration for persistent data storage.

## Files

- **mod.rs** — Database operation handlers

## Collections

- **users/{uid}** — User profiles (email, username, avatar, public_key)
- **chats/{chat_id}** — Chat metadata (participants, created_at)
- **chats/{chat_id}/messages/{msg_id}** — Message metadata (encrypted content, nonce, reactions)
- **auth_credentials/{email_key}** — Hashed passwords (not accessible by mobile clients)

## Key Operations

- `create_user()` — Insert user profile and auth credentials
- `get_user()` — Fetch user by UID
- `find_user_by_email()` — Lookup user by email for login
- `create_chat()` — Create or retrieve direct chat
- `save_message()` — Store encrypted message metadata
- `get_chat_messages()` — Fetch message history
- `update_message_reactions()` — Store emoji reactions

## Security Rules

- Mobile clients can read/write only their own user profile
- Direct chats are read/writable only by participants
- `auth_credentials` collection is read-only by backend service account
- Firestore indexes in `docs/firestore-indexes.json` optimize queries

## Data Model

Messages stored encrypted:
```json
{
  "message_id": "uuid",
  "sender_id": "uid",
  "recipient_id": "uid",
  "encrypted_content": "base64",
  "nonce": "base64",
  "media": [],
  "timestamp": "2026-05-05T12:00:00Z",
  "reactions": { "emoji": ["uid1", "uid2"] }
}
```
