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
    singleton = createClient(url.trim(), key.trim(), {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return singleton;
}

/**
 * Performs a lightweight health check against the vault_items table.
 */
async function verifySupabaseConnection() {
  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase.from("vault_items").select("id").limit(1);
    if (error) {
      console.error("❌ Database: Supabase health check failed:", error.message);
      return false;
    }
    console.log("✅ Database: Supabase Connected and Table 'vault_items' is reachable.");
    return true;
  } catch (err) {
    console.error("❌ Database: Supabase exception during health check:", err instanceof Error ? err.message : err);
    return false;
  }
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
    .maybeSingle();

  if (error) {
    console.error(`[Gatekeeper] DB Error checking status for ${userId}:`, error.message);
    return true; // Fail open to allow standard fetch logic if DB is acting up
  }
  if (!data) {
    return false; // No profile row yet — treat as no vault data
  }
  return data.has_vault_data === true;
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

module.exports = { getSupabaseAdmin, verifySupabaseConnection, getUserVaultStatus, setUserVaultActive };
