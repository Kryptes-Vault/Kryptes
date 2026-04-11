import crypto from "crypto";

/* ============================================================================
 * ⚠️⚠️⚠️  SECURITY: DELETE THIS ENTIRE DEBUG BLOCK BEFORE COMMIT OR DEPLOY  ⚠️⚠️⚠️
 * Logging REDIS_CACHE_KEY to the console leaks a secret. Temporary local
 * debugging ONLY — never merge or ship this. Remove as soon as diagnosis is done.
 * ============================================================================ */
(() => {
  const rawKey = process.env.REDIS_CACHE_KEY;
  console.log("RAW KEY: [" + rawKey + "]");
  console.log("REDIS_CACHE_KEY raw length:", rawKey === undefined ? "(undefined)" : rawKey.length);
  const normalized =
    rawKey === undefined ? "" : String(rawKey).replace(/['"]/g, "").trim();
  console.log(
    "REDIS_CACHE_KEY length after .replace(/['\"]/g, '').trim():",
    normalized.length
  );
})();
/* ===================== END TEMPORARY DEBUG — DELETE BLOCK ABOVE ===================== */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

/**
 * Encrypts a plaintext string for secure caching.
 * Uses AES-256-GCM and a 32-byte key from REDIS_CACHE_KEY.
 * Returns a hex-encoded string containing IV:AuthTag:EncryptedData.
 */
export function encryptForCache(data: string): string {
  const cacheKeyHex = process.env.REDIS_CACHE_KEY;
  if (!cacheKeyHex || cacheKeyHex.length !== 64) {
    throw new Error("Missing or invalid REDIS_CACHE_KEY in environment (requires 64-character hex string).");
  }

  const key = Buffer.from(cacheKeyHex, "hex");
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encryptedData
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/**
 * Decrypts a secure cache string back into plaintext.
 * Expects the input format IV:AuthTag:EncryptedData.
 */
export function decryptFromCache(encryptedPayload: string): string {
  const cacheKeyHex = process.env.REDIS_CACHE_KEY;
  if (!cacheKeyHex || cacheKeyHex.length !== 64) {
    throw new Error("Missing or invalid REDIS_CACHE_KEY in environment (requires 64-character hex string).");
  }

  const key = Buffer.from(cacheKeyHex, "hex");
  const parts = encryptedPayload.split(":");
  
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format. Expected IV:AuthTag:EncryptedData");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/** Server-side vault row storage: split IV from authTag+ciphertext for `vault_items.iv` / `vault_items.ciphertext`. */
export function encryptVaultAtRest(plaintext: string): {
  iv: string;
  ciphertext: string;
  encryptionVersion: string;
} {
  const full = encryptForCache(plaintext);
  const parts = full.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted payload format from encryptForCache");
  }
  const [ivHex, authTagHex, encryptedHex] = parts;
  return {
    iv: ivHex,
    ciphertext: `${authTagHex}:${encryptedHex}`,
    encryptionVersion: "server_aes256_gcm_v1",
  };
}

export function decryptVaultAtRest(iv: string, ciphertext: string): string {
  return decryptFromCache(`${iv}:${ciphertext}`);
}
