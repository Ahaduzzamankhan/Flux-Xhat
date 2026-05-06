# Fluxenite Chat — Production Setup Guide

End-to-end encrypted mobile chat. React Native (Android) + Rust backend + Firebase Firestore + Cloudflare R2.

---

## Architecture

```
Mobile (React Native)
  └── TweetNaCl E2EE encryption
  └── REST + WebSocket → Rust Backend
        └── Firebase Firestore (users, chats, messages)
        └── Cloudflare R2 (media uploads)
```

---

## 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com) → Project `abfluxenite`
2. Enable **Firestore** in Native mode
3. Apply Firestore security rules from `docs/firestore-security-rules.md`
4. Apply indexes from `docs/firestore-indexes.json`:
   ```bash
   firebase deploy --only firestore:indexes
   ```
5. Generate a **Service Account key**:
   - Go to Project Settings → Service Accounts → Generate new private key
   - Save as `backend/firebase-service-account.json`
   - **Never commit this file** — it is in `.gitignore`

---

## 2. Cloudflare R2 Setup

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Create an R2 bucket named `fluxenite-media`
3. Go to **R2 → Manage R2 API Tokens** → Create a token with:
   - Permissions: `Object Read & Write`
   - Bucket: `fluxenite-media`
4. Note your **Account ID**, **Access Key ID**, and **Secret Access Key**
5. Set up a custom domain for public access (e.g. `media.yourdomain.com`) or use the R2 public URL

---

## 3. Cloudinary (Avatar Uploads — Optional)

Your Cloudinary credentials:
- **Cloud name**: `dhsvtbdgi`
- **API key**: `578924425284413`
- **Upload preset**: `Fluxenite` (unsigned)

To upload an avatar from the app, POST to:
```
https://api.cloudinary.com/v1_1/dhsvtbdgi/image/upload
```
with `upload_preset=Fluxenite` and `file=<base64 or file>`.

Add a `CloudinaryUpload` helper in `src/api/cloudinary.ts` if you want in-app avatar picker → Cloudinary → then save the returned URL to the user profile.

---

## 4. Backend Setup

```bash
cd backend

# Copy and fill in the env
cp .env.example .env
# Edit .env with your credentials (see below)

# Place your Firebase service account
cp /path/to/your-key.json firebase-service-account.json

# Run
cargo run --release
```

### `.env` values to fill in

| Variable | Value |
|---|---|
| `JWT_SECRET` | Run: `openssl rand -hex 64` |
| `FIREBASE_PROJECT_ID` | `abfluxenite` |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | `./firebase-service-account.json` |
| `R2_ACCOUNT_ID` | From Cloudflare dashboard URL |
| `R2_ACCESS_KEY_ID` | From R2 API token |
| `R2_SECRET_ACCESS_KEY` | From R2 API token |
| `R2_BUCKET` | `fluxenite-media` |
| `R2_PUBLIC_BASE_URL` | Your R2 public domain |

---

## 5. Mobile Setup

```bash
cd mobile
npm install

# Android emulator (reaches host at 10.0.2.2:8080 by default)
npm run android

# Physical device — set your backend URL:
# Edit src/api/api.ts → API_HOST or set REACT_APP_API_HOST
```

### Android — google-services.json

The `android/app/google-services.json` is already configured for project `abfluxenite`. If you regenerate it from Firebase Console, replace the file.

---

## 6. Bugs Fixed

| # | Location | Bug | Fix |
|---|---|---|---|
| 1 | `mobile/src/types.ts` | Missing — caused import errors in every screen | Created with all shared types |
| 2 | `mobile/src/theme.ts` | Missing — caused import errors in every screen | Created with full color/radius/shadow system |
| 3 | `mobile/src/store/useStore.ts` | `import create from 'zustand'` (v3 API) breaks on zustand v4 | Changed to `import { create } from 'zustand'` |
| 4 | `mobile/App.tsx` | Duplicate `import { Text as RNText }` caused TS error | Removed duplicate import |
| 5 | `mobile/src/api/websocket.ts` | No reconnect on connection drop; `readyState` not checked before `send` | Added exponential back-off reconnect + `readyState` guard |
| 6 | `mobile/src/api/websocket.ts` | `sendMessageEvent` typed `media` as `unknown[]` | Typed as `MediaMetadata[]` |
| 7 | `mobile/src/api/uploads.ts` | Used `Buffer` + `fetch` PUT — broken on React Native (no binary body support) | Replaced with `RNFS.uploadFiles` (correct native PUT) |
| 8 | `mobile/src/screens/ChatScreen.tsx` | `handleAttachFile` passed raw URI strings as `media[]` to WebSocket | Wired up full signed-URL upload flow (R2) before sending message |
| 9 | `mobile/src/screens/ChatScreen.tsx` | Dynamic `import()` of local module (unsupported by Metro) | Moved `uploads` imports to top of file |
| 10 | `mobile/src/screens/ChatScreen.tsx` | `presence` WS events not handled; `setOnline` not called | Added `presence` handler, added `setOnline` from store |
| 11 | `mobile/src/screens/ChatListScreen.tsx` | Online presence always `false`; not read from store | `online` map read from store and passed to `Avatar` |
| 12 | `mobile/src/screens/ProfileScreen.tsx` | `handleLogout` called `useStore.getState()` (anti-pattern); no navigation after logout | Bound `clearSession` from store; added `navigation.reset` to Login |
| 13 | `mobile/src/api/api.ts` | Hardcoded `10.0.2.2` — breaks on physical device/prod | Environment-variable-aware `API_HOST` |
| 14 | `backend/.env` | Missing entirely | Created with all required vars and documentation |

---

## 7. Production Checklist

- [ ] Generate a strong `JWT_SECRET` (`openssl rand -hex 64`)
- [ ] Firebase service account key placed at `backend/firebase-service-account.json`
- [ ] Firestore security rules deployed
- [ ] R2 bucket created with public domain configured
- [ ] `APP_ALLOWED_ORIGINS` set to your production frontend/app origin
- [ ] Backend running behind HTTPS (TLS termination via reverse proxy or Cloudflare)
- [ ] `REACT_APP_API_HOST` set to your production backend URL in mobile build
- [ ] `google-services.json` up to date for Android build
