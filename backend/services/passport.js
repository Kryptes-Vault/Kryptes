const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const TwitterStrategy = require('passport-twitter-oauth2').Strategy;
const YahooStrategy = require('passport-yahoo-oauth2').Strategy;

module.exports = function(passport) {
  // Session management: Minimal identity storage
  passport.serializeUser((user, done) => {
    done(null, { id: user.id, provider: user.provider, email: user.email });
  });

  passport.deserializeUser((obj, done) => {
    done(null, obj);
  });

  // GOOGLE (OAuth 2.0)
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "https://kryptes.onrender.com/api/auth/google/callback",
        scope: ['profile', 'email']
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, { id: profile.id, provider: 'google', email: profile.emails?.[0]?.value, displayName: profile.displayName });
      }
    ));
  }

  // TWITTER / X (OAuth 2.0)
  if (process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET) {
    passport.use(new TwitterStrategy({
        clientID: process.env.TWITTER_CLIENT_ID,
        clientSecret: process.env.TWITTER_CLIENT_SECRET,
        callbackURL: "https://kryptes.onrender.com/api/auth/twitter/callback",
        clientType: 'confidential',
        scope: ['users.read', 'tweet.read', 'offline.access']
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, { id: profile.id, provider: 'twitter', email: profile.email, displayName: profile.displayName });
      }
    ));
  }

  // YAHOO (OAuth 2.0)
  if (process.env.YAHOO_CLIENT_ID && process.env.YAHOO_CLIENT_SECRET) {
    passport.use(new YahooStrategy({
        clientID: process.env.YAHOO_CLIENT_ID,
        clientSecret: process.env.YAHOO_CLIENT_SECRET,
        callbackURL: "https://kryptes.onrender.com/api/auth/yahoo/callback"
      },
      (accessToken, refreshToken, profile, done) => {
        return done(null, { id: profile.id, provider: 'yahoo', email: profile.emails?.[0]?.value, displayName: profile.displayName });
      }
    ));
  }
};