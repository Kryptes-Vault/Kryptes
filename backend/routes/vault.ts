import express, { Request, Response } from "express";
const router = express.Router();
const { vaultSchema } = require("../models/vaultSchema");
const { getCachedVault, setCachedVault } = require("../services/redisService");
import { saveToBitwarden, fetchFromBitwarden } from "../services/bitwardenService";
import { getSupabaseAdmin } from "../services/supabaseAdmin";
import { encryptVaultAtRest, decryptVaultAtRest } from "../utils/cryptoUtils";
const rateLimit = require("express-rate-limit");
import { checkProfileFlag, setProfileFlagActive } from "../services/gatekeeperService";
import { insertVaultItemCreatedAudit } from "../services/vaultAuditService";

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
 * @desc    AES-256-GCM encrypt card JSON and insert into Supabase vault_items
 */
router.post("/cards", vaultLimiter, async (req: Request, res: Response) => {
    try {
        const { userId, cardholderName, cardNumber, expMonth, expYear, code, accountNumber, ifscCode } = req.body;

        if (!userId || !accountNumber || !ifscCode) {
            return res.status(400).json({ error: "Missing required fields (userId, accountNumber, ifscCode)" });
        }

        const cardPayload = {
            cardholderName: cardholderName ?? "",
            cardNumber: cardNumber ?? "",
            expMonth: expMonth ?? "",
            expYear: expYear ?? "",
            code: code ?? "",
            accountNumber: String(accountNumber).trim(),
            ifscCode: String(ifscCode).trim(),
        };

        const { iv, ciphertext, encryptionVersion } = encryptVaultAtRest(JSON.stringify(cardPayload));

        const supabase = getSupabaseAdmin();
        const { data: created, error } = await supabase
            .from("vault_items")
            .insert({
                user_id: userId,
                item_type: "card",
                category: "finance",
                ciphertext,
                iv,
                encryption_version: encryptionVersion,
            })
            .select("id")
            .single();

        if (error || !created?.id) {
            console.error("[Vault] Card insert error:", error);
            return res.status(500).json({ error: error?.message || "Failed to save card to vault." });
        }

        const { error: auditError } = await insertVaultItemCreatedAudit({
            userId,
            vaultItemId: created.id,
            req,
            itemType: "card",
        });

        if (auditError) {
            console.error("[Vault] Audit log insert failed:", auditError.message);
            const { error: rollbackErr } = await supabase.from("vault_items").delete().eq("id", created.id);
            if (rollbackErr) {
                console.error("[Vault] Rollback after audit failure also failed:", rollbackErr.message);
            }
            return res.status(500).json({
                error: "Failed to record audit trail; the vault item was not saved.",
            });
        }

        await setProfileFlagActive(userId, "has_cards");

        return res.json({ success: true, message: "Card securely encrypted and saved." });
    } catch (error: any) {
        console.error("[Vault] POST /cards:", error);
        return res.status(500).json({ error: error.message || "Failed to persist card to secure vault" });
    }
});

/**
 * @route   GET /api/vault/cards
 * @desc    List user card items from vault_items (decrypted server-side for display)
 */
router.get("/cards", vaultLimiter, async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: "userId is required." });

        if (!(await checkProfileFlag(userId, "has_cards"))) {
            return res.status(200).json({ cards: [], source: "gatekeeper_cards" });
        }

        const supabase = getSupabaseAdmin();
        const { data: rows, error } = await supabase
            .from("vault_items")
            .select("id, ciphertext, iv, encryption_version")
            .eq("user_id", userId)
            .eq("item_type", "card")
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("Cards Retrieval Error:", error);
            return res.status(500).json({ error: "Failed to retrieve cards from secure vault." });
        }

        const cards: Array<{
            id: string;
            name: string;
            card: {
                cardholderName: string;
                number: string;
                expMonth: string;
                expYear: string;
                code: string;
            };
            fields: Array<{ name: string; value: string }>;
        }> = [];

        for (const row of rows || []) {
            try {
                if (row.encryption_version !== "server_aes256_gcm_v1") continue;
                const plain = decryptVaultAtRest(row.iv, row.ciphertext);
                const p = JSON.parse(plain) as {
                    cardholderName?: string;
                    cardNumber?: string;
                    expMonth?: string;
                    expYear?: string;
                    code?: string;
                    accountNumber?: string;
                    ifscCode?: string;
                };
                cards.push({
                    id: row.id,
                    name: `Bank Card - ${p.cardholderName || "Unknown"}`,
                    card: {
                        cardholderName: p.cardholderName ?? "",
                        number: p.cardNumber ?? "",
                        expMonth: p.expMonth ?? "",
                        expYear: p.expYear ?? "",
                        code: p.code ?? "",
                    },
                    fields: [
                        { name: "Account Number", value: p.accountNumber ?? "" },
                        { name: "IFSC Code", value: p.ifscCode ?? "" },
                    ],
                });
            } catch (e) {
                console.warn("[Vault] Skip card row:", row.id, e);
            }
        }

        return res.json({ cards });
    } catch (error: any) {
        console.error("Cards Retrieval Error:", error);
        return res.status(500).json({ error: "Failed to retrieve cards from secure vault." });
    }
});

module.exports = router;
