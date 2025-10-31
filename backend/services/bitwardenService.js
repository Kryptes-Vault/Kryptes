const axios = require("axios");

/**
 * Bitwarden Logic:
 * Uses the Self-Hosted Bitwarden API or CLI integration.
 * In a real-world scenario, you would use BW_CLIENTID and BW_CLIENTSECRET.
 */
const saveToBitwarden = async (userId, encryptedData, referenceId) => {
    try {
        console.log(`[Bitwarden] Saving entry for User: ${userId}`);
        
        // This is a representative API call. Bitwarden Public API
        // requires an Organization-level Account and an Access Token.
        // We simulate the secure note creation here.
        const response = await axios.post(`${process.env.BITWARDEN_API_URL}/secrets`, {
            key: `kryptex_${userId}`,
            value: encryptedData,
            note: `MEGA Link Reference: ${referenceId}`
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

module.exports = { saveToBitwarden, fetchFromBitwarden };
