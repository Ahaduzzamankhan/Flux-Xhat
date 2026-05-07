# Fluxenite Chat — Codebase Guide for AI Assistants

A production-ready end-to-end encrypted chat application. This document describes the architecture, technology stack, module structure, and key patterns used throughout the codebase.

---

## Project Overview

**Fluxenite Chat** is a 1-on-1 encrypted messaging app with the following stack:

- **Mobile**: React Native (TypeScript) for Android/iOS
- **Backend**: Rust (Axum web framework) with async/await
- **Database**: Firebase Firestore (NoSQL)
- **Storage**: Cloudflare R2 (S3-compatible object storage)
- **Encryption**: TweetNaCl.js (X25519 + AES-GCM) for E2EE
- **Real-time**: WebSocket for live message delivery
- **Authentication**: JWT + Argon2 password hashing
- **Package Manager**: pnpm (mobile), cargo (backend)

---

## Architecture Diagram

```
┌─────────────────────────┐
│    Mobile App           │
│  (React Native + TS)    │
├─────────────────────────┤
│ Auth | Chat | Crypto    │
│ Navigation | Store      │
└──────────┬──────────────┘
           │
      REST │ WebSocket
           │
┌──────────▼──────────────┐
│    Rust Backend         │
│   (Axum + Tokio)        │
├──────────────────────────┤
│ Auth | Routes | RealTime│
│ Firebase | R2 | Errors  │
└──────────┬──────────────┘
      │         │
      │         ├─────────────┐
      │         │             │
      ▼         ▼             ▼
   Firestore  R2 Storage  Secrets
   (Metadata) (Media)    (Env Vars)
```

---

## Folder Structure

### Root Level

```
chat-app/
├── backend/              # Rust backend server
├── mobile/               # React Native mobile app
├── docs/                 # API docs, firestore rules, indexes
├── .Claude/              # AI assistant utilities (this folder)
├── .vscode/              # VS Code workspace config
├── .gitignore            # Git ignore rules
├── README.md             # Project setup guide
└── SETUP.md              # Deployment instructions
```

### Backend Structure

```
backend/
├── src/
│   ├── main.rs           # Entry point, server init
│   ├── config.rs         # Environment loading
│   ├── state.rs          # Shared app state
│   ├── models.rs         # Data structures
│   ├── error.rs          # Error handling
│   ├── auth/             # JWT + password auth
│   ├── routes/           # HTTP endpoints
│   ├── firebase/         # Firestore operations
│   ├── r2/               # R2 upload logic
│   └── realtime/         # WebSocket handler
├── Cargo.toml            # Rust dependencies
├── rust-toolchain.toml   # Rust version lock
├── Dockerfile            # Docker build config
├── .env.example          # Environment template
└── README.md             # Backend guide
```

### Mobile Structure

```
mobile/
├── src/
│   ├── api/              # Backend clients
│   ├── components/       # Reusable UI
│   ├── screens/          # Full-screen views
│   ├── store/            # Zustand state
│   ├── navigation/       # Route config
│   ├── crypto/           # E2EE encryption
│   ├── firebase.ts       # Firebase init
│   ├── theme.ts          # Design system
│   ├── types.ts          # TS interfaces
│   └── types/            # Additional types
├── android/              # Android native code
├── package.json          # Dependencies (pnpm)
├── pnpm-lock.yaml        # Dependency lock
├── App.tsx               # Root component
├── tsconfig.json         # TS config
└── README.md             # Mobile guide
```

---

## Core Technology Patterns

### Authentication Flow

```
1. User registers
   └─ POST /auth/register (email, password)
   └─ Backend: Hash password (Argon2), create Firestore user profile
   └─ Return: JWT token

2. User logs in
   └─ POST /auth/login (email, password)
   └─ Backend: Verify password hash
   └─ Return: JWT token

3. Protected requests
   └─ Client includes: Authorization: Bearer <JWT>
   └─ Backend verifies signature with JWT_SECRET
   └─ If valid: Extract user UID from claims
   └─ If invalid: Return 401 Unauthorized
```

### End-to-End Encryption

```
Key Generation (User Registration):
├─ generate_keypair() → (secret_key, public_key)
├─ Store secret_key in device AsyncStorage
└─ Upload public_key to Firestore

Message Encryption (Sender):
├─ Fetch recipient's public_key from Firestore
├─ Compute ECDH shared_secret using recipient public_key
├─ Generate random nonce (24 bytes)
├─ AES-GCM encrypt message with shared_secret + nonce
└─ Send (ciphertext, nonce) to backend

Message Decryption (Recipient):
├─ Receive (ciphertext, nonce) via WebSocket
├─ Compute ECDH shared_secret using sender public_key
├─ AES-GCM decrypt using shared_secret + nonce
└─ Display plaintext message
```

### Real-time Message Flow

