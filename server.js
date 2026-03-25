require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const Redis = require("ioredis");
const cors = require("cors");

// Redis setup for Sessions
let redisClient;
let redisStore;

try {
    console.log("[Status] Connecting to Redis:", process.env.REDIS_URL?.split('@')[1] || "No URL");
    redisClient = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (times > 5) {
                console.warn("[Status] Redis connection failed after 5 attempts. Falling back to MemoryStore.");
                return null;
            }
            return Math.min(times * 100, 3000);
        }
    });

    redisClient.on("connect", () => {
        console.log("[Status] Redis: Connected to Cloud");
    });

    redisClient.on("error", (err) => {
        // Only log connection refused if we haven't switched to memory yet
        if (redisClient.status !== "end") {
            // console.error("[ioredis] Connection error:", err.message);
        }
    });

    redisStore = new RedisStore({ 
        client: redisClient,
        disableTouch: true // Optional: minor performance boost for session stores
    });
} catch (e) {
    console.warn("[Status] Redis initialization failed. Using memory store.");
}

const vaultRoutes = require("./routes/vault");
const webhookRoutes = require("./routes/webhooks");
const authRoutes = require("./routes/auth");
const { handleSendEmailHook } = require("./routes/authEmailHook");
const { corsOptions, getSessionCookieOptions } = require("./config/auth");

const app = express();

// ── Ultra-lightweight ping for cron-job.org / uptime monitors ──────────────
// Placed BEFORE any middleware so it has zero overhead (no CORS, no session,
// no body parsing). Render health checks and cron pings hit this only.
app.get("/ping", (_req, res) => {
  res.status(200).setHeader("Cache-Control", "no-store").send("pong");
});

// Behind Render / other reverse proxies — required for secure cookies & correct client IP
app.set("trust proxy", 1);

// Security Middleware — Vercel origin + credentials for session cookies
app.use(cors(corsOptions));

// Supabase Send Email Hook: raw body required for Standard Webhooks signature verification
app.post(
    "/api/auth/send-email-hook",
    express.raw({
        type: (req) =>
            (req.headers["content-type"] || "").includes("application/json"),
    }),
    handleSendEmailHook
);

app.use(express.json());

// Session and Passport initialization
const sessionConfig = {
    name: "kryptex.sid",
    secret: process.env.SESSION_SECRET || "kryptex_secret_82346",
    resave: false,
    saveUninitialized: false,
    cookie: getSessionCookieOptions(),
};

// Use RedisStore if available, otherwise fallback to explicit MemoryStore
if (redisStore) {
    sessionConfig.store = redisStore;
} else {
    sessionConfig.store = new session.MemoryStore();
}

// Add a diagnostic check to ensure the server keeps running
app.get("/health", (req, res) => {
    res.json({ 
        status: "up", 
        redis: (redisClient && redisClient.status === "ready") ? "connected" : "fallback-memory" 
    });
});

/**
 * Deep health / routing diagnostics for Render, Supabase hooks, and cron probes.
 * Logs how the edge sees your process (PORT, Host, forwarded client IP).
 */
app.get("/health/deep", (req, res) => {
    const port = process.env.PORT;
    const host = req.get("host");
    const xff = req.get("x-forwarded-for");
    const xfProto = req.get("x-forwarded-proto");
    const xRenderRouting = req.get("x-render-routing");
    const bindHost = process.env.BIND_HOST || "0.0.0.0";

    console.log("[health/deep]", {
        "process.env.PORT": port,
        BIND_HOST: bindHost,
        Host: host,
        "X-Forwarded-For": xff,
        "X-Forwarded-Proto": xfProto,
        "X-Render-Routing": xRenderRouting,
        "req.ip": req.ip,
    });

    res.json({
        ok: true,
        processEnvPort: port ?? null,
        bindHost,
        host: host ?? null,
        xForwardedFor: xff ?? null,
        xForwardedProto: xfProto ?? null,
        xRenderRouting: xRenderRouting ?? null,
        expressReqIp: req.ip,
        nodeEnv: process.env.NODE_ENV ?? null,
    });
});

