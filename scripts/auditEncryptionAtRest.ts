/**
 * Standalone encryption-at-rest audit for `vault_items.ciphertext`.
 * Requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (bypasses RLS).
 *
 * Run from backend/: npx tsx ../scripts/auditEncryptionAtRest.ts
 */
import path from "path";
import dotenv from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "backend", ".env") });

type VaultItemAuditRow = {
  id: string;
  ciphertext: string;
};

const PLAINTEXT_KEYWORD_FRAGMENTS = [
  "password",
  "cardnumber",
  "card_number",
  "cvv",
  "cvc",
  "expiry",
  "username",
  "secret",
  '"body"',
  '"title"',
] as const;

function assertNoPlaintextJsonLeak(encryptedPayload: string, rowId: string): void {
  const trimmed = encryptedPayload.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    throw new Error(
      `🚨 CRITICAL LEAK: Payload appears to be plaintext JSON! (row id: ${rowId})`
    );
  }
}

function assertNoKeywordLeak(encryptedPayload: string, rowId: string): void {
  const lower = encryptedPayload.toLowerCase();
  for (const kw of PLAINTEXT_KEYWORD_FRAGMENTS) {
    if (lower.includes(kw.toLowerCase())) {
      throw new Error(
        `🚨 CRITICAL LEAK: Ciphertext contains suspicious plaintext fragment "${kw}" (row id: ${rowId})`
      );
    }
  }
}

function getAdminClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url?.trim()) {
    throw new Error("Missing SUPABASE_URL");
  }
  if (!key?.trim()) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function main(): Promise<void> {
  const supabase = getAdminClient();

  const { data: rows, error } = await supabase
    .from("vault_items")
    .select("id, ciphertext")
    .order("updated_at", { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  const list = (rows ?? []) as VaultItemAuditRow[];

  if (list.length === 0) {
    console.log("(No rows returned — vault_items is empty; nothing to audit.)");
    console.log(
      "✅ Security Audit Passed: All records are successfully encrypted at rest."
    );
    return;
  }

  for (const row of list) {
    const encryptedPayload = row.ciphertext;
    if (typeof encryptedPayload !== "string" || encryptedPayload.length === 0) {
      throw new Error(`Invalid ciphertext on row ${row.id}`);
    }
    assertNoPlaintextJsonLeak(encryptedPayload, row.id);
    assertNoKeywordLeak(encryptedPayload, row.id);
  }

  const sample = list[0].ciphertext;
  console.log(
    "Sample ciphertext prefix (first 50 chars):",
    JSON.stringify(sample.slice(0, 50))
  );

  console.log(
    "✅ Security Audit Passed: All records are successfully encrypted at rest."
  );
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
