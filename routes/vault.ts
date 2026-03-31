import express, { Request, Response } from "express";
const router = express.Router();
const { vaultSchema } = require("../models/vaultSchema");
const { getCachedVault, setCachedVault } = require("../services/redisService");
import { saveToBitwarden, fetchFromBitwarden, saveCardToBitwarden, fetchCardsFromBitwarden } from "../services/bitwardenService";
const rateLimit = require("express-rate-limit");
import { checkProfileFlag, setProfileFlagActive } from "../services/gatekeeperService";

// Prevent Brute Force
const vaultLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many vault requests from this IP"
});

/**
 * @route   POST /api/vault/add
 * @desc    Encrypts and persists data to Bitwarden (Write-through pattern)
 */
router.post("/add", vaultLimiter, async (req: Request, res: Response) => {
    try {
        const validatedData = vaultSchema.parse(req.body);
        const { userId, encryptedData, referenceId } = validatedData;

        // 1. Bitwarden Persistence (Single Source of Truth)
        await saveToBitwarden(userId, encryptedData, referenceId);

        // 2. Redis Update (Invalidate/Update Cache)
        await setCachedVault(userId, encryptedData);

        // 3. Update Gatekeeper
        await setProfileFlagActive(userId, 'has_passwords');

        return res.json({ success: true, message: "Kryptex Vault Synchronized" });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

/**
 * @route   GET /api/vault/get
 * @desc    Fetch encrypted data (Read-aside pattern with Redis)
 */
router.get("/get", vaultLimiter, async (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    if (!userId) return res.status(400).json({ error: "UserID required" });

    try {
        // 1. Gatekeeper Check
        if (!(await checkProfileFlag(userId, 'has_passwords'))) {
            return res.status(200).json({ encryptedData: [], source: "gatekeeper_passwords" });
        }

        // 2. Check Redis Cache
        let data = await getCachedVault(userId);

        if (data) {
            console.log(`[Cache Hit] Serving encrypted data for: ${userId}`);
            return res.json({ encryptedData: data, source: "cache" });
        }

        // 3. Cache Miss - Fetch from Bitwarden
        console.log(`[Cache Miss] Calling Bitwarden for: ${userId}`);
        data = await fetchFromBitwarden(userId);

        // 4. Populate Cache
        if (data && data.length > 0) {
            await setCachedVault(userId, data);
        }

        return res.json({ encryptedData: data || [], source: "vault" });
    } catch (error: any) {
        console.error("Vault Retrieval Error:", error);
        return res.status(500).json({ error: "Vault Retrieval Error - Please retry later" });
    }
});

/**
 * @route   POST /api/vault/cards
 * @desc    Encrypts and persists debit/credit card info along with bank details to Bitwarden
 */
router.post("/cards", vaultLimiter, async (req: Request, res: Response) => {
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
        
        // Update Gatekeeper
        await setProfileFlagActive(userId, 'has_cards');

        return res.json({ success: true, message: "Card securely stored in Bitwarden Vault" });
    } catch (error: any) {
        return res.status(500).json({ error: error.message || "Failed to persist card to secure vault" });
    }
});

/**
 * @route   GET /api/vault/cards
 * @desc    Retrieve user cards from Bitwarden
 */
router.get("/cards", vaultLimiter, async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: "userId is required." });

        // Gatekeeper check
        if (!(await checkProfileFlag(userId, 'has_cards'))) {
            return res.status(200).json({ cards: [], source: "gatekeeper_cards" });
        }

        const cards = await fetchCardsFromBitwarden(userId);
        return res.json({ cards: cards || [] });
    } catch (error: any) {
        console.error("Cards Retrieval Error:", error);
        return res.status(500).json({ error: "Failed to retrieve cards from secure vault." });
    }
});

module.exports = router;
