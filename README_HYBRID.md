# Fluxenite Chat - Hybrid Architecture

End-to-end encrypted mobile chat with a hybrid backend architecture using **Rust** and **Go**, plus a web admin dashboard built with **React** and **SCSS**.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend Clients                         │
├─────────────────────┬─────────────────────┬─────────────────┤
│  Mobile (React      │  Web Admin (React   │  Future: Web    │
│  Native)            │  + SCSS)            │  Client         │
│  - E2EE Encryption  │  - User Management  │                 │
│  - Chat Interface   │  - Analytics        │                 │
│  - Media Uploads    │  - Moderation       │                 │
└──────────┬──────────┴──────────┬──────────┴─────────────────┘
           │                     │
           │ REST + WebSocket    │ REST API
           ↓                     ↓
┌──────────────────────┐  ┌──────────────────────┐
│   Rust Backend       │  │   Go Backend         │
│   (Port 8080)        │  │   (Port 8081)        │
│                      │  │                      │
│  - Auth (JWT)        │  │  - Admin Dashboard   │
│  - Real-time WS      │  │  - User Management   │
│  - File Uploads (R2) │  │  - Analytics         │
│  - E2EE Message      │  │  - Moderation Tools  │
│    Routing           │  │  - System Stats      │
│  - High Performance  │  │  - Quick Development │
│    Critical Paths    │  │    & Deployment      │
└──────────┬───────────┘  └──────────┬───────────┘
           │                         │
           └───────────┬─────────────┘
                       ↓
              ┌─────────────────┐
              │  Firebase       │
              │  Firestore      │
              │  (Database)     │
              └─────────────────┘
                       ↓
              ┌─────────────────┐
              │  Cloudflare R2  │
              │  (Media Store)  │
              └─────────────────┘
```

---

## Tech Stack

### Backend Services

| Service | Language | Port | Purpose |
|---------|----------|------|---------|
| Main API | Rust (Axum) | 8080 | Production-critical paths, high performance |
| Admin API | Go (Gorilla Mux) | 8081 | Rapid development, admin features |

### Frontend Applications

| Application | Framework | Styling | Purpose |
|-------------|-----------|---------|---------|
| Mobile App | React Native | StyleSheet | iOS/Android chat client |
| Web Admin | React 18 + Vite | SCSS | Admin dashboard |

---

## Why Hybrid Rust + Go?

### Rust Backend (`/backend`)
- **Performance**: Critical for real-time messaging and encryption
- **Memory Safety**: No runtime crashes from memory errors
- **Concurrency**: Tokio async runtime for handling thousands of WebSocket connections
- **Use Cases**: 
  - Authentication & JWT handling
  - Real-time WebSocket server
  - End-to-end encrypted message routing
  - Cloudflare R2 media uploads

### Go Backend (`/backend-go`)
- **Rapid Development**: Fast iteration for admin features
- **Simple Concurrency**: Goroutines for background tasks
- **Great Ecosystem**: Firebase, cloud SDKs
- **Use Cases**:
  - Admin dashboard API
  - User management & moderation
  - Analytics & reporting
  - System monitoring

---

## Why SCSS for Web Admin?

The web admin dashboard uses **SCSS** for advanced styling capabilities:

- **Variables**: Consistent theming across the app
- **Nesting**: Cleaner, more maintainable styles
- **Mixins**: Reusable style patterns
- **Partials**: Modular stylesheet organization
- **Functions**: Dynamic color calculations

### SCSS Features Used

```scss
// Variables for theming
:root {
  --primary-color: #6366f1;
  --bg-primary: #0f172a;
}

// Nested selectors
.sidebar {
  .nav-menu {
    li {
      a:hover {
        background-color: var(--bg-tertiary);
      }
    }
  }
}

