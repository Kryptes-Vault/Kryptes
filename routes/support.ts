import express from "express";
import { Redis } from "ioredis";
import crypto from "crypto";
const { getSupabaseAdmin } = require("../services/supabaseAdmin");

const router = express.Router();
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const ESCROW_SALT = "ESCROW_SUPPORT_SALT";
const PBKDF2_ITERATIONS = 100000;

// Middleware to mock or grab user from session (Assuming injected via standard middleware elsewhere)
// For demonstration, we'll extract it from standard Kryptes headers/tokens
function requireAuth(req: any, res: any, next: any) {
  const userId = req.headers['x-user-id'] || req.body.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized. Missing user mapping." });
  req.user = { id: userId, email: req.headers['x-user-email'] || req.body.userEmail };
  next();
}

/**
 * Step 3A: Initialize Escrow
 * Generates an OTP, stores the hash, and triggers the Supabase Edge function for email dispatch.
 */
router.post("/initialize", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!userEmail) throw new Error("User email is required to dispatch OTP.");

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hash = crypto.createHash('sha256').update(otp).digest('hex');

    // Store hash temporarily (15 minutes)
    await redisClient.setex(`escrow_otp:${userId}`, 900, hash);

    // Call Supabase Edge Function to deliver the email
    const edgeCall = await fetch(`${process.env.SUPABASE_URL}/functions/v1/send-escrow-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ userEmail, otpCode: otp })
    });

    if (!edgeCall.ok) {
      const errParams = await edgeCall.text();
      console.error("Edge dispatch failed:", errParams);
      throw new Error("Failed to dispatch Edge Function email.");
    }

    res.status(200).json({ success: true, message: "Escrow initialization successful. OTP Dispatched." });
  } catch (error: any) {
    console.error("[Support Init]", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Step 3C: Finalize Escrow Grant
 * Validates OTP and inserts escrow bundle directly into the secure Support Grants table.
 */
router.post("/grant", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { otp, escrowWrappedKey, escrowIv, vaultSnapshot } = req.body;

    if (!otp || !escrowWrappedKey || !vaultSnapshot) {
      return res.status(400).json({ error: "Missing escrow payload parameters." });
    }

    const hashedInput = crypto.createHash('sha256').update(otp.toString()).digest('hex');
    const storedHash = await redisClient.get(`escrow_otp:${userId}`);

    if (!storedHash || storedHash !== hashedInput) {
      return res.status(403).json({ error: "Invalid or expired escrow OTP sequence." });
    }

    const supabase = getSupabaseAdmin();
    // We optionally hash the OTP again to store inside support_grants so we have immutable proof,
    // though the presence of the row implies explicit grant. We will use a hashed salt for DB resting.
    const dbHash = crypto.createHash('sha256').update(otp + "DB_SALT").digest('hex');

    const { error } = await supabase.from('support_grants').insert({
      user_id: userId,
      otp_hash: dbHash,
      escrow_wrapped_key: escrowWrappedKey,
      escrow_iv: escrowIv,
      vault_snapshot: vaultSnapshot
    });

    if (error) throw new Error("Database insertion failed: " + JSON.stringify(error));

    // Clear one-time hash
    await redisClient.del(`escrow_otp:${userId}`);

    res.status(200).json({ success: true, message: "Secure Developer Grant Escalated." });
  } catch (error: any) {
    console.error("[Support Grant]", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Step 4: Developer Decryption Offline Admin endpoint.
 * Requires Admin API key header.
 */
router.post("/admin/decrypt", async (req, res) => {
  try {
    const adminKey = req.headers['x-admin-secret'];
    if (adminKey !== process.env.ADMIN_SECRET) {
      return res.status(401).json({ error: "Not authorized as Support Admin." });
    }

    const { targetUserId, otp } = req.body;

    const supabase = getSupabaseAdmin();
    
    // Fetch valid grant
    const { data: grants, error } = await supabase
      .from('support_grants')
      .select('*')
      .eq('user_id', targetUserId)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (error || !grants || grants.length === 0) {
      return res.status(404).json({ error: "No active escrow grants found for this user." });
    }

    const grant = grants[0];
    const dbHash = crypto.createHash('sha256').update(otp + "DB_SALT").digest('hex');
    
    if (dbHash !== grant.otp_hash) {
      return res.status(403).json({ error: "Invalid decryption OTP for this grant." });
    }

    // 1. Derive the PBKDF2 Wrapping Key using Node Crypto
    const wrapKey = crypto.pbkdf2Sync(otp, ESCROW_SALT, PBKDF2_ITERATIONS, 32, 'sha256');

    // 2. Decrypt the Escrow string to get the temporary Session Key
    const escrowIvBuf = Buffer.from(grant.escrow_iv, 'base64');
    const escrowCipher = Buffer.from(grant.escrow_wrapped_key, 'base64');
    
    // We split out auth tag from AES-GCM (usually last 16 bytes in node)
    const tag = escrowCipher.subarray(escrowCipher.length - 16);
    const ct = escrowCipher.subarray(0, escrowCipher.length - 16);

    const decipher = crypto.createDecipheriv('aes-256-gcm', wrapKey, escrowIvBuf);
    decipher.setAuthTag(tag);

    // The raw decrypted temporary session key
    const rawSessionKey = Buffer.concat([decipher.update(ct), decipher.final()]);

    // 3. Decrypt the vault_snapshot using the unwrapped session key
    const vaultRecord = JSON.parse(grant.vault_snapshot);
    const vaultIvBuf = Buffer.from(vaultRecord.iv, 'base64');
    const vaultCipher = Buffer.from(vaultRecord.ciphertext, 'base64');

    const vTag = vaultCipher.subarray(vaultCipher.length - 16);
    const vCt = vaultCipher.subarray(0, vaultCipher.length - 16);

    const vaultDecipher = crypto.createDecipheriv('aes-256-gcm', rawSessionKey, vaultIvBuf);
    vaultDecipher.setAuthTag(vTag);

    const decryptedVaultJSONBytes = Buffer.concat([vaultDecipher.update(vCt), vaultDecipher.final()]);
    const vaultData = JSON.parse(decryptedVaultJSONBytes.toString('utf8'));

    res.status(200).json({
      success: true,
      message: "Decrypted successfully via OTP Escrow protocol.",
      grantId: grant.id,
      vault: vaultData
    });
  } catch (error: any) {
    console.error("[Support Admin Decrypt]", error.message);
    res.status(500).json({ error: "Escrow Decryption Failed: " + error.message });
  }
});

module.exports = router;
