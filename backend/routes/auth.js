const express = require("express");
const router = express.Router();
const passport = require("passport");
const { sendVerificationEmail } = require("../services/emailService");
const { logUserToSheet } = require("../integrations/googleService");

/**
 * @route POST /api/auth/send-code
 * @desc Sends verification code via OAuth2 Gmail
 */
router.post("/send-code", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email required" });

  try {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await sendVerificationEmail(email, code);
    res.json({ success: true, message: "Verification code sent" });
  } catch (error) {
    res.status(500).json({ error: "Failed to send verification email" });
  }
});

// MULTI-PROVIDER AUTH ENDPOINTS
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport.authenticate("google", { failureRedirect: "/login" }), (req, res) => {
    res.redirect("http://localhost:8081/dashboard");
});

router.get("/microsoft", passport.authenticate("microsoft", { scope: ["user.read"] }));
router.get("/microsoft/callback", passport.authenticate("microsoft", { failureRedirect: "/login" }), (req, res) => {
    res.redirect("http://localhost:8081/dashboard");
});

router.get("/twitter", passport.authenticate("twitter"));
router.get("/twitter/callback", passport.authenticate("twitter", { failureRedirect: "/login" }), (req, res) => {
    res.redirect("http://localhost:8081/dashboard");
});

router.get("/yahoo", passport.authenticate("yahoo"));
router.get("/yahoo/callback", passport.authenticate("yahoo", { failureRedirect: "/login" }), (req, res) => {
    res.redirect("http://localhost:8081/dashboard");
});

module.exports = router;
