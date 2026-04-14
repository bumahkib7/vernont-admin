/**
 * Chat message encryption/decryption using AES-256-GCM via the Web Crypto API.
 *
 * The per-conversation key is delivered over HTTPS (REST API) and stored
 * in memory only — never persisted to localStorage or sessionStorage.
 */

const ALGORITHM = "AES-GCM";

/**
 * Import a base64-encoded raw key into a CryptoKey usable for AES-GCM.
 */
export async function importKey(base64Key: string): Promise<CryptoKey> {
  const rawBytes = Uint8Array.from(atob(base64Key), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey("raw", rawBytes, { name: ALGORITHM }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypt a plaintext string. Returns base64-encoded ciphertext and IV.
 */
export async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<{ encryptedBody: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  return {
    encryptedBody: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/**
 * Decrypt a base64-encoded ciphertext using the given key and IV.
 */
export async function decrypt(
  key: CryptoKey,
  encryptedBodyBase64: string,
  ivBase64: string
): Promise<string> {
  const cipherBytes = base64ToBuffer(encryptedBodyBase64);
  const iv = base64ToBuffer(ivBase64);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    cipherBytes
  );

  return new TextDecoder().decode(plainBuffer);
}

// --------------- Helpers ---------------

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
