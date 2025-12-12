import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
// Apple strategy removed — Apple Sign In disabled in this build
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

// Apple Sign In removed from this build. To re-enable, add configuration and
// strategy code here (passport-apple) and set the required APPLE_* env vars.

export default passport;
