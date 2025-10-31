const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const MicrosoftStrategy = require('passport-microsoft').Strategy;
const TwitterStrategy = require('passport-twitter-oauth2').Strategy;
const YahooStrategy = require('passport-yahoo-oauth2').Strategy;

module.exports = function(passport) {
  // Serialize user: Only store user_id in session for Zero-Knowledge consistency
  passport.serializeUser((user, done) => {
    done(null, { id: user.id, provider: user.provider });
  });

  passport.deserializeUser((obj, done) => {
    // In a real ZK app, we'd fetch the user from a database by ID
    // but keep sensitive data out of the deserialized object
    done(null, obj);
  });

  // GOOGLE STRATEGY
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
      scope: ['profile', 'email']
    },
    (accessToken, refreshToken, profile, done) => {
      // Zero-Knowledge: Only pass identifying info, tokens remain temporary
      return done(null, { id: profile.id, provider: 'google', email: profile.emails[0].value });
    }
  ));

  // MICROSOFT STRATEGY
  passport.use(new MicrosoftStrategy({
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL: "/api/auth/microsoft/callback",
      scope: ['user.read']
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, { id: profile.id, provider: 'microsoft', email: profile.emails[0].value });
    }
  ));

  // TWITTER (X) STRATEGY (OAuth 2.0)
  passport.use(new TwitterStrategy({
      clientID: process.env.TWITTER_CLIENT_ID,
      clientSecret: process.env.TWITTER_CLIENT_SECRET,
      callbackURL: "/api/auth/twitter/callback",
      clientType: 'confidential',
      scope: ['tweet.read', 'users.read', 'offline.access']
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, { id: profile.id, provider: 'twitter', username: profile.username });
    }
  ));

  // YAHOO STRATEGY
  passport.use(new YahooStrategy({
      clientID: process.env.YAHOO_CLIENT_ID,
      clientSecret: process.env.YAHOO_CLIENT_SECRET,
      callbackURL: "/api/auth/yahoo/callback"
    },
    (accessToken, refreshToken, profile, done) => {
      return done(null, { id: profile.id, provider: 'yahoo', email: profile.emails[0].value });
    }
  ));
};
