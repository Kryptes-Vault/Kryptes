import express, { Request, Response } from "express";
const router = express.Router();
import { checkProfileFlag, setProfileFlagActive } from "../services/gatekeeperService";
const { getSupabaseAdmin } = require("../services/supabaseAdmin");
const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: "Too many OTP requests from this IP"
});

/**
 * @route   POST /api/otp
 * @desc    Saves a new OTP secret for the user in Supabase user_otp_secrets
 */
router.post("/", otpLimiter, async (req: Request, res: Response) => {
    try {
        const { userId, secret } = req.body;
        if (!userId || !secret) {
            return res.status(400).json({ error: "Missing required fields (userId, secret)" });
        }

        const supabase = getSupabaseAdmin();
        const { error } = await supabase
            .from("user_otp_secrets")
            .insert({ user_id: userId, secret: secret });

        if (error) {
            console.error("Supabase OTP Insert Error:", error);
            return res.status(500).json({ error: "Failed to securely store OTP secret" });
        }

        // Update Gatekeeper Flag
        await setProfileFlagActive(userId, 'has_otp');

        return res.json({ success: true, message: "OTP Secret securely stored" });
    } catch (error: any) {
        console.error("OTP Storage Error:", error);
        return res.status(500).json({ error: "Failed to persist OTP secret" });
    }
});

/**
 * @route   GET /api/otp
 * @desc    Fetch user's OTP secrets from Supabase
 */
router.get("/", otpLimiter, async (req: Request, res: Response) => {
    try {
        const userId = req.query.userId as string;
        if (!userId) {
            return res.status(400).json({ error: "UserID required" });
        }

        // Gatekeeper Check
        if (!(await checkProfileFlag(userId, 'has_otp'))) {
            return res.status(200).json({ secrets: [], source: "gatekeeper_otp" });
        }

        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
            .from("user_otp_secrets")
            .select("secret")
            .eq("user_id", userId);

        if (error) {
            console.error("Supabase OTP Fetch Error:", error);
            return res.status(500).json({ error: "Failed to retrieve OTP secrets" });
        }

        return res.json({ secrets: data || [], source: "supabase" });
    } catch (error: any) {
        console.error("OTP Fetch Error:", error);
        return res.status(500).json({ error: "Failed to retrieve OTP secrets" });
    }
});

module.exports = router;
