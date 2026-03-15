/**
 * Central auth / CORS / session-related settings and environment documentation.
 *
 * Required .env keys (see also comments at bottom):
 * - SESSION_SECRET
 * - REDIS_URL
 * - API_BASE_URL (e.g. https://kryptes.onrender.com)
 * - FRONTEND_URL (e.g. https://kryptes.vercel.app)
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (API — validate JWT + sync session)
 */

const FRONTEND_URL = process.env.FRONTEND_URL || "https://kryptes.vercel.app";
const API_BASE_URL =
  process.env.API_BASE_URL ||
  `http://localhost:${process.env.PORT || 4000}`;

const DASHBOARD_PATH = "/dashboard";

/** Successful OAuth redirect target */
function getPostLoginRedirect() {
  return `${FRONTEND_URL.replace(/\/$/, "")}${DASHBOARD_PATH}`;
}

/** Where providers should send users on failure (frontend sign-in page or home) */
function getOAuthFailureRedirect() {
  return `${FRONTEND_URL.replace(/\/$/, "")}/login`;
}

/**
 * CORS: Allow both production (Vercel) and local dev origins.
 * Supabase handles the OAuth redirect, but the session sync call from the
 * browser to Render needs CORS. Without localhost in the allow-list, the
 * /api/auth/supabase/sync call silently fails → "Completing sign-in…" stuck.
 */
const allowedOrigins = [
  FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:4173", // Vite preview
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (e.g., server-to-server, curl)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

/**
 * express-session cookie: cross-site frontend (Vercel) + API (Render) needs
 * SameSite=None and Secure in production.
 */
function getSessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  };
}

module.exports = {
  FRONTEND_URL,
  API_BASE_URL,
  DASHBOARD_PATH,
  getPostLoginRedirect,
  getOAuthFailureRedirect,
  corsOptions,
  getSessionCookieOptions,
};

/*
 * ---------------------------------------------------------------------------
 * Environment variable template (copy into .env on Render)
 * ---------------------------------------------------------------------------
 *
 * # Core
 * NODE_ENV=production
 * PORT=4000
 * SESSION_SECRET=long_random_string
 *
 * # URLs
 * API_BASE_URL=https://kryptes.onrender.com
 * FRONTEND_URL=https://kryptes.vercel.app
 *
 * # Redis (Upstash / Redis Cloud — single URL)
 * REDIS_URL=rediss://default:password@host:port
 *
 * # Supabase (server — use service role; never expose to Vercel)
 * SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
 * SUPABASE_SERVICE_ROLE_KEY=your_service_role_jwt
 *
 * ---------------------------------------------------------------------------
 */
