# Backend Source Code

Core Rust backend application logic using Axum web framework.

## Module Structure

- **main.rs** — Application entry point, server initialization, route setup
- **config.rs** — Environment variable loading and app configuration
- **state.rs** — Shared application state (database clients, cache, etc.)
- **models.rs** — Data structures for users, chats, messages
- **error.rs** — Custom error types and error handling middleware
- **auth/** — Authentication logic (JWT, password hashing, token validation)
- **routes/** — HTTP endpoint handlers (auth, chats, uploads, WebSocket)
- **firebase/** — Firebase Firestore database operations
- **r2/** — Cloudflare R2 object storage integration
- **realtime/** — WebSocket connection management and message fanout

## Architecture

```
Request → Middleware (error handling) → Route handler → State/DB → Response
                                                ↓
                                           WebSocket (fanout)
```

## Key Concepts

- **JWT Auth**: Token-based authentication for stateless session handling
- **Firestore**: NoSQL database for user profiles, chats, and message metadata
- **R2 Uploads**: Signed URLs for secure file uploads to object storage
- **WebSocket**: Real-time message delivery and typing indicators
- **E2EE**: Backend stores encrypted messages; never decrypts content

## Building & Running

```bash
cd backend
cargo run --release
```

The server listens on `APP_HOST:APP_PORT` (default: `0.0.0.0:8080`).
