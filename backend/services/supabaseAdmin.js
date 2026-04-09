const { createClient } = require("@supabase/supabase-js");

let singleton;

/**
 * Service-role Supabase client — Render only. Validates JWTs via auth.getUser().
 */
function getSupabaseAdmin() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set on the API"
    );
  }
  if (!singleton) {
    singleton = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    // Verify connection status (lightweight check)
    singleton.from("vault").select("count").limit(1).then(({ error }) => {
      if (error) {
        console.error("❌ Supabase: Admin client initialized but table 'vault' health check failed:", error.message);
      } else {
        console.log("✅ Supabase Admin Client: Connected and Decrypted!");
      }
    });
  }
  return singleton;
}

module.exports = { getSupabaseAdmin };
