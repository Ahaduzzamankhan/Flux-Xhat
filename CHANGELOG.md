# Changelog

All notable changes to Fluxenite Chat are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Multi-server support for mobile app (ServerSetupScreen)
- Dynamic API host resolution from Zustand store
- Server connection management in profile screen

### Changed
- Migrated mobile package manager from npm to pnpm
- Improved WebSocket reconnection logic with exponential backoff
- Updated Firebase dependencies to latest compatible versions

### Fixed
- WebSocket timeout handling on connection loss
- Message delivery during network interruptions

## [1.0.0] — 2026-05-06

### Added
- Initial release of Fluxenite Chat
- End-to-end encrypted messaging (X25519 + AES-GCM)
- React Native Android mobile app
- Rust backend with Axum web framework
- Firebase Firestore integration
- Cloudflare R2 media uploads
- JWT authentication with Argon2 password hashing
- Real-time WebSocket messaging
- User profiles and chat management
- Typing indicators and presence notifications
- Message reactions (emoji)
- User search functionality

### Security
- End-to-end encryption for all messages
- Passwords hashed with Argon2id
- JWT-based session management
- Firestore security rules for access control
- R2 signed URLs for secure file uploads

## Guidelines for Contributors

When adding entries to this changelog:

- Use past tense ("Added", "Fixed", "Changed", not "Adds", "Fixes")
- Group changes by category (Added, Changed, Deprecated, Removed, Fixed, Security)
- Link to related issues/PRs: `[#123](https://github.com/...)`
- Include breaking changes under "Changed" with ⚠️ emoji
- Update the [Unreleased] section before each release

### Categories

- **Added** — New features
- **Changed** — Changes in existing functionality
- **Deprecated** — Soon-to-be removed features
- **Removed** — Removed features
- **Fixed** — Bug fixes
- **Security** — Security fixes and improvements

### Version Format

- `[X.Y.Z] — YYYY-MM-DD` for releases
- `[Unreleased]` for work in progress
