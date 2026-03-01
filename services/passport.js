const util = require("util");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const TwitterStrategy = require("passport-twitter-oauth2");
const OAuth2Strategy = require("passport-oauth2").Strategy;
const InternalOAuthError = require("passport-oauth2").InternalOAuthError;
const { API_BASE_URL } = require("../config/auth");
const { ensureShellUser, findById } = require("./userShellStore");

/**
 * Normalize provider profile to { provider, id, email, displayName }.
 */
function extractProfile(provider, profile) {
  const id = profile.id != null ? String(profile.id) : null;
  let email = null;
  if (profile.emails && profile.emails.length) {
    email = profile.emails[0].value || profile.emails[0] || null;
  }
  let displayName =
    profile.displayName ||
    profile.username ||
    null;
  if (!displayName && profile.name) {
    if (typeof profile.name === "string") {
      displayName = profile.name;
    } else if (profile.name.givenName || profile.name.familyName) {
      displayName = [profile.name.givenName, profile.name.familyName]
        .filter(Boolean)
        .join(" ");
    }
  }

  return { provider, id, email, displayName };
}

async function verifyOAuthUser(accessToken, refreshToken, profile, done) {
  try {
    const provider = profile.provider || "oauth";
    const { id, email, displayName } = extractProfile(provider, profile);
    if (!id) {
      return done(new Error("OAuth profile missing id"), false);
    }
    const user = await ensureShellUser({
      provider,
      providerId: id,
      email,
      displayName,
    });
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}

/**
 * Yahoo OAuth 2.0 + OpenID Connect (userinfo).
 * Note: npm package `passport-yahoo-oauth2` is OAuth 1.0a (consumerKey); use OAuth2Strategy for OAuth 2.
 */
function YahooOAuth2Strategy(options, verify) {
  options = options || {};
  options.authorizationURL =
    options.authorizationURL || "https://api.login.yahoo.com/oauth2/request_auth";
  options.tokenURL =
    options.tokenURL || "https://api.login.yahoo.com/oauth2/get_token";
  OAuth2Strategy.call(this, options, verify);
  this.name = "yahoo";
}

util.inherits(YahooOAuth2Strategy, OAuth2Strategy);

YahooOAuth2Strategy.prototype.userProfile = function (accessToken, done) {
  this._oauth2.get(
    "https://api.login.yahoo.com/openid/v1/userinfo",
    accessToken,
    (err, body) => {
      if (err) {
        return done(
          new InternalOAuthError("failed to fetch Yahoo user profile", err)
        );
      }
      try {
        const json = JSON.parse(body);
        const profile = { provider: "yahoo" };
        profile.id = json.sub;
        profile.displayName =
          json.name || json.nickname || json.given_name || json.family_name;
        profile.emails = json.email ? [{ value: json.email }] : [];
        done(null, profile);
      } catch (e) {
        done(e);
      }
    }
  );
};

module.exports = function configurePassport(passport) {
  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await findById(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  const googleCb =
    process.env.GOOGLE_CALLBACK_URL ||
    `${API_BASE_URL}/api/auth/google/callback`;
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: googleCb,
        },
        verifyOAuthUser
      )
    );
  } else {
    console.warn(
      "[Auth] Google OAuth disabled: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET"
    );
  }

  const twitterCb =
    process.env.TWITTER_CALLBACK_URL ||
    `${API_BASE_URL}/api/auth/twitter/callback`;
  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    passport.use(
      new TwitterStrategy(
        {
          clientID: process.env.TWITTER_CLIENT_ID,
          clientSecret: process.env.TWITTER_CLIENT_SECRET,
          callbackURL: twitterCb,
          authorizationURL: "https://twitter.com/i/oauth2/authorize",
          tokenURL: "https://api.twitter.com/2/oauth2/token",
          pkce: true,
          state: true,
          includeEmail: true,
        },
        verifyOAuthUser
      )
    );
  } else {
    console.warn(
      "[Auth] Twitter/X OAuth disabled: set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET"
    );
  }

  const yahooCb =
    process.env.YAHOO_CALLBACK_URL ||
    `${API_BASE_URL}/api/auth/yahoo/callback`;
  if (process.env.YAHOO_CLIENT_ID && process.env.YAHOO_CLIENT_SECRET) {
    passport.use(
      new YahooOAuth2Strategy(
        {
          clientID: process.env.YAHOO_CLIENT_ID,
          clientSecret: process.env.YAHOO_CLIENT_SECRET,
          callbackURL: yahooCb,
          scope: "openid email profile",
          state: true,
        },
        verifyOAuthUser
      )
    );
  } else {
    console.warn(
      "[Auth] Yahoo OAuth disabled: set YAHOO_CLIENT_ID and YAHOO_CLIENT_SECRET"
    );
  }
};
