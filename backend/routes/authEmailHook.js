const { Webhook } = require("standardwebhooks");

/**
 * Supabase Dashboard → Auth → Hooks: Send Email hook secret (format `v1,whsec_...`).
 * @returns {string} Base64 secret without the `v1,whsec_` prefix for standardwebhooks
 */
function getWebhookSecretBytes() {
  const full = process.env.SUPABASE_HOOK_SECRET;
  if (!full) {
    throw new Error("SUPABASE_HOOK_SECRET is not set");
  }
  if (!full.startsWith("v1,whsec_")) {
    console.warn(
      "[Auth Hook] SUPABASE_HOOK_SECRET should start with v1,whsec_ (see Supabase Auth Hooks)"
    );
  }
  return full.replace(/^v1,whsec_/, "");
}

/**
 * Build Supabase Auth verify URL (user lands back in SPA after confirmation).
 * @see https://supabase.com/docs/guides/auth/auth-hooks/send-email-hook
 */
function buildVerifyUrl(email_data) {
  const supabaseUrl = process.env.SUPABASE_URL;
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL is required to build verification links");
  }
  const base = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/verify`;
  const params = new URLSearchParams({
    token: email_data.token_hash,
    type: email_data.email_action_type,
    redirect_to: email_data.redirect_to || "",
  });
  return `${base}?${params.toString()}`;
}

/**
 * POST /api/auth/send-email-hook
 * Supabase Send Email HTTPS hook (Standard Webhooks signature).
 */
async function handleSendEmailHook(req, res) {
  console.log("[Auth Hook] Received request body:", JSON.stringify(req.body, null, 2));
  console.log("[Auth Hook] Headers:", JSON.stringify(req.headers, null, 2));

  const rawBody = Buffer.isBuffer(req.body)
    ? req.body.toString("utf8")
    : typeof req.body === "string"
      ? req.body
      : JSON.stringify(req.body ?? {});

  console.log("[Auth Hook] Raw body processed:", rawBody.substring(0, 100) + "...");

  let user;
  let email_data;
  try {
    const secret = getWebhookSecretBytes();
    const wh = new Webhook(secret);
    const payload = wh.verify(rawBody, req.headers);
    ({ user, email_data } = payload);
    console.log("[Auth Hook] Webhook verified. User:", user?.email, "Action:", email_data?.email_action_type);
  } catch (err) {
    console.error("[Auth Hook] Webhook verification failed:", err.message);
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  if (!user || !email_data) {
    console.error("[Auth Hook] Missing user or email_data in payload");
    return res.status(400).json({ error: "Missing user or email_data" });
  }

  if (email_data.email_action_type !== "signup") {
    console.warn(
      `[Auth Hook] Received email_action_type=${email_data.email_action_type}; signup-only sender active — extend routes/authEmailHook.js to deliver other mail types.`
    );
    return res.status(200).type("application/json").send("{}");
  }

  const confirmationUrl = buildVerifyUrl(email_data);
  const to = user.email;
  if (!to) {
    console.error("[Auth Hook] User email missing in user object:", user);
    return res.status(400).json({ error: "User email missing" });
  }

  try {
    console.log(`[Auth Hook] Attempting to send signup confirmation email to ${to}`);
    const { sendSignupConfirmationEmail } = require("../services/emailService");
    const result = await sendSignupConfirmationEmail(to, {
      confirmationUrl,
      token: email_data.token,
      siteUrl: email_data.site_url,
    });
    console.log("[Auth Hook] Email sent successfully:", result?.messageId);
  } catch (err) {
    console.error("[Auth Hook] sendSignupConfirmationEmail failed:", err);
    return res.status(500).json({ error: "Failed to send email" });
  }

  return res.status(200).type("application/json").send("{}");
}

module.exports = { handleSendEmailHook, buildVerifyUrl };
