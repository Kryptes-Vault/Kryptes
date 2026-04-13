/**
 * Zero-Knowledge file encryption/decryption using Web Crypto API (AES-256-GCM).
 *
 * Wire format: [ 12-byte IV | AES-GCM ciphertext (includes 16-byte auth tag) ]
 *
 * The encryption key never leaves the browser — the backend only ever sees
 * an opaque binary blob it cannot decrypt.
 */

const AES_GCM_IV_BYTES = 12;

const ALLOWED_MIME_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
]);

/**
 * Validates that a file's MIME type is in the vault allow-list.
 * @throws Error with a user-friendly message if the type is rejected.
 */
export function validateFileType(file: File): void {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error(
      `File type "${file.type || "unknown"}" is not allowed. ` +
      `Accepted: PNG, JPEG, WebP, and PDF.`
    );
  }
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function bytesToB64(u8: Uint8Array): string {
  let s = "";
  u8.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

async function importKey(base64Key: string): Promise<CryptoKey> {
  const raw = b64ToBytes(base64Key);
  if (raw.byteLength !== 32) {
    throw new Error(`AES-256 key must be 32 bytes, got ${raw.byteLength}`);
  }
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

/**
 * Encrypt a `File` client-side before upload.
 *
 * @returns A single `Blob` containing `[IV (12 B) | ciphertext]` — ready to
 *          append to `FormData` and POST to the backend as an opaque blob.
 */
export async function encryptFile(
  file: File,
  base64Key: string
): Promise<Blob> {
  const key = await importKey(base64Key);
  const plaintext = await file.arrayBuffer();

  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext
  );

  const packed = new Uint8Array(iv.byteLength + ciphertext.byteLength);
  packed.set(iv, 0);
  packed.set(new Uint8Array(ciphertext), iv.byteLength);

  return new Blob([packed], { type: "application/octet-stream" });
}

/**
 * Decrypt a blob retrieved from the backend back into a viewable object URL.
 *
 * @param encryptedBlob  The raw response blob from `GET /api/vault/documents/:id`
 * @param base64Key      Same base64-encoded 256-bit key used at upload time
 * @param mimeType       Original MIME type (e.g. `image/png`) so the browser
 *                       can render the decrypted bytes correctly
 * @returns A local `blob:` URL suitable for `<img src>`, `<iframe src>`, etc.
 *          Caller is responsible for `URL.revokeObjectURL()` when done.
 */
export async function decryptFile(
  encryptedBlob: Blob,
  base64Key: string,
  mimeType: string
): Promise<string> {
  const key = await importKey(base64Key);
  const buf = await encryptedBlob.arrayBuffer();

  if (buf.byteLength <= AES_GCM_IV_BYTES) {
    throw new Error("Encrypted blob is too small to contain an IV + ciphertext");
  }

  const iv = new Uint8Array(buf, 0, AES_GCM_IV_BYTES);
  const ciphertext = new Uint8Array(buf, AES_GCM_IV_BYTES);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );

  const decryptedBlob = new Blob([plaintext], { type: mimeType });
  return URL.createObjectURL(decryptedBlob);
}

/** Generate a fresh 256-bit AES key and return it as base64 (for first-time setup). */
export async function generateFileEncryptionKey(): Promise<string> {
  const raw = crypto.getRandomValues(new Uint8Array(32));
  return bytesToB64(raw);
}