// Responsive breakpoints
@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
  }
}
```

---

## Project Structure

```
/workspace
├── backend/                 # Rust backend (main API)
│   ├── src/
│   │   ├── auth/           # JWT authentication
│   │   ├── routes/         # API endpoints
│   │   ├── firebase/       # Firestore integration
│   │   ├── r2/             # Cloudflare R2 uploads
│   │   └── realtime/       # WebSocket handling
│   └── Cargo.toml
│
├── backend-go/             # Go backend (admin API)
│   ├── main.go            # Main API server
│   └── admin/
│       └── main.go        # Admin dashboard API
│
├── mobile/                 # React Native mobile app
│   ├── src/
│   │   ├── components/
│   │   ├── screens/
│   │   ├── api/
│   │   └── crypto/        # E2EE encryption
│   └── package.json
│
├── web-admin/             # React + SCSS admin dashboard
│   ├── src/
│   │   ├── styles/
│   │   │   └── global.scss
│   │   ├── components/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── docs/
    ├── api.http
    └── firestore-security-rules.md
```

---

## Getting Started

### Prerequisites

- Rust 1.75+ (for backend)
- Go 1.21+ (for Go backend)
- Node.js 18+ (for mobile and web admin)
- Firebase project with Firestore enabled
- Cloudflare R2 bucket (optional, for media uploads)

### 1. Rust Backend

```bash
cd backend

# Copy environment template
cp .env.example .env
# Edit .env with your credentials

# Place Firebase service account key
cp /path/to/service-account.json firebase-service-account.json

# Run
cargo run --release
```

### 2. Go Backend

```bash
cd backend-go

# Copy environment from Rust backend
cp ../backend/.env .env

# Install dependencies
go mod download

# Run main API
go run main.go

# Run admin API (in another terminal)
cd admin
go run main.go
```

### 3. Mobile App

```bash
cd mobile

# Install dependencies
pnpm install

# Start Metro bundler
pnpm start

# Run on Android
pnpm android

# Run on iOS
pnpm ios
```

### 4. Web Admin Dashboard

```bash
cd web-admin

# Install dependencies
npm install

# Start development server
npm run dev

# Open http://localhost:3000
```

---

## Environment Variables

### `.env` (shared by Rust and Go backends)

```env
# JWT
JWT_SECRET=your-secret-key-here

# Firebase
FIREBASE_PROJECT_ID=abfluxenite
FIREBASE_SERVICE_ACCOUNT_JSON=./firebase-service-account.json

# Cloudflare R2
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET=fluxenite-media
R2_PUBLIC_BASE_URL=https://media.yourdomain.com

# Server
PORT=8080
APP_ALLOWED_ORIGINS=http://localhost:3000
```

---

## API Endpoints

### Rust Backend (Port 8080)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login user |
| GET | `/users/:id` | Get user profile |
| POST | `/users/:id/online` | Set user online status |
| GET | `/chats` | List user's chats |
| GET | `/chats/:id/messages` | Get chat messages |
| POST | `/uploads/sign` | Get signed upload URL |
| WS | `/ws` | WebSocket connection |

### Go Admin Backend (Port 8081)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/users` | List all users |
| GET | `/admin/users/:id` | Get user details |
| POST | `/admin/users/:id/ban` | Ban a user |
| GET | `/admin/chats` | List all chats |
| GET | `/admin/stats` | Get system statistics |

---

## Security Features

- ✅ End-to-end encryption (TweetNaCl)
- ✅ JWT authentication
- ✅ Argon2 password hashing
- ✅ Firestore security rules
- ✅ CORS protection
- ✅ Input validation
- ✅ Rate limiting (recommended for production)

---

## Production Deployment

### Docker (Rust Backend)

```dockerfile
FROM rust:1.75 as builder
WORKDIR /app
COPY . .
RUN cargo build --release

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y ca-certificates
COPY --from=builder /app/target/release/private-chat-backend /usr/local/bin
CMD ["private-chat-backend"]
```

### Docker (Go Backend)

```dockerfile
FROM golang:1.21 as builder
WORKDIR /app
COPY . .
RUN go build -o admin-server ./admin

FROM debian:bookworm-slim
COPY --from=builder /app/admin-server /usr/local/bin
CMD ["admin-server"]
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](./LICENSE) for details.
