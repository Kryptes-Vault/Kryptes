const express = require("express");
const router = express.Router();
const { vaultSchema } = require("../models/vaultSchema");
const { getCachedVault, setCachedVault } = require("../services/redisService");
const { saveToBitwarden, fetchFromBitwarden } = require("../services/bitwardenService");
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

module.exports = router;
