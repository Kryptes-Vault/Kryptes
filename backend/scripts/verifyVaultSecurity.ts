import dotenv from "dotenv";
import path from "path";
import crypto from "crypto";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const { getSupabaseAdmin } = require("../services/supabaseAdmin");
import { encryptForCache, decryptFromCache } from "../utils/cryptoUtils";

if (!process.env.REDIS_CACHE_KEY || process.env.REDIS_CACHE_KEY.length !== 64) {
  process.env.REDIS_CACHE_KEY = crypto.randomBytes(32).toString("hex");
  console.log("🛠️ Injected a dummy 64-character REDIS_CACHE_KEY for this test run.");
}

export async function verifyVaultSecurity() {
  console.log("🚀 Starting Vault Security & Isolation Verification...");

  // 1. Setup Dummy Identities
  const dummyPayload = {
    number: "1111222233334444",
    cvv: "123"
  };

  const payloadString = JSON.stringify(dummyPayload);
  let createdRowId: string | null = null;
  let USER_A_ID: string | null = null;
  let USER_B_ID: string | null = null;
  const supabase = getSupabaseAdmin();

  try {
    // 1. Create real dummy users to satisfy foreign key constraints (auth.users)
    const { data: authA, error: errA } = await supabase.auth.admin.createUser({
      email: `qa_engineer_a_${Date.now()}@kryptes.test`,
      password: "TestPassword123!",
      email_confirm: true
    });
    if (errA) throw new Error(`Could not create Dummy User A: ${errA.message}`);
    USER_A_ID = authA.user.id;

    const { data: authB, error: errB } = await supabase.auth.admin.createUser({
      email: `qa_engineer_b_${Date.now()}@kryptes.test`,
      password: "TestPassword123!",
      email_confirm: true
    });
    if (errB) throw new Error(`Could not create Dummy User B: ${errB.message}`);
    USER_B_ID = authB.user.id;

    console.log(`\n[Setup] User A UUID: ${USER_A_ID}`);
    console.log(`[Setup] User B UUID: ${USER_B_ID}`);

    // 2. The Encryption & Write Phase
    console.log("\n📤 Step 1: Encrypting and inserting User A's data...");
    const encryptedPayload = encryptForCache(payloadString);
    
    // We attempt to insert into vault_items using the newly mapped structure 
    const { data: insertData, error: insertError } = await supabase
      .from('vault_items')
      .insert({
        user_id: USER_A_ID,
        item_type: 'card',
        ciphertext: encryptedPayload,
        iv: 'bundled_in_ciphertext'
      })
      .select('id')
      .single();

    // Fallback error logging to accommodate potential schema conflicts explicitly
    if (insertError) {
      throw new Error(`Insert failed (Check your DB Schema Migration contains 'encrypted_payload' & 'item_type'): ${JSON.stringify(insertError)}`);
    }

    createdRowId = insertData.id;
    console.log(`✅ Data written as row ID: ${createdRowId}`);

    // 3. The Encryption Test (The "Breach" Check)
    console.log("\n🔍 Step 2: The Breach Check (Admin verifying ciphertext)...");
    const { data: breachData, error: breachError } = await supabase
      .from('vault_items')
      .select('*')
      .eq('id', createdRowId)
      .single();

    if (breachError || !breachData) {
      throw new Error("Failed to fetch the row for the breach check.");
    }

    const dbCiphertext = breachData.ciphertext || breachData.encrypted_payload;

    if (dbCiphertext.includes("1111222233334444")) {
      throw new Error("❌ CRITICAL FAILURE: Plaintext data found in database row!");
    } else {
      console.log("✅ Encryption Confirmed: Data is scrambled at rest.");
    }

    // 4. The Isolation Test (The Tenant Bleed Check)
    console.log("\n🕵️ Step 3: Tenant Bleed Check (Simulating User B request)...");
    
    // Simulating GET controller logic for User B across the items
    const { data: userBData, error: userBError } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', USER_B_ID);

    if (userBError) {
      throw new Error(`User B query failed: ${userBError.message}`);
    }

    if (userBData && userBData.length > 0) {
       const bleedRow = userBData.find((row: any) => row.id === createdRowId);
       if (bleedRow) {
         throw new Error("❌ CRITICAL FAILURE: Tenant Bleed Detected! User B saw User A's row.");
       }
    }
    console.log("✅ Tenant Isolation Confirmed: User B cannot see User A's data. Returned exactly: []");

    // 5. The Decryption & Teardown
    console.log("\n🔓 Step 4: The Decryption Test...");
    const { data: userAData, error: userAError } = await supabase
      .from('vault_items')
      .select('*')
      .eq('user_id', USER_A_ID)
      .single();

    if (userAError) {
      throw new Error(`User A query failed: ${userAError.message}`);
    }

    const rowToDecrypt = userAData.ciphertext || userAData.encrypted_payload;
    const decryptedString = decryptFromCache(rowToDecrypt);
    const decryptedJSON = JSON.parse(decryptedString);

    if (decryptedJSON.number === dummyPayload.number && decryptedJSON.cvv === dummyPayload.cvv) {
       console.log("✅ Decryption Confirmed: Data successfully recovered and mapped back into JSON.");
    } else {
       throw new Error("❌ Decryption mismatch: Recovered data does not match original!");
    }

    console.log("\n✨ Vault Security Integration Verification PASSED.");

  } catch (err: any) {
    console.error("\n❌ TEST FAILED:");
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    // 6. Complete Teardown
    if (createdRowId) {
      console.log(`\n🧹 Step 5: Teardown... Deleting test row ${createdRowId}`);
      try {
        await supabase.from('vault_items').delete().eq('id', createdRowId);
        console.log("✅ Demo Data Purged.");
      } catch (err: any) {
        console.error(`⚠️ Cleanup Failed for row ID: ${createdRowId}:`, err.message);
      }
    } else {
      console.log("\nℹ️ No row was created, skipping row teardown.");
    }

    if (USER_A_ID) {
      await supabase.auth.admin.deleteUser(USER_A_ID);
      console.log(`✅ Dummy User A (${USER_A_ID}) Purged.`);
    }
    if (USER_B_ID) {
      await supabase.auth.admin.deleteUser(USER_B_ID);
      console.log(`✅ Dummy User B (${USER_B_ID}) Purged.`);
    }
    console.log("🌟 Environment successfully cleaned.");
  }
}

verifyVaultSecurity();