```
WebSocket Connection:
├─ Client: GET /ws?token=JWT
├─ Server: Validate JWT
├─ Connection: Established
└─ Server: Add to active connections map

Sending Message:
├─ Client: Encrypt message
├─ Client: Send via WebSocket { type: "send_message", ... }
├─ Server: Validate format
├─ Server: Save to Firestore
├─ Server: Forward to recipient (if online)
└─ Recipient: Receive + decrypt → display

Offline Handling:
├─ If recipient offline
├─ Server: Save to Firestore anyway
├─ Recipient: Fetch history when reconnects
└─ Result: No message loss
```

---

## State Management (Zustand Store)

### Global App State Structure

```typescript
interface AppState {
  // Authentication
  token: string | null;           // JWT token
  user: UserProfile | null;       // Logged-in user
  serverUrl: string | null;       // Backend URL (multi-server support)

  // Chat data
  chats: Chat[];                  // List of 1-on-1 chats
  messages: Record<string, MessageMetadata[]>;  // Chat ID → messages

  // Real-time state
  typing: Record<string, boolean>;   // Chat ID → typing indicator
  online: Record<string, boolean>;   // User ID → online status

  // Actions
  setSession(token, user);
  clearSession();
  restoreSession();
  setServerUrl(url);
  clearServerUrl();
  setChats(chats);
  setMessages(chatId, messages);
  appendMessage(chatId, message);
  setTyping(chatId, typing);
  setOnline(userId, online);
}
```

### Persistence

- **AsyncStorage**: Auth token, user profile, server URL (survives app restart)
- **In-memory**: Message history, typing state, online status (cleared on restart)
- **Firestore**: All persistent data (messages, profiles, chats)

---

## Backend Module Responsibilities

### auth/
- JWT creation and verification
- Argon2 password hashing
- Axum middleware extractors for authenticated routes

### routes/
- HTTP endpoint handlers
- Input validation and error responses
- Auth checks and permission enforcement

### firebase/
- Firestore CRUD operations
- Collection structure: users, chats, messages, auth_credentials
- Query optimization with indexes

### r2/
- Signed URL generation for direct browser uploads
- File metadata management
- Integration with Cloudflare R2 API

### realtime/
- WebSocket connection management
- Message routing to connected clients
- Presence updates and typing indicators

### error.rs
- Custom error types (ApiError, AuthError, etc.)
- Automatic HTTP status code mapping
- JSON error responses

---

## Mobile Module Responsibilities

### api/
- Backend HTTP client (Axios with dynamic baseURL)
- WebSocket connection manager
- Auth token injection on all requests

### components/
- AppButton, AppTextInput, Avatar, MessageBubble, ScreenHeader
- Styling via theme system
- Accessibility support (labels, color contrast, touch targets)

### screens/
- ServerSetup: Backend URL configuration
- Login/Register: Authentication
- ChatList: Home screen with chat preview
- Chat: Message view with real-time updates
- Profile: User settings and logout

### store/
- Zustand state container
- AsyncStorage persistence hooks
- Action creators for state mutations

### crypto/
- TweetNaCl wrapper functions
- Key generation, encryption, decryption
- Nonce generation for replay attack prevention

### navigation/
- React Navigation stack configuration
- Conditional routing based on auth state
- Route parameter definitions

---

## Key Design Decisions

### Why Rust for Backend?

- **Performance**: High throughput, low latency for WebSocket fanout
- **Type Safety**: Compile-time checks prevent common bugs
- **Memory Efficiency**: No garbage collection pauses
- **Ecosystem**: Excellent async/await with Tokio framework

### Why React Native for Mobile?

- **Code Reuse**: Single TypeScript codebase for Android/iOS
- **Time-to-Market**: Faster development than native
- **Community**: Mature ecosystem with many libraries
- **Firebase Integration**: Native modules available

### Why Firestore?

- **Serverless**: No backend database ops, scales automatically
- **Real-time Subscriptions**: Built-in listeners for live updates
- **Security Rules**: Declarative access control at database layer
- **Indexes**: Auto-indexed for common queries

### Why E2EE?

- **Privacy**: Server cannot read message content
- **Trust**: Users control encryption keys
- **Compliance**: Meets regulations (GDPR, etc.)
- **Security**: Even if server compromised, messages safe

---

## Common Development Tasks

### Adding a New Endpoint

1. Define request/response types in `models.rs`
2. Create handler function in `routes/<feature>.rs`
3. Register route in `routes/mod.rs` router builder
4. Add auth check if needed via `AuthExtractor`
5. Test with `docs/api.http`

### Adding a New API Client Function

1. Create function in `mobile/src/api/<feature>.ts`
2. Use `api` instance from `api.ts`
3. Include `authHeaders(token)` for protected endpoints
4. Handle errors and return typed response

### Adding a New Screen

1. Create `mobile/src/screens/NewScreen.tsx`
2. Define route in `navigation/index.tsx` RootStackParamList
3. Add route to navigator
4. Use `useStore` hooks for state
5. Use `useNavigation` for routing

### Adding Firebase Collection

