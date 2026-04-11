/**
 * Client-only AES-GCM helpers for Kryptex vault payloads.
 * Master key material never leaves the browser (sessionStorage for this demo — use passphrase + PBKDF2 in production).
 * Public API barrel: `src/lib/kryptexVaultService.ts` (PBKDF2 100k, base64 ciphertext/iv/salt).
 */

const MASTER_KEY_STORAGE = "kryptex_mk_v1";

function bytesToB64(u8: Uint8Array): string {
  let s = "";
  u8.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function b64UrlEncode(u8: Uint8Array): string {
  return bytesToB64(u8).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + pad;
  return b64ToBytes(b64);
}

/** PBKDF2 iterations for master-password → AES-GCM key (Web Crypto, SHA-256). Kryptex protocol: 100,000. */
export const PBKDF2_ITERATIONS = 100_000;

/** v1: random session key. v2: PBKDF2-derived key + optional plaintext `title` column. */
export const ENCRYPTION_VERSION_V1 = "v1";
export const ENCRYPTION_VERSION_V2_PBKDF2 = "v2_pbkdf2";

/**
 * Derive a 256-bit AES-GCM key from a user master password (never transmitted).
 * Salt must be persisted (e.g. per-user salt in DB / localStorage) for decrypt on return visits.
 */
export async function deriveVaultKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const enc = new TextEncoder().encode(password);
  const keyMaterial = await crypto.subtle.importKey("raw", enc, { name: "PBKDF2" }, false, [
    "deriveBits",
    "deriveKey",
  ]);
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  /* =========================================================================
   * ⚠️ TEMPORARY DEBUG — DELETE THIS ENTIRE BLOCK BEFORE COMMIT OR RELEASE ⚠️
   * Verifies the Web Crypto `CryptoKey` exists in browser RAM after unlock.
   * Safe: logs the handle + public metadata only (no raw key bytes; never
   * call `exportKey` here). Remove after visual verification in DevTools.
   * ========================================================================= */
  if (import.meta.env.DEV) {
    console.log(
      "🔐 [Local Crypto] Temporary AES Key Generated in Browser RAM:",
      derivedKey
    );
    console.log("🔐 [Local Crypto] Key handle (metadata only, no secret material):", {
      type: derivedKey.type,
      extractable: derivedKey.extractable,
      usages: derivedKey.usages,
      algorithm: derivedKey.algorithm,
    });
  }
  /* ========================= END TEMPORARY DEBUG ========================= */

  return derivedKey;
}

/** Encrypt UTF-8 secret body only (v2: title stored separately, often as plaintext in DB). */
export async function encryptSecretBody(
  secretUtf8: string,
  key: CryptoKey
): Promise<{ ciphertext: string; iv: string }> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const data = new TextEncoder().encode(secretUtf8);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  return { ciphertext: bytesToB64(ct), iv: bytesToB64(iv) };
}

export async function decryptSecretBody(
  ciphertextB64: string,
  ivB64: string,
  key: CryptoKey
): Promise<string> {
  const iv = b64ToBytes(ivB64);
  const ct = b64ToBytes(ciphertextB64);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plain);
}

/** Alias: derive AES-GCM key from Master Password + salt (PBKDF2). */
export const deriveKeyFromMasterPassword = deriveVaultKeyFromPassword;

/**
 * Encrypt a plaintext secret (AES-GCM). Returns ciphertext, IV, and the KDF salt (base64) to store with the row.
 */
export async function encryptSecret(
  plaintext: string,
  key: CryptoKey,
  kdfSaltBase64: string
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const { ciphertext, iv } = await encryptSecretBody(plaintext, key);
  return { ciphertext, iv, salt: kdfSaltBase64 };
}

/** Decrypt vault secret ciphertext (AES-GCM) with the derived key. */
export async function decryptSecret(
  ciphertextB64: string,
  ivB64: string,
  key: CryptoKey
): Promise<string> {
  return decryptSecretBody(ciphertextB64, ivB64, key);
}

/** 32-byte AES-GCM master key for the session (demo). */
export function getOrCreateMasterKeyBytes(): Uint8Array {
  const existing = sessionStorage.getItem(MASTER_KEY_STORAGE);
  if (existing) return b64ToBytes(existing);
  const buf = new Uint8Array(32);
  crypto.getRandomValues(buf);
  sessionStorage.setItem(MASTER_KEY_STORAGE, bytesToB64(buf));
  return buf;
}

export async function importAesGcmKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export type VaultPayload = { title: string; body: string };

export async function encryptVaultPayload(
  payload: VaultPayload,
  masterKey: CryptoKey
): Promise<{ ciphertext: string; iv: string; salt: string }> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  const plain = new TextEncoder().encode(JSON.stringify(payload));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, masterKey, plain)
  );
  return {
    ciphertext: bytesToB64(ct),
    iv: bytesToB64(iv),
    salt: bytesToB64(salt),
  };
}

export async function decryptVaultPayload(
  ciphertextB64: string,
  ivB64: string,
  masterKey: CryptoKey
): Promise<VaultPayload> {
  const iv = b64ToBytes(ivB64);
  const ct = b64ToBytes(ciphertextB64);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, masterKey, ct);
  return JSON.parse(new TextDecoder().decode(plain)) as VaultPayload;
}

/** One-off symmetric key for burn-on-read link (stored only in URL #fragment). */
export async function generateBurnKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
}

export async function exportKeyToFragment(key: CryptoKey): Promise<string> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  return b64UrlEncode(raw);
}

export async function importKeyFromFragment(fragment: string): Promise<CryptoKey> {
  const raw = b64UrlDecode(fragment);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, false, ["decrypt"]);
}

export async function encryptForBurn(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  const data = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data));
  return { ciphertext: bytesToB64(ct), iv: bytesToB64(iv) };
}

export async function decryptBurnCipher(ciphertextB64: string, ivB64: string, key: CryptoKey): Promise<string> {
  const iv = b64ToBytes(ivB64);
  const ct = b64ToBytes(ciphertextB64);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(plain);
}

/** Single DB column for `shared_secrets.ciphertext` (iv + ct, never plaintext). */
export function packBurnCipher(iv: string, ciphertext: string): string {
  return JSON.stringify({ v: 1, iv, ciphertext });
}

export function unpackBurnCipher(packed: string): { iv: string; ciphertext: string } {
  const o = JSON.parse(packed) as { v?: number; iv: string; ciphertext: string };
  return { iv: o.iv, ciphertext: o.ciphertext };
}