app.use(session(sessionConfig));
app.use((req, res, next) => {
    if (req.session && req.session.kryptexUser) {
        req.user = req.session.kryptexUser;
    }
    next();
});

// Routes
app.use("/api/vault", vaultRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes);

// Keep the process alive even if Redis fails
process.on("unhandledRejection", (reason, promise) => {
    // console.error("Unhandled Rejection:", reason);
});

// Render injects PORT; the gateway forwards to this port. Do not hardcode 4000 in production.
const PORT = Number.parseInt(process.env.PORT || "4000", 10);
// Bind all interfaces so the platform load balancer can reach the process (Render/Fly/etc.).
const BIND_HOST = process.env.BIND_HOST || "0.0.0.0";

const server = app.listen(PORT, BIND_HOST, () => {
    console.log(
        `[Kryptex Backend] Listening on http://${BIND_HOST}:${PORT} (NODE_ENV=${process.env.NODE_ENV || "undefined"})`
    );

    // ── Security audit: verify critical secrets at startup ──────────────
    const hookSecret = process.env.SUPABASE_HOOK_SECRET;
    const hookStatus = hookSecret && hookSecret.startsWith("v1,whsec_")
        ? "✓ configured"
        : hookSecret
            ? "⚠ set but missing v1,whsec_ prefix"
            : "✗ NOT SET — auth hooks will fail signature verification";

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseStatus = supabaseUrl ? "✓ configured" : "✗ NOT SET";

    const twitterId = process.env.TWITTER_CLIENT_ID;
    const twitterStatus = twitterId ? "✓ configured" : "○ not set (enable in Supabase Dashboard)";

    console.log(`[Status] Redis: ${redisClient?.status === "ready" ? "Connected" : "Connecting..."}`);
    console.log(`[Status] SUPABASE_HOOK_SECRET: ${hookStatus}`);
    console.log(`[Status] SUPABASE_URL: ${supabaseStatus}`);
    console.log(`[Status] Twitter OAuth: ${twitterStatus}`);
    console.log(`[Status] Bind: ${BIND_HOST}:${PORT} | Proxy trust: enabled`);

    // MEGA: connect once at startup so logs show (upload paths reuse initMega()).
    if (process.env.MEGA_EMAIL?.trim() && process.env.MEGA_PASSWORD) {
        void (async () => {
            try {
                const { initMega } = require("./megaService.js");
                await initMega();
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                console.error("[Status] MEGA: startup connection error:", msg);
            }
        })();
    } else {
        console.log("[Status] MEGA: skipped (MEGA_EMAIL / MEGA_PASSWORD not set)");
    }

    // Trigger Supabase Admin Check
    try {
        const { getSupabaseAdmin } = require("./services/supabaseAdmin.js");
        getSupabaseAdmin();
    } catch (e) {
        console.error("❌ Supabase Admin Initialization Failed:", e.message);
    }
});

// Prevent immediate crash on unhandled errors during startup
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error("Server error:", e);
    }
});

// ── Graceful shutdown (Render sends SIGTERM when cycling instances) ─────────
function gracefulShutdown(signal) {
    console.log(`[Kryptex] Received ${signal}. Closing HTTP server…`);
    server.close(() => {
        console.log("[Kryptex] HTTP server closed.");
        if (redisClient && redisClient.status !== "end") {
            redisClient.quit().then(() => {
                console.log("[Kryptex] Redis disconnected.");
                process.exit(0);
            }).catch(() => process.exit(0));
        } else {
            process.exit(0);
        }
    });
    // Force exit after 10s if connections don't close
    setTimeout(() => {
        console.error("[Kryptex] Forced exit after timeout.");
        process.exit(1);
    }, 10_000).unref();
}
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
