# Crypto Module

End-to-end encryption utilities using TweetNaCl.

## Files

- **e2ee.ts** — Encryption and decryption functions

## Encryption Scheme

- **Key Exchange**: X25519 elliptic curve Diffie-Hellman
- **Message Cipher**: AES-GCM (authenticated encryption)
- **Nonce**: 24-byte random per message (prevents replay attacks)
- **Public Key**: Shared during user profile setup (stored in Firestore)

## Key Generation

1. User creates account → generates X25519 keypair
2. Private key stored in device AsyncStorage (root privilege required for theft)
3. Public key uploaded to user profile in Firestore
4. Peer fetches public key from Firestore

## Encryption Flow

```
Message (plaintext)
    ↓
Derive shared secret using peer's public key
    ↓
Generate random nonce
    ↓
AES-GCM encrypt → ciphertext
    ↓
Send ciphertext + nonce to server
    ↓
Server forwards to peer
    ↓
Peer decrypts using shared secret + nonce → plaintext
```

## Functions

- `generateKeyPair()` — Create random X25519 keypair
- `encryptMessage()` — Encrypt plaintext with recipient public key
- `decryptMessage()` — Decrypt ciphertext with private key and nonce
- `deriveSharedSecret()` — Compute ECDH shared secret

## Security Notes

- Private keys never leave the device
- Server cannot read message content (only forwards ciphertext)
- Each message uses unique nonce to prevent pattern recognition
- Uses TweetNaCl.js (audited, battle-tested library)

## Testing

```tsx
const keyPair = generateKeyPair();
const encrypted = encryptMessage(message, keyPair.publicKey);
const decrypted = decryptMessage(encrypted.ciphertext, keyPair.secretKey, encrypted.nonce);
```
