import express, { Request, Response } from "express";
const router = express.Router();
const { vaultSchema } = require("../models/vaultSchema");
const { getCachedVault, setCachedVault, deleteCachedVault } = require("../services/redisService");
import { saveToBitwarden, fetchFromBitwarden, saveCardToBitwarden, fetchCardsFromBitwarden } from "../services/bitwardenService";
import { getSupabaseAdmin } from "../services/supabaseAdmin";
import { encryptVaultAtRest, decryptVaultAtRest } from "../utils/cryptoUtils";
import { insertVaultItemCreatedAudit } from "../services/vaultAuditService";
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
        const { userId, cardholderName, cardNumber, bankName, expMonth, expYear, code } = req.body;

        if (!userId || !cardNumber) {
            return res.status(400).json({ error: "Missing required fields (userId, cardNumber)" });
        }

        const cardPayload = {
            cardholderName: cardholderName ?? "Kryptes User",
            cardNumber: cardNumber ?? "",
            bankName: bankName ?? "Secure Vault Account",
            expMonth: expMonth ?? "",
            expYear: expYear ?? "",
            code: code ?? "",
            // Standard account fields from upstream
            accountNumber: String(req.body.accountNumber || "").trim(),
            ifscCode: String(req.body.ifscCode || "").trim(),
        };

        const { iv, ciphertext, encryptionVersion } = encryptVaultAtRest(JSON.stringify(cardPayload));

        // Update Gatekeeper
        await setProfileFlagActive(userId, 'has_cards');

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
                title: bankName || "Payment Card"
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
        await deleteCachedVault(userId);

        return res.json({ success: true, message: "Card securely encrypted and saved." });
    } catch (error: any) {
        console.error("[Vault] POST /cards:", error);
        return res.status(500).json({ error: error.message || "Failed to persist card to secure vault" });
    }
});

/**
 * @route   POST /api/vault/banks
 * @desc    AES-256-GCM encrypt bank JSON and insert into Supabase vault_items
 */
router.post("/banks", vaultLimiter, async (req: Request, res: Response) => {
    try {
        const { 
            userId, 
            bankName, 
            domain,
            isAutoFetch, 
            accountNumber, 
            accountType, 
            ifscRouting 
        } = req.body;

        if (!userId || !bankName) {
            return res.status(400).json({ error: "Missing required fields (userId, bankName)" });
        }

        const bankPayload = {
            bankName,
            domain: domain ?? "",
            isAutoFetch: !!isAutoFetch,
            accountNumber: accountNumber ?? "",
            accountType: accountType ?? "Savings",
            ifscRouting: ifscRouting ?? "",
        };

        const { iv, ciphertext, encryptionVersion } = encryptVaultAtRest(JSON.stringify(bankPayload));

        const supabase = getSupabaseAdmin();
        const { data: created, error } = await supabase
            .from("vault_items")
            .insert({
                user_id: userId,
                item_type: "bank",
                category: "finance",
                ciphertext,
                iv,
                encryption_version: encryptionVersion,
                title: bankName // Save bank name as title for quick access
            })
            .select("id")
            .single();

        if (error || !created?.id) {
            console.error("[Vault] Bank insert error:", error);
            return res.status(500).json({ error: error?.message || "Failed to save bank to vault." });
        }

        await insertVaultItemCreatedAudit({
            userId,
            vaultItemId: created.id,
            req,
            itemType: "bank",
        });

        await setProfileFlagActive(userId, "has_cards"); // Re-use this flag or add 'has_banks'
        await deleteCachedVault(userId);

        return res.json({ success: true, message: "Bank account securely encrypted and saved." });
    } catch (error: any) {
        console.error("[Vault] POST /banks:", error);
        return res.status(500).json({ error: error.message || "Failed to persist bank account to secure vault" });
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
            bankName: string;
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
                    bankName?: string;
                    expMonth?: string;
                    expYear?: string;
                    code?: string;
                    accountNumber?: string;
                    ifscCode?: string;
                };
                cards.push({
                    id: row.id,
                    name: `${p.bankName || "Bank Card"} - ${p.cardholderName || "User"}`,
                    bankName: p.bankName || "Secure Vault Account",
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

/**
 * @route   GET /api/vault/items
 * @desc    Fetch all vault items, decrypt them, and use Redis caching.
 */
router.get("/items", vaultLimiter, async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) return res.status(400).json({ error: "userId is required." });

        // 1. Check Redis Cache
        const cachedData = await getCachedVault(userId);
        if (cachedData) {
            console.log(`[Cache Hit] Serving decrypted vault items for: ${userId}`);
            return res.json({ items: JSON.parse(cachedData), source: "cache" });
        }

        console.log(`[Cache Miss] Fetching items from Supabase for: ${userId}`);
        const supabase = getSupabaseAdmin();
        const { data: rows, error } = await supabase
            .from("vault_items")
            .select("*")
            .eq("user_id", userId)
            .order("updated_at", { ascending: false });

        if (error) {
            console.error("[Vault] Items Retrieval Error:", error);
            return res.status(500).json({ error: "Failed to retrieve vault items." });
        }

        const decryptedItems = (rows || []).map((row) => {
            try {
                const plain = decryptVaultAtRest(row.iv, row.ciphertext);
                const payload = JSON.parse(plain);
                return {
                    ...row,
                    decrypted_data: payload,
                    // For UI compatibility: ensure a title exists if not present in the row
                    title: row.title || payload.cardholderName || payload.accountNumber || "Unnamed Item"
                };
            } catch (e) {
                console.warn(`[Vault] Failed to decrypt item ${row.id}:`, e);
                return { ...row, decryption_error: true };
            }
        });

        // 2. Cache in Redis
        await setCachedVault(userId, JSON.stringify(decryptedItems));

        return res.json({ items: decryptedItems, source: "database" });
    } catch (error: any) {
        console.error("[Vault] GET /items error:", error);
        return res.status(500).json({ error: "Server error fetching vault items" });
    }
});

module.exports = router;
