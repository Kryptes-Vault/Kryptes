import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { saveCardToBitwarden, fetchCardsFromBitwarden, deleteBitwardenItem } from "../services/bitwardenService";

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const DUMMY_USER_ID = "QA_TEST_USER_" + Date.now();

async function verifyBitwardenIntegration() {
  console.log("🚀 Starting Bitwarden Official Public API Verification...");

  // 1. Setup Dummy Data (Official Bitwarden Item Type 3: Card)
  const dummyPayload = {
    type: 3, 
    name: `Bank Card - QA TEST ${DUMMY_USER_ID}`,
    notes: "Automated Integration Test Card",
    card: {
      cardholderName: "QA ENGINEER",
      number: "1111222233334444",
      expMonth: "12",
      expYear: "2030",
      code: "999"
    },
    fields: [
      {
        name: "Account Number",
        value: "ACT-9988776655",
        type: 1 // Hidden/Secure
      },
      {
        name: "IFSC Code",
        value: "KRYP0004321",
        type: 1 // Hidden/Secure
      }
    ]
  };

  let createdItemId: string | null = null;

  try {
    // 2. Upload to Bitwarden
    console.log("📤 Step 1: Uploading dummy card to Bitwarden Public API...");
    const saveResponse = await saveCardToBitwarden(DUMMY_USER_ID, dummyPayload);
    
    createdItemId = saveResponse.id;
    console.log(`✅ Item uploaded successfully. Item ID: ${createdItemId}`);

    // 3. Verification (Fetch & Log)
    console.log("📥 Step 2: Fetching items back for verification...");
    // Note: We might need to wait a second for Bitwarden index consistency
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fetchedCards = await fetchCardsFromBitwarden(DUMMY_USER_ID);
    
    // The fetch logic in the service filters for item.name.includes('Bank Card')
    const testCard = fetchedCards.find((c: any) => c.name.includes(DUMMY_USER_ID));
    
    if (!testCard) {
      throw new Error(`❌ Verification Failed: Could not find the test card with ID suffix ${DUMMY_USER_ID} in the vault.`);
    }

    console.log("\n🔍 Retrieved Item JSON Inspection:");
    console.log(JSON.stringify(testCard, null, 2));

    // Specifically verify Custom Fields type
    console.log("\n🧪 Verifying Custom Fields encryption flags...");
    const fields = testCard.fields || [];
    const accountNumberField = fields.find((f: any) => f.name === "Account Number");
    const ifscField = fields.find((f: any) => f.name === "IFSC Code");

    let pass = true;
    if (!accountNumberField || accountNumberField.type !== 1) {
      console.error("❌ ERROR: Account Number field missing or not marked as secure (type 1)");
      pass = false;
    } else {
      console.log("✅ Account Number is marked as SECURE (type 1)");
    }

    if (!ifscField || ifscField.type !== 1) {
      console.error("❌ ERROR: IFSC Code field missing or not marked as secure (type 1)");
      pass = false;
    } else {
      console.log("✅ IFSC Code is marked as SECURE (type 1)");
    }

    if (pass) {
      console.log("\n✨ Bitwarden Public API Integration Verification PASSED.");
    } else {
      throw new Error("❌ Integration Verification FAILED due to field metadata mismatch.");
    }

  } catch (error: any) {
    console.error("\n❌ TEST FAILED:");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    // 4. Teardown (Delete)
    if (createdItemId) {
      console.log(`\n🧹 Step 3: Cleaning up... Deleting item ${createdItemId}`);
      try {
        await deleteBitwardenItem(createdItemId);
        console.log("✅ Demo Data Purged. Bitwarden Integration is Secure.");
      } catch (deleteError: any) {
        console.error(`⚠️ Cleanup Failed: Could not delete item ${createdItemId}.`);
        console.error(deleteError.message);
      }
    } else {
      console.log("\nℹ️ No item was created, skipping cleanup.");
    }
  }
}

verifyBitwardenIntegration();
