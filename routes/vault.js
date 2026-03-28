const express = require("express");
const router = express.Router();
const { vaultSchema } = require("../models/vaultSchema");
const { getCachedVault, setCachedVault } = require("../services/redisService");
const { saveToBitwarden, fetchFromBitwarden, saveCardToBitwarden, fetchCardsFromBitwarden } = require("../services/bitwardenService");
const rateLimit = require("express-rate-limit");

// Prevent Brute Force
const vaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many vault requests from this IP"
});

/**
 * @route POST /api/vault/add
 * @desc Encrypts and persists data to Bitwarden (Write-through pattern)
 */
router.post("/add", vaultLimiter, async (req, res) => {
    try {
        const validatedData = vaultSchema.parse(req.body);
        const { userId, encryptedData, referenceId } = validatedData;

        // 1. Bitwarden Persistence (Single Source of Truth)
        await saveToBitwarden(userId, encryptedData, referenceId);

        // 2. Redis Update (Invalidate/Update Cache)
        await setCachedVault(userId, encryptedData);

        res.json({ success: true, message: "Kryptex Vault Synchronized" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route GET /api/vault/get
 * @desc Fetch encrypted data (Read-aside pattern with Redis)
 */
router.get("/get", vaultLimiter, async (req, res) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "UserID required" });

    try {
        // 1. Check Redis Cache
        let data = await getCachedVault(userId);

        if (data) {
            console.log(`[Cache Hit] Serving encrypted data for: ${userId}`);
            return res.json({ encryptedData: data, source: "cache" });
        }

        // 2. Cache Miss - Fetch from Bitwarden
        console.log(`[Cache Miss] Calling Bitwarden for: ${userId}`);
        data = await fetchFromBitwarden(userId);

        // 3. Populate Cache
        await setCachedVault(userId, data);

        res.json({ encryptedData: data, source: "vault" });
    } catch (error) {
        res.status(500).json({ error: "Vault Retrieval Error - Please retry later" });
    }
});

/**
 * @route POST /api/vault/cards
 * @desc Encrypts and persists debit/credit card info along with bank details to Bitwarden
 */
router.post("/cards", vaultLimiter, async (req, res) => {
    try {
        const { userId, cardholderName, cardNumber, expMonth, expYear, code, accountNumber, ifscCode } = req.body;

        // Basic validation matching frontend
        if (!userId || !accountNumber || !ifscCode) {
            return res.status(400).json({ error: "Missing required fields (userId, accountNumber, ifscCode)" });
        }

        // Structure the Bitwarden Item payload
        const bitwardenPayload = {
            type: 3, // 3 = Card type in Bitwarden
            name: `Bank Card - ${cardholderName || 'Unknown'}`,
            card: {
                cardholderName: cardholderName,
                number: cardNumber,
                expMonth: expMonth,
                expYear: expYear,
                code: code
            },
            fields: [
                {
                    name: "Account Number",
                    value: accountNumber,
                    type: 1 // 1 = Hidden/Secure text
                },
                {
                    name: "IFSC Code",
                    value: ifscCode,
                    type: 1 // 1 = Hidden/Secure text
                }
            ]
        };

        // Wrap Bitwarden call in try/catch to ensure clean response
        await saveCardToBitwarden(userId, bitwardenPayload);

        res.json({ success: true, message: "Card securely stored in Bitwarden Vault" });
    } catch (error) {
        res.status(500).json({ error: error.message || "Failed to persist card to secure vault" });
    }
});

/**
 * @route GET /api/vault/cards
 * @desc Retrieve user cards from Bitwarden
 */
router.get("/cards", vaultLimiter, async (req, res) => {
    try {
        const { userId } = req.query;
        if (!userId) return res.status(400).json({ error: "userId is required." });

        const cards = await fetchCardsFromBitwarden(userId);
        res.json({ cards });
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve cards from secure vault." });
    }
});

module.exports = router;
