const express = require("express");
const router = express.Router();
const passport = require("passport");
const {
  getPostLoginRedirect,
  getOAuthFailureRedirect,
} = require("../config/auth");

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

const successRedirect = (req, res) => {
  res.redirect(getPostLoginRedirect());
};

const failureRedirect = getOAuthFailureRedirect();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
router.get(
  "/google/callback",
  passport.authenticate("google", { failureRedirect }),
  successRedirect
);

router.get(
  "/twitter",
  passport.authenticate("twitter", {
    scope: ["users.read", "tweet.read", "users.email"],
  })
);
router.get(
  "/twitter/callback",
  passport.authenticate("twitter", { failureRedirect }),
  successRedirect
);

router.get(
  "/yahoo",
  passport.authenticate("yahoo", { scope: ["openid", "email", "profile"] })
);
router.get(
  "/yahoo/callback",
  passport.authenticate("yahoo", { failureRedirect }),
  successRedirect
);

/** Optional: who am I for the SPA (session cookie) */
router.get("/me", (req, res) => {
  if (!req.user) {
    return res.status(401).json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    user: {
      id: req.user.id,
      provider: req.user.provider,
      email: req.user.email,
      displayName: req.user.displayName,
    },
  });
});

router.post("/logout", (req, res) => {
  req.logout((err) => {
    if (err) return res.status(500).json({ error: "Logout failed" });
    req.session.destroy(() => {
      res.clearCookie("kryptex.sid", { path: "/" });
      res.json({ success: true });
    });
  });
});

module.exports = router;
