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

/**
 * Checks if a user has any data in their vault via the Gatekeeper flag.
 */
async function getUserVaultStatus(userId) {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("profiles")
    .select("has_vault_data")
    .eq("id", userId)
    .single();

  if (error) {
    console.error(`[Gatekeeper] DB Error checking status for ${userId}:`, error.message);
    return true; // Fail open to allow standard fetch logic if DB is acting up
  }
  return data?.has_vault_data || false;
}

/**
 * Sets the has_vault_data flag to true for a user.
 */
async function setUserVaultActive(userId) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("profiles")
    .update({ has_vault_data: true })
    .eq("id", userId);

  if (error) {
    console.error(`[Gatekeeper] Failed to update vault status for ${userId}:`, error.message);
  } else {
    console.log(`[Gatekeeper] User ${userId} vault now marked as ACTIVE.`);
  }
}

module.exports = { getSupabaseAdmin, getUserVaultStatus, setUserVaultActive };
