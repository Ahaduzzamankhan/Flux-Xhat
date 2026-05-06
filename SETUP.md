# Private Chat - Full Stack Build Guide

A production-ready 1-on-1 encrypted chat application with React Native frontend and Rust backend.

## Architecture

```
React Native App (Android)
    ↓ HTTPS + WebSocket
Rust Backend (Axum)
    ↓
Firebase Firestore + Cloudflare R2
```

## Tech Stack

### Backend
- **Language**: Rust
- **Framework**: Axum (async HTTP/WebSocket server)
- **Runtime**: Tokio
- **Database**: Firebase Firestore
- **Storage**: Cloudflare R2
- **Auth**: JWT + Argon2 password hashing
- **E2EE**: Messages encrypted client-side before transmission

### Frontend
- **Framework**: React Native (Expo-less)
- **Language**: TypeScript
- **State**: Zustand
- **Navigation**: React Navigation
- **E2EE**: TweetNaCl.js (NaCl box encryption)
- **HTTP**: Axios
- **Async Storage**: React Native AsyncStorage

---

## Backend Setup

### Prerequisites
- Rust 1.70+
- Node.js 20+ (for development tools)
- Firebase project with Firestore enabled
- Cloudflare R2 bucket

### 1. Configure Environment

Create `.env` in `backend/`:

```env
APP_HOST=0.0.0.0
APP_PORT=8080
JWT_SECRET=your-very-long-secret-key-min-32-chars
JWT_ISSUER=private-chat
JWT_TTL_SECONDS=2592000
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_SERVICE_ACCOUNT_JSON=./firebase-service-account.json
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET=your-r2-bucket-name
R2_PUBLIC_BASE_URL=https://your-r2-domain.com
R2_SIGNED_URL_TTL_SECONDS=900
APP_ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

**Important Notes:**
- Place your Firebase service account JSON at the path specified
- Generate `JWT_SECRET` with a cryptographically secure random string (e.g., `openssl rand -base64 32`)
- R2 signed URLs must be configured to allow PUT operations

### 2. Build and Run

```bash
cd backend
cargo build --release
cargo run --release
```

The server will start on `http://0.0.0.0:8080`

### 3. Firestore Collections Setup

Create these collections in Firestore:

#### `users`
```json
{
  "uid": "user-uuid",
  "email": "user@example.com",
  "username": "john_doe",
  "avatar": "https://...",
  "status": "Hey there!",
  "last_seen": "2026-05-05T14:30:00Z",
  "public_key": "base64-encoded-public-key"
}
```

#### `auth_credentials`
```json
{
  "uid": "user-uuid",
  "email": "user@example.com",
  "password_hash": "argon2-hash",
  "created_at": "2026-05-05T14:00:00Z"
}
```

#### `chats`
```json
{
  "chat_id": "direct_uid1_uid2",
  "participants": ["uid1", "uid2"],
  "last_message": "message-uuid",
  "updated_at": "2026-05-05T14:30:00Z"
}
```

#### `messages`
```json
{
  "message_id": "message-uuid",
  "chat_id": "direct_uid1_uid2",
  "sender_id": "uid1",
  "recipient_id": "uid2",
  "encrypted_content": "base64-aes-ciphertext",
  "nonce": "base64-nonce",
  "media": [],
  "timestamp": "2026-05-05T14:30:00Z",
  "reactions": {"😀": ["uid2"]}
}
```

### 4. API Endpoints

**Auth**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT
- `GET /auth/me` - Get current user profile

**Chats**
- `GET /chats` - List user's chats
- `POST /chats` - Create new chat
- `GET /chats/{chat_id}` - Get chat metadata
- `GET /chats/{chat_id}/messages` - Get message history

**Users**
- `GET /users/{uid}` - Get user profile
- `GET /users/me` - Get current user
- `PATCH /users/me` - Update profile
- `GET /users/search?query=email_or_username` - Search users

**Uploads**
- `POST /uploads/signed-url` - Request signed R2 upload URL

**WebSocket**
- `WS /ws?token=jwt_token` - Real-time messaging

### Security Features Implemented

✅ CORS with origin whitelist  
✅ Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)  
✅ JWT with expiration validation  
✅ Argon2 password hashing  
✅ Role-based access control (participant validation)  
✅ Sensitive error masking  
✅ Content-type validation for uploads  
✅ Filename sanitization  
✅ Bearer token and query-based WebSocket auth fallback  

---

## Frontend Setup

### Prerequisites
- Node.js 20+
- npm or yarn
- Android SDK + emulator or physical device
- Java 17+

### 1. Install Dependencies

```bash
cd mobile
npm install --legacy-peer-deps
# OR
yarn install
```

### 2. Configure Backend URL

Edit `src/api/api.ts`:

```typescript
export const API_HOST = 'http://your-backend-domain:8080';
export const WS_HOST = 'ws://your-backend-domain:8080';
export const WS_URL = `${WS_HOST}/ws`;
```

