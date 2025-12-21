import express from "express";
const router = express.Router();
// @ts-ignore
const { vaultSchema } = require("../models/vaultSchema");
// @ts-ignore
const { getCachedVault, setCachedVault } = require("../services/redisService");
// @ts-ignore
const { saveToBitwarden, fetchFromBitwarden } = require("../services/bitwardenService");
// @ts-ignore
const { getUserVaultStatus, setUserVaultActive } = require("../services/supabaseAdmin");

import rateLimit from "express-rate-limit";
import { bankingController } from "../controllers/bankingController";

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

        // 3. Gatekeeper Flip
        await setUserVaultActive(userId);

        res.json({ success: true, message: "Kryptex Vault Synchronized" });
    } catch (error: any) {
        res.status(400).json({ error: error.message });
    }
});

/**
 * @route GET /api/vault/get
 * @desc Fetch encrypted data (Read-aside pattern with Redis)
 */
router.get("/get", vaultLimiter, async (req: any, res: any) => {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "UserID required" });

    try {
        // 0. Gatekeeper Check
        const hasVaultData = await getUserVaultStatus(userId);
        if (!hasVaultData) {
            console.log(`[Gatekeeper] Skip fetch for new user: ${userId}`);
            return res.json({ encryptedData: null, source: "gatekeeper" });
        }

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
 * @desc Encrypts and persists card info to Bitwarden and invalidates cache.
 */
router.post("/cards", vaultLimiter, (req, res) => bankingController.addCard(req, res));

/**
 * @route GET /api/vault/cards
 * @desc Retrieve user cards via secure cache-aside controller.
 */
router.get("/cards", vaultLimiter, (req, res) => bankingController.getCards(req, res));

export default router;

