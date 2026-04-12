const express = require("express");
const router = express.Router();
const { ensureShellUser } = require("../services/userShellStore");
const { getSupabaseAdmin } = require("../services/supabaseAdmin");

/**
 * @route POST /api/auth/send-code
 * @desc Sends verification code via OAuth2 Gmail
 */
router.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const { sendVerificationEmail } = require("../services/emailService");
    await sendVerificationEmail(email, code);
    res.json({ success: true, message: "Verification code sent" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

/**
 * @route POST /api/auth/supabase/sync
 * @desc Validates Supabase access token, creates shell user in Redis, sets session cookie.
 */
router.post("/supabase/sync", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing bearer token" });
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: "Empty token" });
  }

  try {
    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const identity = user.identities && user.identities[0];
    const provider = identity?.provider || "email";

    const shell = await ensureShellUser({
      provider,
      providerId: user.id,
      email: user.email,
      displayName:
        user.user_metadata?.full_name ||
        user.user_metadata?.name ||
        user.user_metadata?.user_name ||
        user.user_metadata?.preferred_username ||
        null,
    });

    req.session.kryptexUser = shell;
    req.session.supabaseUserId = user.id;
    req.user = shell;

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("[Auth] Session save failed:", saveErr.message);
        return res.status(500).json({ error: "Session save failed" });
      }
      res.json({ ok: true, user: shell });
    });
  } catch (e) {
    if (e.message?.includes("SUPABASE_URL")) {
      return res.status(503).json({ error: "Supabase not configured on server" });
    }
    console.error("[Auth] supabase/sync:", e);
    res.status(500).json({ error: "Sync failed" });
  }
});

router.get("/me", (req, res) => {
  const user = req.user || req.session?.kryptexUser;
  if (!user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user: {
      id: user.id,
      provider: user.provider,
      email: user.email,
      displayName: user.displayName,
    },
  });
});

router.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    res.clearCookie("kryptex.sid", { path: "/" });
    res.json({ success: true });
  });
});

module.exports = router;
