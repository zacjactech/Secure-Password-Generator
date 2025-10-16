// Client-side crypto utilities using Web Crypto API (PBKDF2 + AES-GCM)
// Only use in the browser; do not call from server route handlers.

const ITERATIONS = 200_000;
const IV_LENGTH = 12; // 96-bit IV for AES-GCM

function strToUint8Array(str: string): Uint8Array {
  // Ensure returned Uint8Array is backed by an ArrayBuffer (not ArrayBufferLike)
  const encoded = new TextEncoder().encode(str);
  return new Uint8Array(encoded);
}

function bytesToBase64(bytes: Uint8Array): string {
  // Browser-safe base64
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function deriveKey(password: string, saltBase64: string): Promise<CryptoKey> {
  const salt = base64ToBytes(saltBase64);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    // Use ArrayBuffer to conform to BufferSource expected by importKey
    strToUint8Array(password).buffer as ArrayBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      // Pass ArrayBuffer to satisfy TS strict BufferSource typing
      salt: salt.buffer as ArrayBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptItem(plaintext: Record<string, unknown>, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  // Create IV with a standard ArrayBuffer backing
  const iv = new Uint8Array(IV_LENGTH);
  crypto.getRandomValues(iv);
  const data = strToUint8Array(JSON.stringify(plaintext));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

export async function decryptItem(ciphertextB64: string, ivB64: string, key: CryptoKey): Promise<Record<string, unknown>> {
  const iv = base64ToBytes(ivB64);
  const data = base64ToBytes(ciphertextB64);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  const json = new TextDecoder().decode(new Uint8Array(decrypted));
  return JSON.parse(json);
}

export const CryptoUtils = { deriveKey, encryptItem, decryptItem };