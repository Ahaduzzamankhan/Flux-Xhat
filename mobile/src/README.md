# Mobile App Source Code

React Native TypeScript source code for the Fluxenite Chat Android app.

## Directory Structure

- **api/** — Backend API clients (REST + WebSocket)
- **components/** — Reusable UI components
- **screens/** — Full-screen view controllers
- **store/** — Zustand state management
- **navigation/** — React Navigation configuration
- **crypto/** — End-to-end encryption utilities
- **firebase.ts** — Firebase initialization
- **theme.ts** — Design system (colors, spacing, radius)
- **types.ts** — TypeScript interfaces and enums
- **types/** — Additional type definitions

## Key Features

- Email/password authentication with JWT tokens
- Client-side message encryption using TweetNaCl (X25519 + AES-GCM)
- WebSocket real-time messaging with auto-reconnect
- Chat list, message history, and profile management
- User search and chat creation
- Cloudflare R2 media upload support
- Secure local storage of auth tokens and encryption keys

## Bootstrapping

1. App loads `App.tsx` → NavigationContainer
2. On startup, `useStore.restoreSession()` checks for cached auth
3. Routes to either `ServerSetup` or `Login` based on session state
4. After login, shows `ChatListScreen`
5. All screens share global Zustand store for state

## Architecture Pattern

```
Screen Component → useStore hooks → Zustand state → API calls
                                                  ↓
                                        REST API / WebSocket
```

## Performance

- Pnpm for fast dependency installation
- Lazy-loaded screens via React Navigation
- Memoized components to prevent unnecessary re-renders
- WebSocket reconnection with exponential backoff
