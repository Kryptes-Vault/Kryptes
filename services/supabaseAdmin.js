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
  }
  return singleton;
}

module.exports = { getSupabaseAdmin };
