/**
 * Kryptex vault persistence — uses crypto via `kryptexVaultService` / `vaultCrypto`.
 *
 * - Derives AES-GCM keys from the Master Password via PBKDF2; encrypts locally before insert.
 * - Persists rows through the Supabase JS client configured with VITE_SUPABASE_URL +
 *   VITE_SUPABASE_ANON_KEY (see src/lib/supabase.ts). Never use the service role in this module.
 * - groupShareHistoryByVaultItem supports the Audit UI + Share Counter context.
 */

import { supabase } from "@/lib/supabase";
import {
  deriveVaultKeyFromPassword,
  encryptSecret,
  ENCRYPTION_VERSION_V2_PBKDF2,
} from "@/lib/crypto/vaultCrypto";
import type { ShareHistoryRow } from "@/hooks/useShareHistory";

const KDF_SALT_LS = "kryptex_pbkdf_salt_v1";

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

function rowTime(r: ShareHistoryRow): string {
  return r.shared_at ?? r.created_at ?? "";
}

/**
 * Per-user KDF salt: persisted in localStorage and duplicated on each v2 row so
 * a new browser can restore the salt from Supabase after authentication.
 */
export async function getOrCreateKdfSaltBytes(userId: string): Promise<Uint8Array> {
  const fromLs = typeof localStorage !== "undefined" ? localStorage.getItem(KDF_SALT_LS) : null;
  if (fromLs) return b64ToBytes(fromLs);

  const { data } = await supabase
    .from("vault_items")
    .select("salt")
    .eq("user_id", userId)
    .eq("encryption_version", ENCRYPTION_VERSION_V2_PBKDF2)
    .not("salt", "is", null)
    .limit(1)
    .maybeSingle();

  if (data?.salt) {
    if (typeof localStorage !== "undefined") localStorage.setItem(KDF_SALT_LS, data.salt);
    return b64ToBytes(data.salt);
  }

  const fresh = new Uint8Array(16);
  crypto.getRandomValues(fresh);
  const b64 = bytesToB64(fresh);
  if (typeof localStorage !== "undefined") localStorage.setItem(KDF_SALT_LS, b64);
  return fresh;
}

export async function unlockVaultWithPassword(userId: string, password: string): Promise<CryptoKey> {
  const salt = await getOrCreateKdfSaltBytes(userId);
  return deriveVaultKeyFromPassword(password, salt);
}

export async function addSecretWithMasterPassword(params: {
  userId: string;
  title: string;
  secretBody: string;
  masterPassword: string;
}): Promise<void> {
  const salt = await getOrCreateKdfSaltBytes(params.userId);
  const key = await deriveVaultKeyFromPassword(params.masterPassword, salt);
  const saltB64 = bytesToB64(salt);
  const { ciphertext, iv } = await encryptSecret(params.secretBody, key, saltB64);

  const { error } = await supabase.from("vault_items").insert({
    user_id: params.userId,
    title: params.title.trim(),
    ciphertext,
    iv,
    salt: saltB64,
    encryption_version: ENCRYPTION_VERSION_V2_PBKDF2,
  });
  if (error) throw error;
}

export function groupShareHistoryByVaultItem(
  rows: ShareHistoryRow[]
): Map<string, ShareHistoryRow[]> {
  const m = new Map<string, ShareHistoryRow[]>();
  for (const r of rows) {
    const list = m.get(r.vault_item_id) ?? [];
    list.push(r);
    m.set(r.vault_item_id, list);
  }
  for (const list of m.values()) {
    list.sort((a, b) => new Date(rowTime(b)).getTime() - new Date(rowTime(a)).getTime());
  }
  return m;
}