1. Define in Firestore console
2. Add indexes in `docs/firestore-indexes.json`
3. Create CRUD functions in `backend/src/firebase/mod.rs`
4. Update security rules in `docs/firestore-security-rules.md`

---

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| React components | PascalCase.tsx | ChatScreen.tsx |
| Utilities/functions | camelCase.ts | authHeaders.ts |
| Types/interfaces | types.ts or types/ | types.ts |
| Rust modules | snake_case.rs | firebase.rs |
| Rust functions | snake_case() | create_user() |

---

## Testing & Debugging

### API Testing

Use `docs/api.http` with VS Code REST Client extension:

```http
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

### Mobile Debugging

- Use React Native Debugger for Redux/state inspection
- Enable network inspector in Metro bundler
- Use `console.log()` in app code (visible in Metro output)
- VS Code debugger via launch config

### Firestore Emulator

For local testing without cloud:

```bash
firebase emulators:start --only firestore
```

---

## Deployment Checklist

- [ ] Set environment variables in backend `.env`
- [ ] Generate Firebase service account key
- [ ] Create R2 bucket and API token
- [ ] Deploy Firestore indexes
- [ ] Deploy Firestore security rules
- [ ] Generate JWT_SECRET: `openssl rand -hex 64`
- [ ] Build release APK: `./gradlew assembleRelease`
- [ ] Deploy backend (Docker, Railway, Render, etc.)
- [ ] Update app config to point to production backend
- [ ] Test auth flow end-to-end
- [ ] Monitor backend logs for errors

---

## Security Considerations

- **JWT Secret**: Generate randomly, store securely (never in git)
- **Firebase Service Account**: Never commit, restrict file permissions
- **R2 API Keys**: Use least-privilege token permissions
- **Firestore Rules**: Deny direct app access to sensitive collections
- **Password Hashing**: Always use Argon2, never plaintext
- **HTTPS/WSS**: Encrypt all network traffic (enforce in production)
- **Private Keys**: E2EE private keys never leave device

---

## Performance Optimization Tips

- **Mobile**: Use FlatList for long message lists, lazy load history
- **Backend**: Index Firestore queries, use connection pooling for Firebase
- **WebSocket**: Batch messages, implement heartbeat for stale detection
- **Storage**: Compress images before upload to R2
- **Caching**: Cache user profiles locally after fetch

---

## Troubleshooting Guide

### WebSocket Disconnects

**Issue**: Client disconnects after few minutes
**Solution**: Check backend for stale connection cleanup, verify firewall allows WSS

### Message Delivery Lag

**Issue**: Messages appear delayed
**Solution**: Check WebSocket connection status, verify Firestore latency, inspect network tab

### Encryption Errors

**Issue**: Cannot decrypt received messages
**Solution**: Verify both sides derive same shared secret, check nonce format

### Login Fails

**Issue**: 401 Unauthorized on protected routes
**Solution**: Verify JWT_SECRET matches backend, check token expiration, ensure token sent in headers

---

## Quick Reference

### Environment Variables (Backend)

```
JWT_SECRET=<hex string>
FIREBASE_PROJECT_ID=abfluxenite
FIREBASE_SERVICE_ACCOUNT_JSON=./firebase-service-account.json
R2_ACCOUNT_ID=<id>
R2_ACCESS_KEY_ID=<key>
R2_SECRET_ACCESS_KEY=<secret>
R2_BUCKET=fluxenite-media
R2_PUBLIC_BASE_URL=https://media.yourdomain.com
APP_HOST=0.0.0.0
APP_PORT=8080
```

### Essential Commands

```bash
# Backend
cargo run --release              # Run server
cargo test                       # Run tests
cargo build --release           # Release build

# Mobile
pnpm install                     # Install deps
pnpm start                       # Start Metro
pnpm android                     # Run on Android
pnpm lint                        # Check lint

# Firebase
firebase deploy --only firestore:indexes
firebase deploy --only firestore:rules
```

### API Endpoints Summary

```
POST   /auth/register
POST   /auth/login
GET    /auth/me
POST   /chats
GET    /chats
GET    /chats/:id
GET    /chats/:id/messages
GET    /users/search?q=...
GET    /users/:uid
PATCH  /users/me
POST   /uploads/signed-url
GET    /ws?token=...
```

---

## Related Documentation

- [README.md](../../README.md) — Project overview and setup
- [SETUP.md](../../SETUP.md) — Deployment guide
- [docs/api.http](../../docs/api.http) — API request examples
- [docs/firestore-security-rules.md](../../docs/firestore-security-rules.md) — DB access control
- [docs/firestore-indexes.json](../../docs/firestore-indexes.json) — Query optimization

---

## Quick Start for New Developers

1. Clone repository
2. Read [README.md](../README.md) for Firebase/R2 setup
3. Copy `.env.example` → `.env` and fill in credentials
4. Backend: `cargo run`
5. Mobile: `pnpm install && pnpm start`
6. Use this guide to understand module responsibilities
7. Reference individual README.md files in each folder for details
