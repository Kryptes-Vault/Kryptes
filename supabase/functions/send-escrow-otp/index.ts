import { serve } from "https://deno.land/std@0.192.0/http/server.ts";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userEmail, otpCode } = await req.json();

    if (!userEmail || !otpCode) {
      throw new Error("Missing required fields: userEmail or otpCode");
    }

    // UPDATED: Mapped to your exact Supabase Secret names
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: Deno.env.get('GMAIL_USER'),
        clientId: Deno.env.get('GOOGLE_CLIENT_ID'), 
        clientSecret: Deno.env.get('GOOGLE_CLIENT_SECRET'),
        refreshToken: Deno.env.get('GOOGLE_REFRESH_TOKEN'),
      }
    });

    const htmlTemplate = `
      <!DOCTYPE html>
      <html>
      <head>
          <style>
              body { margin: 0; padding: 0; background-color: #ffffff; font-family: 'Courier New', Courier, monospace; }
              .wrapper { width: 100%; table-layout: fixed; background-color: #ffffff; padding-bottom: 40px; }
              .main { background-color: #ffffff; width: 100%; max-width: 600px; margin: 0 auto; border-spacing: 0; color: #000000; border: 1px solid #f0f0f0; }
              .grid-bg { background-image: linear-gradient(#f9f9f9 1px, transparent 1px), linear-gradient(90deg, #f9f9f9 1px, transparent 1px); background-size: 30px 30px; padding: 50px 30px; text-align: left; }
              .label { color: #888; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 10px; display: block; }
              .header-text { font-size: 32px; font-weight: 900; line-height: 1.2; text-transform: uppercase; letter-spacing: -1px; margin: 0 0 20px 0; font-family: sans-serif; }
              .accent-text { color: #FF3300; }
              .otp-container { margin: 30px 0; padding: 40px 25px; background: #000000; border: 2px solid #FF3300; text-align: center; }
              .otp-label { color: #FF3300; font-size: 11px; letter-spacing: 5px; margin-bottom: 15px; display: block; font-weight: bold; }
              .otp-code { font-size: 52px; font-weight: bold; letter-spacing: 12px; color: #ffffff; margin: 0; font-family: 'Courier New', Courier, monospace; }
              .warning-text { font-size: 12px; color: #666; line-height: 1.5; margin-top: 30px; border-left: 2px solid #FF3300; padding-left: 15px; }
              .security-footer { margin-top: 40px; border-top: 1px dashed #ddd; padding-top: 20px; font-size: 11px; color: #999; line-height: 1.6; text-transform: uppercase; }
          </style>
      </head>
      <body>
          <center class="wrapper">
              <table class="main" width="100%">
                  <tr>
                      <td class="grid-bg">
                          <span class="label">// ACCESS_PROVISIONING.SYS</span>
                          <h1 class="header-text">CONFIRM <span class="accent-text">DEV</span> GRANT</h1>
                          <p style="font-size: 14px; line-height: 1.6; color: #333; font-weight: bold;">ACTION: PROVISION DEVELOPER CREDENTIALS</p>
                          <p style="font-size: 14px; line-height: 1.6; color: #333;">You are about to authorize the transmission of environment keys to a developer node. Use the confirmation sequence below to finalize the bridge.</p>
                          
                          <div class="otp-container">
                              <span class="otp-label">CONFIRMATION SEQUENCE</span>
                              <h2 class="otp-code">${otpCode}</h2> 
                          </div>
                          
                          <p class="warning-text">
                              <strong>SECURITY NOTICE:</strong> Entering this code will grant the developer full repository and vault access. Ensure the recipient's identity has been verified through secondary channels.
                          </p>
                          
                          <div class="security-footer">
                              PROTOCOL: GRANT_CONFIRMATION_V2<br>
                              STATUS: AWAITING_ADMIN_BYPASS<br>
                              &copy; 2026 KRYPTES ECOSYSTEM.
                          </div>
                      </td>
                  </tr>
              </table>
          </center>
      </body>
      </html>
    `;

    const mailOptions = {
      from: \`Kryptes Security <\${Deno.env.get('GMAIL_USER')}>\`,
      to: userEmail,
      subject: "[ACTION REQUIRED] Confirm Developer Escrow Grant",
      html: htmlTemplate,
    };

    await transporter.sendMail(mailOptions);

    return new Response(
      JSON.stringify({ success: true, message: "Kryptes Escrow email dispatched successfully." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Critical failure during email dispatch:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
