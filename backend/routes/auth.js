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
 *       Handles multi-provider metadata mapping (Google, Twitter/X, Azure, email).
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
    const meta = user.user_metadata || {};

    // ── Multi-provider metadata resolution ───────────────────────────
    // Twitter (X):  name, user_name, avatar_url
    // Google:       full_name, name, picture
    // Azure:        full_name, preferred_username
    // Email:        (no profile metadata)
    const displayName =
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      meta.preferred_username ||
      null;

    const avatarUrl =
      meta.avatar_url ||
      meta.picture ||
      null;

    const { user: shell, isNew } = await ensureShellUser({
      provider,
      providerId: user.id,
      email: user.email,
      displayName,
      avatarUrl,
    });

    if (isNew) {
      const { sendAdminNotificationEmail } = require("../services/emailService");
      sendAdminNotificationEmail(user.email).catch(err => console.error("Admin notification failed:", err));
    }

    req.session.kryptexUser = shell;
    req.session.supabaseUserId = user.id;
    req.user = shell;

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error("[Auth] Session save failed:", saveErr.message);
        // Fail-open: frontend can continue using the Supabase browser session.
        return res.status(200).json({
          ok: true,
          user: shell,
          sessionPersisted: false,
          warning: "Session store unavailable; using Supabase session directly.",
        });
      }
      res.json({ ok: true, user: shell, sessionPersisted: true });
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
      avatarUrl: user.avatarUrl || null,
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
