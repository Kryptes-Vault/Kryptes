import express from "express";
import { Redis } from "ioredis";
import crypto from "crypto";
const { getSupabaseAdmin } = require("../services/supabaseAdmin");

const router = express.Router();
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

type AuthedRequest = express.Request & { user: { id: string; email?: string } };

/** PBKDF2 salt label; must match browser `useVaultCrypto` (historical string — do not change). */
const DEVELOPER_ACCESS_PBKDF2_SALT = "ESCROW_SUPPORT_SALT";
const PBKDF2_ITERATIONS = 100000;

/** Shell user from POST /api/auth/supabase/sync; Supabase auth UUID lives on session. */
function requireAuth(req: any, res: any, next: any) {
  const shell = req.user || req.session?.kryptexUser;
  const userId =
    req.headers["x-user-id"] || req.body?.userId || shell?.id;
  const email =
    req.headers["x-user-email"] || req.body?.userEmail || shell?.email;
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized. Missing user mapping." });
  }
  req.user = { id: userId, email };
  next();
}

function getSupabaseAuthUserId(req: any): string | undefined {
  return req.session?.supabaseUserId;
}

const DEV_ACCESS_OTP_PREFIX = "developer_access_otp:";

/**
 * Sends a 6-digit OTP by email: stores SHA-256(otp) in Redis, then calls Edge Function `developer-otp`.
 * Requires an Express session with `supabaseUserId` (see POST /api/auth/supabase/sync).
 */
router.post("/initialize", requireAuth, async (req, res) => {
  try {
    const authUserId = getSupabaseAuthUserId(req);
    if (!authUserId) {
      return res.status(401).json({
        error: "Missing Supabase session. Sign in and sync your session before requesting developer access.",
      });
    }

    const userEmail = (req as AuthedRequest).user.email;
    if (!userEmail) throw new Error("User email is required to dispatch OTP.");

    const otp = crypto.randomInt(100000, 1000000).toString();
    const hash = crypto.createHash("sha256").update(otp).digest("hex");

    await redisClient.setex(`${DEV_ACCESS_OTP_PREFIX}${authUserId}`, 900, hash);

    const edgeCall = await fetch(`${process.env.SUPABASE_URL}/functions/v1/developer-otp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ userEmail, otpCode: otp }),
    });

    if (!edgeCall.ok) {
      const errParams = await edgeCall.text();
      console.error("Edge dispatch failed:", errParams);
      throw new Error("Failed to dispatch Edge Function email.");
    }

    res.status(200).json({ success: true, message: "Verification code sent." });
  } catch (error: any) {
    console.error("[Developer access init]", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Validates OTP against Redis, then inserts the encrypted bundle into `support_grants`.
 * `user_id` must be the Supabase Auth UUID (FK to auth.users), not the opaque shell id.
 */
async function handleRequestDeveloperAccess(req: any, res: any) {
  try {
    const authUserId = getSupabaseAuthUserId(req);
    if (!authUserId) {
      return res.status(401).json({
        error: "Missing Supabase session. Sign in and sync your session before granting developer access.",
      });
    }

    const otp = req.body?.otp ?? req.body?.otpCode;
    const developerAccessWrappedKey =
      req.body?.developerAccessWrappedKey ?? req.body?.escrowWrappedKey;
    const developerAccessIv = req.body?.developerAccessIv ?? req.body?.escrowIv;
    const vaultSnapshot = req.body?.vaultSnapshot ?? req.body?.encryptedVaultData;

    if (!otp || !developerAccessWrappedKey || !developerAccessIv || !vaultSnapshot) {
      return res.status(400).json({
        error:
          "Missing developer access payload. Expected otp (or otpCode), developerAccessWrappedKey (or escrowWrappedKey), developerAccessIv (or escrowIv), vaultSnapshot (or encryptedVaultData).",
      });
    }

    const hashedInput = crypto.createHash("sha256").update(String(otp)).digest("hex");
    const storedHash = await redisClient.get(`${DEV_ACCESS_OTP_PREFIX}${authUserId}`);

    if (!storedHash || storedHash !== hashedInput) {
      return res.status(403).json({ error: "Invalid or expired verification code." });
    }

    const supabase = getSupabaseAdmin();
    const dbHash = crypto.createHash("sha256").update(String(otp) + "DB_SALT").digest("hex");

    const { error } = await supabase.from("support_grants").insert({
      user_id: authUserId,
      otp_hash: dbHash,
      escrow_wrapped_key: developerAccessWrappedKey,
      escrow_iv: developerAccessIv,
      vault_snapshot: vaultSnapshot,
    });

    if (error) throw new Error("Database insertion failed: " + JSON.stringify(error));

    await redisClient.del(`${DEV_ACCESS_OTP_PREFIX}${authUserId}`);

    res.status(200).json({ success: true, message: "Developer access bundle stored securely." });
  } catch (error: any) {
    console.error("[Developer access grant]", error.message);
    res.status(500).json({ error: error.message });
  }
}

router.post("/request-developer-access", requireAuth, handleRequestDeveloperAccess);
/** @deprecated Legacy path name; use POST /request-developer-access */
router.post("/request-escrow", requireAuth, handleRequestDeveloperAccess);

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
      return res.status(404).json({ error: "No active developer access grants found for this user." });
    }

    const grant = grants[0];
    const dbHash = crypto.createHash('sha256').update(otp + "DB_SALT").digest('hex');
    
    if (dbHash !== grant.otp_hash) {
      return res.status(403).json({ error: "Invalid decryption OTP for this grant." });
    }

    // 1. Derive the PBKDF2 wrapping key (must match browser developer-access bundle)
    const wrapKey = crypto.pbkdf2Sync(otp, DEVELOPER_ACCESS_PBKDF2_SALT, PBKDF2_ITERATIONS, 32, "sha256");

    // 2. Unwrap the session key (columns retain historical names in DB)
    const wrappedIvBuf = Buffer.from(grant.escrow_iv, "base64");
    const wrappedSessionCipher = Buffer.from(grant.escrow_wrapped_key, "base64");

    const tag = wrappedSessionCipher.subarray(wrappedSessionCipher.length - 16);
    const ct = wrappedSessionCipher.subarray(0, wrappedSessionCipher.length - 16);

    const decipher = crypto.createDecipheriv("aes-256-gcm", wrapKey, wrappedIvBuf);
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
      message: "Decrypted successfully via developer access (OTP) protocol.",
      grantId: grant.id,
      vault: vaultData
    });
  } catch (error: any) {
    console.error("[Support Admin Decrypt]", error.message);
    res.status(500).json({ error: "Developer access decryption failed: " + error.message });
  }
});

module.exports = router;
