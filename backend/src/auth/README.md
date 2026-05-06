# Authentication Module

Handles user authentication, password hashing, JWT token generation, and verification.

## Files

- **mod.rs** — Module exports and internal integration
- **password.rs** — Argon2 password hashing and verification
- **jwt.rs** — JWT creation, validation, and claims extraction
- **extractor.rs** — Axum extractors for authenticated requests

## Key Functions

- `hash_password()` — Argon2 hashing for secure storage
- `verify_password()` — Compare plaintext with hashed password
- `create_jwt()` — Generate signed JWT token with user claims
- `verify_token()` — Extract and validate JWT claims
- `AuthExtractor` — Middleware extractor for authenticated route handlers

## Security

- Passwords never stored in plaintext
- JWTs signed with `JWT_SECRET` and verified on each protected request
- Token claims include user UID and optional scopes
- Expired/invalid tokens rejected at route entry point
