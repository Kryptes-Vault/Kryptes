/** Legacy v1 vault session key (random); v2 uses PBKDF2 via kryptexVaultService. */
import { useEffect, useState } from "react";
import { getOrCreateMasterKeyBytes, importAesGcmKey } from "@/lib/crypto/vaultCrypto";

/** Session-scoped AES-GCM key for vault encrypt/decrypt (demo: raw bytes in sessionStorage). */
export function useVaultMasterKey() {
  const [key, setKey] = useState<CryptoKey | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const raw = getOrCreateMasterKeyBytes();
      const k = await importAesGcmKey(raw);
      if (!cancelled) setKey(k);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return key;
}