**For Android Emulator:**
- Use `http://10.0.2.2:8080` (emulator's host loopback)
- Use `ws://10.0.2.2:8080` for WebSocket

**For Physical Device:**
- Use your machine's local network IP (e.g., `http://192.168.x.x:8080`)

### 3. Start Development Server

```bash
npm start
# OR
yarn start
```

### 4. Run on Android

```bash
npm run android
# OR
yarn android
```

Or manually:

```bash
adb reverse tcp:8080 tcp:8080
npx react-native run-android
```

### 5. Project Structure

```
mobile/
├── src/
│   ├── api/
│   │   ├── api.ts              # Axios config & WebSocket URL
│   │   ├── auth.ts             # Auth endpoints
│   │   ├── chat.ts             # Chat & user endpoints
│   │   ├── uploads.ts          # File upload integration
│   │   └── websocket.ts        # WebSocket client
│   ├── crypto/
│   │   └── e2ee.ts             # TweetNaCl encryption/decryption
│   ├── store/
│   │   └── useStore.ts         # Zustand global state
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   ├── ChatListScreen.tsx
│   │   ├── ChatScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── components/
│   │   └── MessageBubble.tsx
│   └── navigation/
│       └── index.tsx            # React Navigation stack
├── App.tsx                      # Root app
├── index.js                     # Metro entry point
├── package.json
└── tsconfig.json
```

### 6. Features

✅ Email/password registration & login  
✅ JWT-based session persistence  
✅ Real-time WebSocket messaging  
✅ Client-side E2EE with TweetNaCl  
✅ Typing indicators  
✅ Online/offline presence  
✅ Message reactions  
✅ User profile updates  
✅ User search  
✅ Chat list & history  
✅ Secure async storage (clearable on logout)  

---

## End-to-End Encryption Flow

### Key Generation (Registration)

1. App generates X25519 keypair locally using TweetNaCl
2. Public key sent to backend and stored in user profile
3. Private key stored securely in device async storage

### Message Encryption

1. User types message
2. App retrieves recipient's public key from Firestore
3. Message encrypted with NaCl box (XSalsa20 + Poly1305)
4. Nonce generated and included with ciphertext
5. Encrypted payload sent to backend via WebSocket
6. Backend stores ciphertext (never sees plaintext)
7. Recipient receives encrypted message
8. Recipient decrypts using their private key + sender's public key

### Decryption

1. App receives message from WebSocket
2. Uses stored private key + sender's public key
3. Decrypts with NaCl box.open()
4. Displays plaintext to user

**Key Exchange:** No explicit key exchange needed—public keys are stored in Firestore and fetched before encryption.

---

## Deployment

### Backend Deployment (Production)

#### Option 1: Docker

```dockerfile
FROM rust:latest
WORKDIR /app
COPY . .
RUN cargo build --release
EXPOSE 8080
CMD ["./target/release/private-chat-backend"]
```

Build and deploy to any Docker-compatible host (AWS ECS, Heroku, Railway, etc.)

#### Option 2: Direct Host

1. Install Rust on server
2. Clone repo and build:
   ```bash
   cargo build --release
   ```
3. Run with systemd or supervisor
4. Use Nginx as reverse proxy for HTTPS

**Environment Variables:** Set via `.env` or system environment

### Frontend Deployment (Production)

1. Build release APK:
   ```bash
   cd android && ./gradlew assembleRelease
   ```

2. Sign APK with your keystore

3. Upload to Google Play Store

**Android Manifest Considerations:**
- Add internet permission
- Configure HTTPS enforcement
- Handle network security domain configuration

---

## Testing

### Backend
```bash
cargo test
```

### Frontend
```bash
npm test
```

---

## Troubleshooting

### WebSocket Connection Issues
- Ensure backend is running and accessible from client
- Check CORS and firewall rules
- Verify token is valid (not expired)
- On emulator, use `ws://10.0.2.2:8080`

### Encryption/Decryption Failures
- Ensure both users have generated keypairs
- Verify public keys are stored and retrieved correctly
- Check nonce and ciphertext are base64-encoded properly

### Firebase Errors
- Ensure service account JSON is correctly configured
- Verify collections exist in Firestore
- Check Firebase security rules (allow read/write for authenticated users)

### Message Not Appearing
- Check both users are connected to WebSocket
- Verify message was stored in Firestore
- Ensure recipient's app is not in background (implement foreground service if needed)

---

## Security Recommendations

### Before Production

1. **HTTPS/TLS:** Use a reverse proxy (Nginx, Cloudflare) to enforce HTTPS
2. **CORS:** Restrict to known domains only
3. **JWT Secret:** Use a cryptographically secure random 32+ character string
4. **Rate Limiting:** Implement on backend (login, message sending)
5. **File Uploads:** Restrict file types and sizes at backend
6. **Logging:** Avoid logging sensitive data (passwords, private keys)
7. **Database:** Use Firestore security rules to enforce authentication
8. **R2:** Use signed URLs with short TTL (15 minutes)
9. **Client Storage:** Consider using a secure enclave for private keys on physical devices
10. **Certificate Pinning:** Implement on Android for extra security

### Ongoing

- Monitor error logs for unusual activity
- Keep dependencies updated (`cargo update`, `npm audit`)
- Perform regular security audits
- Test encryption/decryption with edge cases
- Backup Firestore data regularly

---

## Future Enhancements

- [ ] Group chats
- [ ] Voice/video calls
- [ ] File sharing with thumbnail preview
- [ ] Message search and filtering
- [ ] User blocking and mute
- [ ] End-to-end encrypted backups
- [ ] iOS support
- [ ] Desktop clients (Electron, Tauri)
- [ ] Message deletion and editing
- [ ] Disappearing messages

---

## License

MIT

---

## Support

For issues or questions, review this documentation and check the backend/mobile README files.
