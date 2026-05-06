# API Module

Backend communication layer for REST requests and WebSocket connections.

## Files

- **api.ts** — Axios instance with dynamic baseURL resolver for multi-server support
- **auth.ts** — Login, register, and auth endpoints
- **chat.ts** — Chat and message operations
- **uploads.ts** — File upload via R2 signed URLs
- **cloudinary.ts** — Optional avatar upload helper
- **websocket.ts** — WebSocket connection manager

## Key Concepts

### Server URL Management

- `getApiHost()` — Reads current server URL from Zustand store
- Allows users to point at different backend instances (local dev, staging, production)
- Configured on first launch via `ServerSetupScreen`
- Changed via Profile → Change Server

### Request Headers

- All authenticated requests include `Authorization: Bearer <token>`
- API client validates token before each request
- Failed auth (401) triggers logout and redirect to login

### Error Handling

- Network errors logged and user-friendly message shown
- Axios timeout: 15 seconds (configurable)
- Failed requests do not automatically retry (handled by WebSocket reconnect for realtime)

## Functions

### api.ts
- `getApiHost()` — Get current backend URL
- `getWsUrl()` — Convert HTTP URL to WS URL for WebSocket

### auth.ts
- `registerUser()` — Create new account
- `loginUser()` — Authenticate and get JWT
- `fetchCurrentUser()` — Get authenticated user profile

### chat.ts
- `fetchChats()` — List user's chats
- `fetchChatMessages()` — Load message history
- `createChat()` — Initiate 1-on-1 chat
- `searchUsers()` — Find users by email
- `updateProfile()` — Update user info

### websocket.ts
- `connectWebSocket()` — Establish WebSocket with auto-reconnect
- `disconnectWebSocket()` — Close connection and clear timers
- `sendWebSocketEvent()` — Send message, typing, reaction events
- `joinChat()` — Subscribe to chat messages
