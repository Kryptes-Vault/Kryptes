/**
 * Re-exports the CommonJS implementation so TypeScript callers resolve types cleanly.
 * Runtime implementation lives in `megaVaultConnection_impl.js` (required by plain `node`).
 */
import type { Storage } from "megajs";

export type MegaVaultStorage = Storage;

export async function initializeMegaVault(): Promise<MegaVaultStorage> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { initializeMegaVault: impl } = require("./megaVaultConnection_impl.js");
  return impl();
}
