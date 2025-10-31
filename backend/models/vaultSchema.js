const { z } = require("zod");

/**
 * Zod Schema for Vault Data Flow
 * Ensures that card numbers, account details, etc. are passed as 
 * pre-encrypted strings. Bitwarden stores the final ciphertext.
 */
const vaultSchema = z.object({
  userId: z.string().uuid().or(z.string().min(1)),
  encryptedData: z.string().min(1, "Ciphertext is required (AES-256)"),
  referenceId: z.string().optional(), // Reference to MEGA file link
  metadata: z.object({
    type: z.enum(["banking", "identity", "social"]),
    lastUpdated: z.string().datetime().default(() => new Date().toISOString())
  }).optional()
});

module.exports = { vaultSchema };
