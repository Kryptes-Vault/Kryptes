/**
 * MEGA.nz vault connection — works with plain `node` (no tsx required).
 * TypeScript wrapper: `megaVaultConnection.ts` re-exports this module.
 */
const dotenv = require("dotenv");
const mega = require("megajs");

dotenv.config();

const { Storage } = mega;

/**
 * @returns {Promise<import("megajs").Storage>}
 */
async function initializeMegaVault() {
  const email = process.env.MEGA_EMAIL;
  const password = process.env.MEGA_PASSWORD;

  if (!email?.trim() || password === undefined || password === "") {
    const detail = "MEGA_EMAIL and MEGA_PASSWORD must be set.";
    console.error("❌ CRITICAL: Failed to decrypt MEGA Vault", detail);
    process.exit(1);
  }

  try {
    const storage = await new Promise((resolve, reject) => {
      const instance = new Storage(
        {
          email: email.trim(),
          password,
          userAgent: "Kryptes-Vault-Service/1.0",
        },
        (error) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(instance);
        }
      );
    });

    console.log("✅ MEGA Vault Connected and Decrypted!");
    return storage;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("❌ CRITICAL: Failed to decrypt MEGA Vault", message);
    process.exit(1);
    throw error;
  }
}

module.exports = { initializeMegaVault };
