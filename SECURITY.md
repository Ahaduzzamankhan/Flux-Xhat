# Security Policy

## Reporting Security Vulnerabilities

**Do not open a public GitHub issue for security vulnerabilities.** This could allow attackers to exploit the vulnerability before it's patched.

Instead, please report security vulnerabilities to: **[security@yourdomain.com](mailto:security@yourdomain.com)**

Include the following information:

- Description of the vulnerability
- Affected version(s)
- Steps to reproduce (if possible)
- Proof of concept or exploit (if safe to share)
- Your suggested fix (optional)

We will acknowledge your report within 48 hours and provide updates every 7 days.

## Vulnerability Disclosure Timeline

1. **Report received** — We acknowledge the report
2. **Assessment** — We investigate and reproduce the issue
3. **Fix development** — We work on a patch
4. **Pre-release notification** — We notify major users before public release
5. **Release** — Patched version is published
6. **Credit** — We credit you (unless you prefer anonymity)

## Security Best Practices

When using Fluxenite Chat:

- Keep the backend and mobile app updated
- Use strong, unique passwords
- Enable two-factor authentication where available
- Store private keys securely (never share them)
- Keep your Firebase and R2 credentials secret
- Use HTTPS/WSS in production (never HTTP/WS)
- Regularly rotate JWT_SECRET and API keys

## Supported Versions

| Version | Supported          |
|---------|-------------------|
| 1.x     | ✅ Active support |
| 0.x     | ❌ No support     |

Security updates are released for active versions only.

## Security Headers

In production, ensure your backend includes:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
```

## Dependency Scanning

We use automated tools to scan for vulnerable dependencies:

- **Backend**: Cargo audit
- **Mobile**: npm audit via pnpm

Run locally:

```bash
# Backend
cargo audit

# Mobile
pnpm audit
```

## Crypto Security

- **Message Encryption**: X25519 + AES-GCM (industry standard)
- **Password Hashing**: Argon2id (resistant to GPU attacks)
- **JWT Signing**: HMAC-SHA256 with strong secret
- **Random Generation**: Cryptographically secure RNG

Do not:
- Use weak passwords
- Share encryption private keys
- Disable HTTPS/WSS
- Store plaintext passwords

## Questions?

For security questions or clarifications, email: [security@yourdomain.com](mailto:security@yourdomain.com)
