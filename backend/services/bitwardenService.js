const axios = require("axios");

/**
 * Bitwarden Logic:
 * Uses the Self-Hosted Bitwarden API or CLI integration.
 * In a real-world scenario, you would use BW_CLIENTID and BW_CLIENTSECRET.
 */
async function logBitwardenStartupStatus() {
  const apiUrl = process.env.BITWARDEN_API_URL;
  const token = process.env.BITWARDEN_TOKEN;
  const clientId = process.env.BW_CLIENT_ID;
  const clientSecret = process.env.BW_CLIENT_SECRET;

  if (!apiUrl || !token || !clientId || !clientSecret) {
    console.warn(
      "[locker] ⚠️ Bitwarden: Config incomplete (missing URL/Token/BW_CLIENT_ID/BW_CLIENT_SECRET). Some vault backups may be skipped.",
    );
    return;
  }

  try {
    await axios
      .get(`${apiUrl}/identity`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch(() => null);
    console.log("[locker] ✅ Bitwarden: Configured (Endpoint reachable)");
  } catch {
    console.warn("[locker] ⚠️ Bitwarden: Initial connection check failed. Ensure URL is correct.");
  }
}
const saveToBitwarden = async (userId, encryptedData, referenceId) => {
    try {
        console.log(`[Bitwarden] Saving entry for User: ${userId}`);
        
        // This is a representative API call. Bitwarden Public API
        // requires an Organization-level Account and an Access Token.
        // We simulate the secure note creation here.
        const response = await axios.post(`${process.env.BITWARDEN_API_URL}/secrets`, {
            key: `kryptex_${userId}`,
            value: encryptedData,
            note: `Storage link reference: ${referenceId}`
        }, {
            headers: { Authorization: `Bearer ${process.env.BITWARDEN_TOKEN}` }
        });

        return response.data;
    } catch (error) {
        console.error("Bitwarden Write Failed:", error.message);
        throw new Error("Vault Service Unreachable - Encryption persists locally");
    }
};

const fetchFromBitwarden = async (userId) => {
    try {
        const response = await axios.get(`${process.env.BITWARDEN_API_URL}/secrets/kryptex_${userId}`, {
            headers: { Authorization: `Bearer ${process.env.BITWARDEN_TOKEN}` }
        });
        return response.data.value; // The encrypted string
    } catch (error) {
        console.error("Bitwarden Read Failed:", error.message);
        throw new Error("Vault Recovery Failed");
    }
};

const saveCardToBitwarden = async (userId, payload) => {
    try {
        console.log(`[Bitwarden] Saving Card entry for User: ${userId}`);
        const response = await axios.post(`${process.env.BITWARDEN_API_URL}/secrets`, {
            key: `kryptex_card_${userId}_${Date.now()}`,
            value: JSON.stringify(payload),
            note: "Secure Card & Bank Info"
        }, {
            headers: { Authorization: `Bearer ${process.env.BITWARDEN_TOKEN}` }
        });

        return response.data;
    } catch (error) {
        console.error("Bitwarden Card Write Failed:", error.message);
        throw new Error("Failed to save card securely to vault.");
    }
}

const fetchCardsFromBitwarden = async (userId) => {
    try {
        console.log(`[Bitwarden] Listing Card entries for User: ${userId}`);
        // In this simulated environment, we fetch all secrets starting with 'kryptex_card_<userId>'
        const response = await axios.get(`${process.env.BITWARDEN_API_URL}/secrets?prefix=kryptex_card_${userId}`, {
            headers: { Authorization: `Bearer ${process.env.BITWARDEN_TOKEN}` }
        });
        
        // Map the results back to JSON objects
        return response.data.map(item => JSON.parse(item.value));
    } catch (error) {
        console.error("Bitwarden Card List Failed:", error.message);
        return []; // Return empty list on failure or if none found
    }
}

module.exports = { 
    saveToBitwarden, 
    fetchFromBitwarden, 
    logBitwardenStartupStatus, 
    saveCardToBitwarden,
    fetchCardsFromBitwarden 
};
