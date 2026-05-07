import AsyncStorage from '@react-native-async-storage/async-storage';
import nacl from 'tweetnacl';
import { randomBytes } from 'tweetnacl';
import { Buffer } from 'buffer';

const PRIVATE_KEY_KEY = 'PRIVATE_CHAT_E2EE_PRIVATE_KEY';
const PUBLIC_KEY_KEY = 'PRIVATE_CHAT_E2EE_PUBLIC_KEY';

function encodeBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('base64');
}

function decodeBase64(data: string): Uint8Array {
  return new Uint8Array(Buffer.from(data, 'base64'));
}

export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keypair = nacl.box.keyPair();
  return {
    publicKey: encodeBase64(keypair.publicKey),
    privateKey: encodeBase64(keypair.secretKey),
  };
}

export async function storeKeyPair(privateKey: string, publicKey: string): Promise<void> {
  await AsyncStorage.setItem(PRIVATE_KEY_KEY, privateKey);
  await AsyncStorage.setItem(PUBLIC_KEY_KEY, publicKey);
}

export async function getPrivateKey(): Promise<string | null> {
  return AsyncStorage.getItem(PRIVATE_KEY_KEY);
}

export async function getPublicKey(): Promise<string | null> {
  return AsyncStorage.getItem(PUBLIC_KEY_KEY);
}

export async function encryptMessage(
  plaintext: string,
  myPrivateKey: string,
  recipientPublicKey: string,
): Promise<{ encrypted: string; nonce: string }> {
  const nonce = randomBytes(nacl.box.nonceLength);
  const secretKeyBytes = decodeBase64(myPrivateKey);
  const publicKeyBytes = decodeBase64(recipientPublicKey);
  const ciphertext = nacl.box(Buffer.from(plaintext, 'utf-8'), nonce, publicKeyBytes, secretKeyBytes);
  return {
    encrypted: encodeBase64(ciphertext),
    nonce: encodeBase64(nonce),
  };
}

export async function decryptMessage(
  encryptedPayload: string,
  nonce: string,
  myPrivateKey: string,
  senderPublicKey: string,
): Promise<string> {
  const nonceBytes = decodeBase64(nonce);
  const ciphertextBytes = decodeBase64(encryptedPayload);
  const secretKeyBytes = decodeBase64(myPrivateKey);
  const publicKeyBytes = decodeBase64(senderPublicKey);
  const plaintext = nacl.box.open(ciphertextBytes, nonceBytes, publicKeyBytes, secretKeyBytes);
  if (!plaintext) {
    throw new Error('Message decryption failed');
  }
  return Buffer.from(plaintext).toString('utf-8');
}
