// Client-side crypto utilities using Web Crypto API (PBKDF2 + AES-GCM)
// Only use in the browser; do not call from server route handlers.

// Check if we're in a browser environment with Web Crypto API support
const isBrowser = typeof window !== 'undefined';

// Enhanced Web Crypto API detection with debugging info
function checkWebCryptoSupport(): { supported: boolean; reason?: string } {
  if (!isBrowser) {
    return { supported: false, reason: 'Not in browser environment' };
  }
  
  if (typeof window.crypto === 'undefined') {
    return { supported: false, reason: 'window.crypto is undefined' };
  }
  
  if (typeof window.crypto.subtle === 'undefined') {
    return { supported: false, reason: 'window.crypto.subtle is undefined - Web Crypto API requires HTTPS or localhost' };
  }
  
  if (typeof window.crypto.getRandomValues !== 'function') {
    return { supported: false, reason: 'window.crypto.getRandomValues is not available' };
  }
  
  // Check if we're in a secure context
  if (typeof window.isSecureContext !== 'undefined' && !window.isSecureContext) {
    return { supported: false, reason: 'Not in secure context - Web Crypto API requires HTTPS or localhost' };
  }
  
  return { supported: true };
}

const cryptoSupport = checkWebCryptoSupport();
const hasWebCrypto = cryptoSupport.supported;

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
  if (!isBrowser) {
    throw new Error('Crypto functions can only be used in browser environments');
  }
  
  if (!hasWebCrypto) {
    const errorMsg = cryptoSupport.reason || 'Web Crypto API is not available';
    throw new Error(`Web Crypto API Error: ${errorMsg}. 

For Microsoft Edge users:
- Ensure you're accessing the site via HTTPS or localhost
- Check that your Edge version supports Web Crypto API
- Try accessing via https://localhost:3000 instead of http://localhost:3000

Current URL protocol: ${window.location.protocol}
Secure context: ${window.isSecureContext ? 'Yes' : 'No'}`);
  }
  
  const salt = base64ToBytes(saltBase64);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    // Use ArrayBuffer to conform to BufferSource expected by importKey
    strToUint8Array(password).buffer as ArrayBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return window.crypto.subtle.deriveKey(
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
  if (!hasWebCrypto) {
    throw new Error('Web Crypto API is not available in this browser. Please use a modern browser that supports the Web Crypto API.');
  }
  
  // Create IV with a standard ArrayBuffer backing
  const iv = new Uint8Array(IV_LENGTH);
  window.crypto.getRandomValues(iv);
  const data = strToUint8Array(JSON.stringify(plaintext));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv) };
}

export async function decryptItem(ciphertextB64: string, ivB64: string, key: CryptoKey): Promise<Record<string, unknown>> {
  if (!hasWebCrypto) {
    throw new Error('Web Crypto API is not available in this browser. Please use a modern browser that supports the Web Crypto API.');
  }
  
  const iv = base64ToBytes(ivB64);
  const data = base64ToBytes(ciphertextB64);
  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv.buffer as ArrayBuffer },
    key,
    data.buffer as ArrayBuffer
  );
  const json = new TextDecoder().decode(new Uint8Array(decrypted));
  return JSON.parse(json);
}

export const CryptoUtils = { deriveKey, encryptItem, decryptItem };