/**
 * Kryptex Zero-Knowledge Vault — public API (`kryptexVaultService.ts`)
 *
 * **Standard:** AES-256-GCM via Web Crypto (`crypto.subtle`): 256-bit key, 96-bit (12-byte) IV per encryption.
 * **Key derivation:** PBKDF2-SHA-256 with **{@link PBKDF2_ITERATIONS}** iterations and a **unique 16-byte salt**
 * (persisted base64 alongside rows / localStorage). The Master Password never leaves the browser.
 *
 * **Base64:** `encryptSecret` returns **ciphertext**, **iv**, and **salt** as standard base64 strings for storage.
 * `decryptSecret` accepts those base64 strings and the derived `CryptoKey`.
 *
 * Persistence helpers encrypt locally, then write to Supabase using `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
 * via `src/lib/supabase.ts` (anon key only; never service role in the client).
 */

export {
  deriveKeyFromMasterPassword,
  deriveVaultKeyFromPassword,
  encryptSecret,
  decryptSecret,
  encryptSecretBody,
  decryptSecretBody,
  PBKDF2_ITERATIONS,
  ENCRYPTION_VERSION_V1,
  ENCRYPTION_VERSION_V2_PBKDF2,
} from "./crypto/vaultCrypto";

export {
  addSecretWithMasterPassword,
  unlockVaultWithPassword,
  getOrCreateKdfSaltBytes,
  groupShareHistoryByVaultItem,
} from "./vaultService";
