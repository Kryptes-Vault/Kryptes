import { getSupabaseAdmin } from "./supabaseAdmin";

type GatekeeperFlag = 'has_passwords' | 'has_cards' | 'has_documents' | 'has_otp';

/**
 * Checks if a specific gatekeeper flag is enabled for a given user.
 * Wraps the database query in a try/catch to ensure we default to false
 * on any error, preventing 500 status codes.
 */
export async function checkProfileFlag(userId: string, flag: GatekeeperFlag): Promise<boolean> {
  if (!userId) return false;
  
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("profiles")
      .select(flag)
      .eq("id", userId)
      .single();

    if (error || !data) {
      console.warn(`[Gatekeeper] Profile check failed or user not found for ${userId}:`, error?.message);
      return false;
    }

    return data[flag] === true;
  } catch (err) {
    console.error(`[Gatekeeper] Exception checking flag ${flag} for ${userId}:`, err);
    return false;
  }
}

/**
 * Sets a gatekeeper flag to true in the profile for a given user.
 * Silently fails if an error occurs to not interrupt the main write flow.
 */
export async function setProfileFlagActive(userId: string, flag: GatekeeperFlag): Promise<void> {
  if (!userId) return;

  try {
    const supabase = getSupabaseAdmin();
    const { error } = await supabase
      .from("profiles")
      .update({ [flag]: true })
      .eq("id", userId);

    if (error) {
      console.error(`[Gatekeeper] Failed to update flag ${flag} to active for ${userId}:`, error.message);
    } else {
      console.log(`[Gatekeeper] Emitted identity state change: ${flag} = true for ${userId}`);
    }
  } catch (err) {
    console.error(`[Gatekeeper] Exception setting flag ${flag} for ${userId}:`, err);
  }
}
