/**
 * Supabase Edge Function — Send Email (Auth Hook)
 *
 * Runs at the edge (no Render cold start). Verify the Standard Webhooks signature,
 * then send signup confirmation via Resend. Configure secrets in Supabase Dashboard
 * (Functions → send-email-hook → Secrets) and point Auth → Hooks → Send Email to
 * this function URL.
 *
 * Required secrets: SUPABASE_HOOK_SECRET (v1,whsec_…), SUPABASE_URL, RESEND_API_KEY
 * Optional: MAIL_FROM
 *
 * @see docs/23_production_auth_debugging.md
 */
import { Webhook } from "npm:standardwebhooks@1.0.0";

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

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const rawBody = await req.text();
  const hookSecret = Deno.env.get("SUPABASE_HOOK_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const mailFrom =
    Deno.env.get("MAIL_FROM") || "Kryptex <onboarding@resend.dev>";

  if (!hookSecret || !supabaseUrl) {
    return new Response(
      JSON.stringify({ error: "Missing SUPABASE_HOOK_SECRET or SUPABASE_URL" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

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

  if (email_data.email_action_type !== "signup") {
    return new Response("{}", {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const confirmationUrl = buildVerifyUrl(supabaseUrl, email_data);

  if (!resendKey) {
    console.error(
      "[send-email-hook] RESEND_API_KEY not set — configure Resend or use a paid Render tier for the Node hook.",
    );
    return new Response(
      JSON.stringify({ error: "RESEND_API_KEY not configured on Edge Function" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const html = `
        <div style="font-family: sans-serif; padding: 20px; color: #111;">
          <h2 style="color: #FF3B13;">Kryptex Zero-Knowledge Vault</h2>
          <p>Confirm your email to activate your vault.</p>
          <p style="margin: 24px 0;">
            <a href="${confirmationUrl}" style="display:inline-block;background:#FF3B13;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;">
              Confirm email
            </a>
          </p>
          <p style="font-size: 13px; color: #444;">Or enter this code: <strong>${email_data.token}</strong></p>
          ${email_data.site_url ? `<p style="font-size: 12px; color: #666;">Site: ${email_data.site_url}</p>` : ""}
          <p style="font-size: 12px; color: #666; margin-top: 20px;">If you did not sign up, ignore this email.</p>
        </div>
      `;

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

  if (!res.ok) {
    const text = await res.text();
    console.error("[send-email-hook] Resend error:", res.status, text);
    return new Response(JSON.stringify({ error: "Email provider error" }), {
      status: 502,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response("{}", {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
