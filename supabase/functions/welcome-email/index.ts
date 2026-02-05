import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";

/**
 * Supabase Edge Function: Welcome Email
 * Trigger: Database Webhook on auth.users (INSERT, UPDATE)
 * 
 * Note: Deno and other global types are available in the Supabase/Deno runtime.
 */

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE" | "SELECT";
  table: string;
  record: {
    email?: string;
    email_confirmed_at?: string | null;
    raw_user_meta_data?: Record<string, any>;
  };
  old_record: {
    email?: string;
    email_confirmed_at?: string | null;
  } | null;
  schema: string;
}

serve(async (req: Request) => {
  try {
    const payload: WebhookPayload = await req.json();

    // Prevent duplicate emails or invalid triggers
    // Only process INSERT or UPDATE events on the auth.users table
    const { type, record, old_record } = payload;
    
    if (type !== "INSERT" && type !== "UPDATE") {
      return new Response(JSON.stringify({ message: "Ignored event type." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Determine if the user is newly confirmed
    // A user is confirmed if email_confirmed_at is not null.
    const isNowConfirmed = !!record.email_confirmed_at;
    const wasConfirmed = old_record ? !!old_record.email_confirmed_at : false;

    if (!isNowConfirmed || (type === "UPDATE" && wasConfirmed)) {
      return new Response(JSON.stringify({ message: "User not newly confirmed. Ignoring." }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const email = record.email;
    if (!email) {
      throw new Error("No email address found in user record.");
    }

    // Extract user name with fallback
    const meta = record.raw_user_meta_data || {};
    const userName = (
      meta.full_name ||
      meta.name ||
      meta.user_name ||
      "EXPLORER"
    ).toUpperCase();

    // Retrieve environment variables
    // @ts-ignore: Deno is a global in Supabase Edge Functions
    const GMAIL_USER = Deno.env.get("GMAIL_USER") || "kryptes.app@gmail.com";
    // @ts-ignore
    const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID");
    // @ts-ignore
    const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET");
    // Explicitly using the refresh token scoped for kryptes.app@gmail.com
    // @ts-ignore
    const GOOGLE_REFRESH_TOKEN = Deno.env.get("GOOGLE_REFRESH_TOKEN");

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) {
        throw new Error("Missing Google OAuth credentials in environment variables.");
    }

    // SMTP Transport setup using Nodemailer on each request
    // @ts-ignore: nodemailer types might not be perfectly resolved in Deno environment
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: GMAIL_USER,
        clientId: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        refreshToken: GOOGLE_REFRESH_TOKEN,
      },
    });

    // Construct the HTML email from the provided template
    const htmlTemplate = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { margin: 0; padding: 0; background-color: #ffffff; font-family: 'Courier New', Courier, monospace; }
        .wrapper { width: 100%; table-layout: fixed; background-color: #ffffff; padding-bottom: 40px; }
        .main { background-color: #ffffff; width: 100%; max-width: 600px; margin: 0 auto; border-spacing: 0; color: #000000; border: 1px solid #f0f0f0; }
        .grid-bg { background-image: linear-gradient(#f9f9f9 1px, transparent 1px), linear-gradient(90deg, #f9f9f9 1px, transparent 1px); background-size: 30px 30px; padding: 50px 30px; text-align: left; }
        .label { color: #888; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; display: block; }
        .header-text { font-size: 42px; font-weight: 900; line-height: 1; text-transform: uppercase; letter-spacing: -1px; margin: 0; font-family: sans-serif; }
        .accent-text { color: #FF3300; }
        .user-greeting { font-size: 20px; font-weight: bold; margin: 25px 0; border-left: 3px solid #FF3300; padding-left: 15px; text-transform: uppercase; }
        
        /* Features Section */
        .feature-box { margin-top: 40px; padding: 20px; background: #fafafa; border: 1px solid #eee; }
        .feature-item { margin-bottom: 20px; }
        .feature-title { color: #FF3300; font-weight: bold; font-size: 14px; text-transform: uppercase; display: block; margin-bottom: 5px; }
        .feature-desc { font-size: 13px; color: #444; line-height: 1.5; }

        .vault-btn { margin-top: 30px; border: 1.5px solid #000; border-radius: 4px; padding: 15px 30px; text-decoration: none; color: #000; font-weight: bold; font-size: 13px; letter-spacing: 2px; text-transform: uppercase; display: inline-block; background: #ffffff; }
        .vault-btn:hover { background: #000; color: #fff; }
        
        .security-footer { margin-top: 40px; border-top: 1px dashed #ddd; padding-top: 20px; font-size: 11px; color: #999; line-height: 1.6; }
    </style>
</head>
<body>
    <center class="wrapper">
        <table class="main" width="100%">
            <tr>
                <td class="grid-bg">
                    <span class="label">// ACCESS_GRANTED.SYS</span>
                    <h1 class="header-text">WELCOME TO <span class="accent-text">KRYPTES</span></h1>
                    
                    <div class="user-greeting">
                        HELLO, ${userName}
                    </div>

                    <p style="font-size: 14px; line-height: 1.6; color: #333;">
                        Your node has been successfully integrated into the Kryptes Digital Ecosystem. You now have full access to our high-performance toolset.
                    </p>

                    <div class="feature-box">
                        <div class="feature-item">
                            <span class="feature-title">01. Neural Collaboration</span>
                            <span class="feature-desc">Experience real-time sync across all your devices with zero latency.</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-title">02. Advanced Automation</span>
                            <span class="feature-desc">Trigger complex workflows and AI-driven insights directly from your vault.</span>
                        </div>
                        <div class="feature-item">
                            <span class="feature-title">03. Zero-Knowledge Security</span>
                            <span class="feature-desc">Your data is encrypted at the edge. We provide the platform; you hold the keys. No one else can see your data—not even us.</span>
                        </div>
                    </div>

                    <center>
                        <a href="https://kryptes.app" class="vault-btn">ENTER THE VAULT</a>
                    </center>

                    <div class="security-footer">
                        <strong>SECURITY PROTOCOL:</strong> AES-256 ENCRYPTED / OAUTH 2.0 VERIFIED<br>
                        This is an automated system message. No response required.<br>
                        &copy; 2026 KRYPTES ECOSYSTEM. ALL RIGHTS RESERVED.
                    </div>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>`;

    // Send the email
    const info = await transporter.sendMail({
      from: `"Kryptes" <${GMAIL_USER}>`,
      to: email,
      subject: "Welcome to Kryptes - Access Granted",
      html: htmlTemplate,
    });

    console.log("Welcome email sent successfully:", info.messageId);

    return new Response(JSON.stringify({ message: "Welcome email sent." }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error processing webhook or sending email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
