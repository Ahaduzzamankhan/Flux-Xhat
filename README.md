# ⚠️ Fluxenite Chat — No Longer Maintained

> **Maintenance has ended.** This project is no longer actively developed or supported. It is preserved for reference only.

---

# Fluxenite Chat

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-Backend-orange.svg)](https://www.rust-lang.org/)

**Fluxenite Chat** is a high-performance, end-to-end encrypted (E2EE) mobile messaging application built with React Native and a Rust-based backend.

## 🚀 Key Features
- End-to-End Encryption (E2EE)
- Real-time Messaging
- Modern UI/UX
- Rust backend
- Media Support
- Presence & Typing

## 🏗 Architecture
```mermaid
graph TD
    A[Mobile App - React Native] -- E2EE --> B[Rust Backend]
    B -- Auth & Data --> C[Firebase Firestore]
    B -- Media Storage --> D[Cloudflare R2]
    A -- Real-time Events --> B
```

## 🛠 Tech Stack
- React Native, TypeScript, Zustand, React Navigation
- Rust, Axum, Tokio
- TweetNaCl, JWT
- Firebase Firestore, Cloudflare R2

## 📥 Getting Started
### Backend
```bash
cd backend
cp .env.example .env
cargo run --release
```

### Mobile
```bash
cd mobile
npm install
npm run android
```

## 🛡 Security
Messages were designed to be encrypted using `tweetnacl`. Review the implementation carefully before relying on it for security-sensitive use.

## 📄 License
MIT
