import { useState, useCallback } from 'react';
import { deriveVaultKeyFromPassword, encryptSecretBody, decryptSecretBody } from '../lib/crypto/vaultCrypto';

export function useVaultCrypto() {
  const [masterKey, setMasterKey] = useState<CryptoKey | null>(null);

  const initVaultKey = useCallback(async (masterPassword: string, salt: Uint8Array) => {
    const key = await deriveVaultKeyFromPassword(masterPassword, salt);
    setMasterKey(key);
    return key;
  }, []);

  const encryptData = useCallback(async (data: string) => {
    if (!masterKey) throw new Error("Vault key not initialized.");
    return await encryptSecretBody(data, masterKey);
  }, [masterKey]);

  const decryptData = useCallback(async (ciphertextB64: string, ivB64: string) => {
    if (!masterKey) throw new Error("Vault key not initialized.");
    return await decryptSecretBody(ciphertextB64, ivB64, masterKey);
  }, [masterKey]);

  /**
   * Generates the secure Escrow Bundle for Support Grant creation.
   * Derives a wrapping key strictly from the emailed OTP, creates a temp session key
   * to encrypt the vault, and wraps the session key seamlessly so the 
   * transmission remains completely mathematically secure. 
   */
  const generateEscrowBundle = async (vaultJsonString: string, emailOtp: string) => {
    const enc = new TextEncoder();
    
    // 1. Generate temp session key
    const sessionKey = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt", "wrapKey", "unwrapKey", "exportKey"]
    );
    
    // 2. Encrypt vaultJson using session key
    const vaultIv = crypto.getRandomValues(new Uint8Array(12));
    const vaultData = enc.encode(vaultJsonString);
    const vaultCipher = await crypto.subtle.encrypt({ name: "AES-GCM", iv: vaultIv }, sessionKey, vaultData);
    
    // Helper to safely convert ArrayBuffer to Base64 (avoiding large stack size limitations)
    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return window.btoa(binary);
    };

    const vaultSnapshot = {
      ciphertext: arrayBufferToBase64(vaultCipher),
      iv: arrayBufferToBase64(vaultIv)
    };

    // 3. Derive wrapping key from OTP using PBKDF2 (matching Node's constraints)
    // PBKDF2_ITERATIONS = 100000, Salt = "ESCROW_SUPPORT_SALT"
    const otpMaterial = await crypto.subtle.importKey("raw", enc.encode(emailOtp), { name: "PBKDF2" }, false, ["deriveKey"]);
    const wrapKey = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: enc.encode("ESCROW_SUPPORT_SALT"), iterations: 100000, hash: "SHA-256" },
      otpMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt"]
    );

    // 4. Export Session Key and Encrypt (Wrap) it using the Wrapping Key
    const rawSessionKey = await crypto.subtle.exportKey("raw", sessionKey);
    const wrapIv = crypto.getRandomValues(new Uint8Array(12));
    
    const wrappedSessionBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv: wrapIv }, wrapKey, rawSessionKey);

    const escrowWrappedKey = arrayBufferToBase64(wrappedSessionBuffer);
    const escrowIv = arrayBufferToBase64(wrapIv);

    return {
      vaultSnapshot: JSON.stringify(vaultSnapshot),
      escrowWrappedKey,
      escrowIv
    };
  };

  return {
    masterKey,
    initVaultKey,
    encryptData,
    decryptData,
    generateEscrowBundle
  };
}
