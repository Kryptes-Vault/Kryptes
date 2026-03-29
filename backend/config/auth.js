/**
 * Central auth / CORS / session-related settings and environment documentation.
 *
 * Required .env keys (see also comments at bottom):
 * - SESSION_SECRET
 * - REDIS_URL
 * - API_BASE_URL (e.g. https://kryptes.onrender.com)
 * - FRONTEND_URL (e.g. https://kryptes.vercel.app)
 * - Google: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL
 * - X/Twitter: TWITTER_CLIENT_ID, TWITTER_CLIENT_SECRET, TWITTER_CALLBACK_URL
 * - Yahoo OAuth 2: YAHOO_CLIENT_ID, YAHOO_CLIENT_SECRET, YAHOO_CALLBACK_URL
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

const corsOptions = {
  origin: FRONTEND_URL,
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
 * Environment variable template (copy into .env)
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
 * # Google OAuth 2.0
 * GOOGLE_CLIENT_ID=
 * GOOGLE_CLIENT_SECRET=
 * GOOGLE_CALLBACK_URL=https://kryptes.onrender.com/api/auth/google/callback
 *
 * # X (Twitter) OAuth 2.0 — Client ID / Secret from developer portal
 * TWITTER_CLIENT_ID=
 * TWITTER_CLIENT_SECRET=
 * TWITTER_CALLBACK_URL=https://kryptes.onrender.com/api/auth/twitter/callback
 *
 * # Yahoo OAuth 2.0 / OpenID Connect (Yahoo Developer Network — OAuth 2 credentials)
 * YAHOO_CLIENT_ID=
 * YAHOO_CLIENT_SECRET=
 * YAHOO_CALLBACK_URL=https://kryptes.onrender.com/api/auth/yahoo/callback
 *
 * ---------------------------------------------------------------------------
 */
