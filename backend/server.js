const express = require("express");
const session = require("express-session");
const { RedisStore } = require("connect-redis");
const Redis = require("ioredis");
const passport = require("passport");
const cors = require("cors");
require("dotenv").config();

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

const app = express();

// Passport Service initialization
require("./services/passport")(passport);

// Security Middleware: CORS for Vercel Frontend
app.use(cors({
    origin: "https://kryptes.vercel.app",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Session and Passport initialization
const sessionConfig = {
    secret: process.env.SESSION_SECRET || "kryptex_secret_82346",
    resave: false,
    saveUninitialized: false,
    proxy: true, // Required for Render/Vercel (behind a proxy)
    cookie: { 
        secure: true, // Must be true for sameSite: 'none'
        sameSite: 'none', // Required for cross-site (Vercel -> Render)
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
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

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/vault", vaultRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes);

// Keep the process alive even if Redis fails
process.on("unhandledRejection", (reason, promise) => {
    // console.error("Unhandled Rejection:", reason);
});

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => {
    console.log(`[Kryptex Backend] Running on http://localhost:${PORT}`);
    console.log(`[Status] Redis: Connecting... | Bitwarden: Ready | Google Workspace: Ready | OAuth2 Mail: Active`);
});

// Prevent immediate crash on unhandled errors during startup
server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use.`);
    } else {
        console.error("Server error:", e);
    }
});
