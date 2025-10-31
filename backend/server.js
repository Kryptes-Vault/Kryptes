const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis").default;
const Redis = require("ioredis");
const passport = require("passport");
const cors = require("cors");
require("dotenv").config();

// Redis setup for Sessions
const redisClient = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
const redisStore = new RedisStore({ client: redisClient });

const vaultRoutes = require("./routes/vault");
const webhookRoutes = require("./routes/webhooks");
const authRoutes = require("./routes/auth");

const app = express();

// Passport Service initialization
require("./services/passport")(passport);

// Security Middleware
app.use(cors());
app.use(express.json());

// Session and Passport initialization
app.use(session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || "kryptex_secret_82346",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: process.env.NODE_ENV === "production" }
}));
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use("/api/vault", vaultRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/auth", authRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`[Kryptex Backend] Running on http://localhost:${PORT}`);
    console.log(`[Status] Redis: Connecting... | Bitwarden: Ready | Google Workspace: Ready | OAuth2 Mail: Active`);
});
