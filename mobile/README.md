# Private Chat Mobile

React Native Android app for a 1-on-1 encrypted chat application.

## What it includes
- Email/password auth
- JWT session handling
- WebSocket real-time messaging
- Client-side message encryption with X25519 + AES-GCM
- Firestore-backed profile and chat metadata
- Cloudflare R2 signed URL upload support
- Chat list, chat screen, and profile management

## Setup

1. Install required tools:
   - Node.js 20+
   - Yarn or npm
   - Java 17+
   - Android SDK + emulator or device

2. Install dependencies:

```bash
cd "mobile"
yarn install
```

3. Configure backend endpoints in `src/api/api.ts`.

4. Start the Metro server:

```bash
yarn start
```

5. Run Android:

```bash
yarn android
```

## Notes
- The app is built for Android first. iOS support can be added later by generating the `ios/` native project and updating native dependencies.
- The app stores the local E2EE private key in secure async storage; in production, consider using a secure storage plugin.
- For file sharing with Cloudflare R2, the app uses signed upload URLs from the backend.
