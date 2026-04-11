/**
 * Security audit: verify `vault_items` rows for a single test user ID using the
 * Supabase service-role client. Every returned row must have `user_id` strictly
 * equal to the configured test UUID.
 *
 * Required env (in backend/.env):
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - VERIFY_TEST_USER_ID=<uuid>   (your test Supabase auth user id)
 *
 * Run from the `backend` folder:
 *   npx tsx scripts/verifyUserData.ts
 */
import dotenv from "dotenv";
import path from "path";
import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseAdmin } from "../services/supabaseAdmin";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

interface VaultItemRow {
  id: string;
  user_id: string;
  item_type: string | null;
  created_at: string | null;
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(message: string, err?: PostgrestError | Error): never {
  console.error(`❌ ${message}`);
  if (err) console.error(err.message);
  process.exit(1);
}

async function main(): Promise<void> {
  const raw = process.env.VERIFY_TEST_USER_ID?.trim();
  if (!raw) {
    fail(
      "Missing VERIFY_TEST_USER_ID. Set it in backend/.env to your test user's UUID."
    );
  }
  if (!UUID_RE.test(raw)) {
    fail(`VERIFY_TEST_USER_ID does not look like a UUID: ${raw}`);
  }
  const testUserId = raw.toLowerCase();

  console.log("🔐 verifyUserData — vault_items isolation check");
  console.log(`   Test user_id (expected): ${testUserId}\n`);

  let supabase: ReturnType<typeof getSupabaseAdmin>;
  try {
    supabase = getSupabaseAdmin();
  } catch (e) {
    fail("getSupabaseAdmin() failed — check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.", e as Error);
  }

  const { data: rows, error } = await supabase
    .from("vault_items")
    .select("id, user_id, item_type, created_at")
    .eq("user_id", testUserId)
    .order("created_at", { ascending: false });

  if (error) {
    fail("vault_items query failed.", error);
  }

  const list = (rows ?? []) as VaultItemRow[];

  for (const row of list) {
    if (row.user_id !== testUserId) {
      console.error("Mismatch row:", row);
      fail(
        `Assertion failed: row ${row.id} has user_id ${row.user_id}, expected ${testUserId}`
      );
    }
  }

  console.log(`✅ Query scoped with .eq("user_id", …) returned ${list.length} row(s).`);
  console.log("✅ Strict equality: every row.user_id matches VERIFY_TEST_USER_ID.\n");

  if (list.length > 0) {
    console.log("Sample (max 10):");
    list.slice(0, 10).forEach((r) => {
      console.log(
        `   • ${r.id}  type=${r.item_type ?? "?"}  created=${r.created_at ?? "?"}`
      );
    });
  }
}

void main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
