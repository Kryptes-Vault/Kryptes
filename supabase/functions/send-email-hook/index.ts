/**
 * Supabase Edge Function — Send Email (Auth Hook)
 *
 * Runs at the edge (no Render cold start). Verifies the Standard Webhooks
 * signature, then sends signup confirmation via Resend. Responds within
 * ~500ms — well inside Supabase's 3-second hook budget.
 *
 * Configure secrets in Supabase Dashboard → Functions → send-email-hook → Secrets:
 *   SUPABASE_HOOK_SECRET  (v1,whsec_…)
 *   SUPABASE_URL
 *   RESEND_API_KEY
 *   MAIL_FROM             (optional, defaults to "Kryptex <onboarding@resend.dev>")
 *
 * Point Auth → Hooks → Send Email to this function URL.
 *
 * @see docs/24_branding_and_handshake_architecture.md
 */
import { Webhook } from "npm:standardwebhooks@1.0.0";

// ── Helpers ────────────────────────────────────────────────────────────────

function headersToRecord(h: Headers): Record<string, string> {
  const o: Record<string, string> = {};
  h.forEach((v, k) => {
    o[k] = v;
  });
  return o;
}

function buildVerifyUrl(
  supabaseUrl: string,
  email_data: {
    token_hash: string;
    email_action_type: string;
    redirect_to?: string;
  },
): string {
  const base = `${supabaseUrl.replace(/\/$/, "")}/auth/v1/verify`;
  const params = new URLSearchParams({
    token: email_data.token_hash,
    type: email_data.email_action_type,
    redirect_to: email_data.redirect_to || "",
  });
  return `${base}?${params.toString()}`;
}

/**
 * Build the branded HTML email body for signup confirmation.
 */
function buildEmailHtml(confirmationUrl: string, token: string, siteUrl?: string): string {
  return `
    <div style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; max-width: 520px; margin: 0 auto; padding: 40px 24px; color: #111;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="font-size: 28px; font-weight: 900; letter-spacing: -0.02em; text-transform: uppercase; color: #111; margin: 0;">
          KRYPTEX
        </h1>
        <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #999; margin-top: 4px; font-weight: 600;">
          Zero-Knowledge Vault
        </p>
      </div>

      <div style="background: #fafafa; border: 1px solid #eee; border-radius: 16px; padding: 32px 24px; text-align: center;">
        <p style="font-size: 16px; color: #333; margin: 0 0 24px;">
          Confirm your email to activate your vault.
        </p>
        <a href="${confirmationUrl}"
           style="display: inline-block; background: #FF3B13; color: #fff; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase;">
          VERIFY EMAIL
        </a>

        <div style="margin-top: 24px; padding-top: 20px; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #666; margin: 0;">
            Or enter this code manually:
          </p>
          <p style="font-size: 24px; font-weight: 800; letter-spacing: 0.12em; color: #111; margin: 8px 0 0;">
            ${token}
          </p>
        </div>
      </div>

      ${siteUrl ? `<p style="font-size: 11px; color: #999; text-align: center; margin-top: 16px;">Site: ${siteUrl}</p>` : ""}

      <p style="font-size: 11px; color: #999; text-align: center; margin-top: 24px;">
        If you did not sign up for Kryptex, you can safely ignore this email.
      </p>
      <p style="font-size: 10px; color: #ccc; text-align: center; margin-top: 12px;">
        Kryptex &mdash; Your data, your keys, zero knowledge.
      </p>
    </div>
  `;
}

// ── Types ──────────────────────────────────────────────────────────────────

type HookPayload = {
  user: { email?: string };
  email_data: {
    email_action_type: string;
    token_hash: string;
    token: string;
    redirect_to?: string;
    site_url?: string;
  };
};

// ── Main handler ───────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const start = performance.now();

  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const hookSecret = Deno.env.get("SUPABASE_HOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const mailFrom = Deno.env.get("MAIL_FROM") || "Kryptex <onboarding@resend.dev>";

  if (!hookSecret || !supabaseUrl) {
    console.error("[send-email-hook] Missing SUPABASE_HOOK_SECRET or SUPABASE_URL");
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_HOOK_SECRET or SUPABASE_URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  // ── Verify Standard Webhooks signature ───────────────────────────────
  let payload: HookPayload;
  try {
    const secret = hookSecret.replace(/^v1,whsec_/, "");
    const wh = new Webhook(secret);
    payload = wh.verify(rawBody, headersToRecord(req.headers)) as HookPayload;
  } catch (e) {
    console.error("[send-email-hook] verification failed:", e);
    return new Response(JSON.stringify({ error: "Invalid webhook signature" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { user, email_data } = payload;
  if (!user?.email || !email_data) {
    return new Response(JSON.stringify({ error: "Missing user or email_data" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only handle signup for now — extend for password_reset, magic_link, etc.
  if (email_data.email_action_type !== "signup") {
    console.log(
      `[send-email-hook] Skipping email_action_type=${email_data.email_action_type} (signup-only)`
    );
    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const confirmationUrl = buildVerifyUrl(supabaseUrl, email_data);

  // ── Send via Resend ──────────────────────────────────────────────────
  if (!resendKey) {
    console.error(
      "[send-email-hook] RESEND_API_KEY not set — configure in Supabase Dashboard → Functions → Secrets",
    );
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const html = buildEmailHtml(confirmationUrl, email_data.token, email_data.site_url);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: mailFrom,
      to: [user.email],
      subject: "Confirm your Kryptex account",
      html,
    }),
  });

  const elapsed = (performance.now() - start).toFixed(0);

  if (!res.ok) {
    const text = await res.text();
    console.error(`[send-email-hook] Resend error (${elapsed}ms):`, res.status, text);
    return new Response(JSON.stringify({ error: "Email provider error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.log(
    `[send-email-hook] ✓ Email sent to ${user.email} (${email_data.email_action_type}) in ${elapsed}ms`
  );

  return new Response("{}", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
