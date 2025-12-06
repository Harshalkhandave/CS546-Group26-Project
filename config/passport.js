import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import AppleStrategy from 'passport-apple';
import Users from '../model/user.js';
import bcrypt from 'bcrypt';

const saltRounds = 10;

// Serialize user id to session
passport.serializeUser((user, done) => {
  done(null, user._id.toString());
});

// Deserialize user from id stored in session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await Users.findById(id);
    if (!user) return done(null, false);
    return done(null, user);
  } catch (e) {
    return done(e);
  }
});

// Google Strategy
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;
        if (!email) return done(new Error('No email found in Google profile'));

        const lowerEmail = email.toLowerCase();
        let user = await Users.findOne({ lowerEmail });
        if (user) return done(null, user);

        // Create a user with a random password (so schema's required hashedPwd is satisfied)
        const randomPwd = Math.random().toString(36).slice(-20);
        const hashedPwd = await bcrypt.hash(randomPwd, saltRounds);
        user = await Users.create({ lowerEmail, hashedPwd, role: 'user' });
        return done(null, user);
      } catch (e) {
        return done(e);
      }
    }
  ));
  console.log(' Google OAuth strategy registered');
} else {
  console.warn(' Google OAuth not configured (missing env vars).');
}

// Apple Strategy (requires setting private key or private key string)
if (process.env.APPLE_CLIENT_ID && process.env.APPLE_TEAM_ID && process.env.APPLE_KEY_ID && (process.env.APPLE_PRIVATE_KEY || process.env.APPLE_PRIVATE_KEY_PATH) && process.env.APPLE_CALLBACK_URL) {
  let privateKey = process.env.APPLE_PRIVATE_KEY;
  // If a file path was provided, load it
  if (!privateKey && process.env.APPLE_PRIVATE_KEY_PATH) {
    try {
      // Note: Avoid synchronous reads in production; keeping simple here.
      // The path should be absolute or relative to project root.
      // eslint-disable-next-line node/no-unpublished-require
      const fs = await import('fs');
      privateKey = fs.readFileSync(process.env.APPLE_PRIVATE_KEY_PATH, 'utf8');
    } catch (e) {
      console.error('Failed to load Apple private key from path', e.message);
    }
  }

  if (!privateKey) {
    console.warn('⚠️  Apple private key not available; skipping Apple strategy registration.');
  } else {
    passport.use(new AppleStrategy(
      {
        clientID: process.env.APPLE_CLIENT_ID,
        teamID: process.env.APPLE_TEAM_ID,
        keyID: process.env.APPLE_KEY_ID,
        privateKey,
        callbackURL: process.env.APPLE_CALLBACK_URL,
        scope: ['name', 'email']
      },
      async (accessToken, refreshToken, idToken, profile, done) => {
        try {
          // Apple may not always send email after first sign-in; try to derive it
          const email = (profile && profile.email) || (idToken && idToken.email);
          if (!email) return done(new Error('No email received from Apple'));

          const lowerEmail = email.toLowerCase();
          let user = await Users.findOne({ lowerEmail });
          if (user) return done(null, user);

          const randomPwd = Math.random().toString(36).slice(-20);
          const hashedPwd = await bcrypt.hash(randomPwd, saltRounds);
          user = await Users.create({ lowerEmail, hashedPwd, role: 'user' });
          return done(null, user);
        } catch (e) {
          return done(e);
        }
      }
    ));
  }
  if (passport._strategy && passport._strategy('apple')) {
    console.log('✅ Apple OAuth strategy registered');
  }
} else {
  console.warn('⚠️  Apple OAuth not fully configured (missing env vars).');
}

export default passport;
