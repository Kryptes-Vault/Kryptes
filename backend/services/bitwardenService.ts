import axios from "axios";

/**
 * Service to interact with the Bitwarden Public API (Organization API).
 */

const BITWARDEN_API_URL = "https://api.bitwarden.com";
const BITWARDEN_IDENTITY_URL = "https://identity.bitwarden.com";

/**
 * Fetches an OAuth2 access token from Bitwarden Identity server.
 * Uses client_credentials grant type with BW_CLIENT_ID and BW_CLIENT_SECRET.
 */
async function fetchBitwardenToken(): Promise<string> {
  const clientId = process.env.BW_CLIENT_ID;
  const clientSecret = process.env.BW_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Bitwarden Config Incomplete: BW_CLIENT_ID or BW_CLIENT_SECRET missing.");
  }

  try {
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("scope", "api");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    params.append("deviceType", "0");
    params.append("deviceName", "Kryptes-Server-Gateway");
    params.append("deviceIdentifier", "77cca5ee-48c6-4f25-9615-5d06a384ff2f"); // Static test UUID

    const response = await axios.post(`${BITWARDEN_IDENTITY_URL}/connect/token`, params, {
      headers: { 
        "Content-Type": "application/x-www-form-urlencoded",
        "Bitwarden-Client-Version": "2024.1.0"
      },
    });

    return response.data.access_token;
  } catch (error: any) {
    console.error("Bitwarden Identity Fetch Failed:", error.response?.data || error.message);
    throw new Error(`Bitwarden Auth Failed: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}

/**
 * Log Bitwarden connectivity status at startup.
 */
export async function logBitwardenStartupStatus(): Promise<void> {
  try {
    const token = await fetchBitwardenToken();
    console.log("[Locker] ✅ Bitwarden: Authenticated and Ready.");
  } catch (error: any) {
    console.warn("[Locker] ⚠️ Bitwarden: Authentication check failed during startup.");
  }
}

/**
 * Saves a generic secret (Secure Note) to Bitwarden Vault.
 */
/**
 * Fetches secure-note vault payloads for a user from Bitwarden (type 2, name `Kryptex Vault - {userId}`).
 */
export async function fetchFromBitwarden(userId: string): Promise<string[]> {
  try {
    const token = await fetchBitwardenToken();
    const response = await axios.get(`${BITWARDEN_API_URL}/public/items`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Bitwarden-Client-Version": "2024.1.0",
      },
    });
    const rows = response.data?.data || [];
    const items = rows.filter(
      (item: any) => item.type === 2 && item.name === `Kryptex Vault - ${userId}`,
    );
    const payloads: string[] = [];
    for (const item of items) {
      const field = item.fields?.find((f: any) => f.name === "Payload");
      if (field?.value) payloads.push(field.value);
    }
    return payloads;
  } catch (error: any) {
    console.error("Bitwarden Fetch Failed:", error.response?.data || error.message);
    return [];
  }
}

export async function saveToBitwarden(userId: string, encryptedData: string, referenceId: string): Promise<any> {
  try {
    const token = await fetchBitwardenToken();
    
    // Using Bitwarden Item type 2 (Secure Note) for generic encrypted blobs
    const payload = {
      type: 2,
      name: `Kryptex Vault - ${userId}`,
      notes: `Storage Reference: ${referenceId}`,
      secureNote: {
        type: 0 // Generic Note
      },
      fields: [
        {
          name: "Payload",
          value: encryptedData,
          type: 1 // Hidden
        }
      ]
    };

    const response = await axios.post(`${BITWARDEN_API_URL}/public/items`, payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Bitwarden-Client-Version": "2024.1.0"
      }
    });

    return response.data;
  } catch (error: any) {
    console.error("Bitwarden Write Failed:", error.response?.data || error.message);
    throw new Error(`Bitwarden Write Failed: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}

/**
 * Saves a Card item to Bitwarden Vault.
 */
export async function saveCardToBitwarden(userId: string, payload: any): Promise<any> {
  try {
    const token = await fetchBitwardenToken();

    const response = await axios.post(`${BITWARDEN_API_URL}/public/items`, payload, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Bitwarden-Client-Version": "2024.1.0"
      }
    });

    return response.data;
  } catch (error: any) {
    console.error("Bitwarden Card Write Failed:", error.response?.data || error.message);
    throw new Error(`Bitwarden Card Write Failed: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}

/**
 * Fetches cards (Item type 3) from Bitwarden.
 * Note: Bitwarden Public API filtering is limited; results may require client-side filtering.
 */
export async function fetchCardsFromBitwarden(userId: string): Promise<any[]> {
  try {
    const token = await fetchBitwardenToken();

    // The Public API currently doesn't support complex prefix filtering like Secrets Manager
    // We fetch items and filter for Card types and name matching.
    const response = await axios.get(`${BITWARDEN_API_URL}/public/items`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Bitwarden-Client-Version": "2024.1.0"
      }
    });

    // Filter for Card type (3) and name prefix if used in save step
    return response.data.data.filter((item: any) => 
      item.type === 3 && item.name.includes(`Bank Card`)
    );
  } catch (error: any) {
    console.error("Bitwarden Card Fetch Failed:", error.response?.data || error.message);
    return [];
  }
}

/**
 * Deletes an item from Bitwarden Vault.
 */
export async function deleteBitwardenItem(itemId: string): Promise<void> {
  try {
    const token = await fetchBitwardenToken();
    await axios.delete(`${BITWARDEN_API_URL}/public/items/${itemId}`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        "Bitwarden-Client-Version": "2024.1.0"
      }
    });
    console.log(`[Bitwarden] Purged Item: ${itemId}`);
  } catch (error: any) {
    console.error("Bitwarden Delete Failed:", error.response?.data || error.message);
    throw new Error(`Bitwarden Delete Failed: ${JSON.stringify(error.response?.data || error.message)}`);
  }
}
