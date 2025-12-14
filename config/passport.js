import passport from 'passport';
import Users from '../model/user.js';
// Removed bcrypt import (not needed for Google Strategy)
// Removed saltRounds definition

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

// Removed the entire Google Strategy if/else code block
export default passport;
