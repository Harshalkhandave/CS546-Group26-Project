import { Router } from 'express';
const router = Router();
import bcrypt from "bcrypt";
import passport from 'passport';
import Users from '../model/user.js';
const SALT_ROUNDS = 10;
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('routes/index.js loaded');

const usersFilePath = path.join(__dirname, "../data/users.json");

/* ===========================================
   Load Users From JSON File
=========================================== */
const loadUsers = () => {
  const fileData = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(fileData);
};

/* ===========================================
   Save Users Into JSON File
=========================================== */
const saveUsers = (users) => {
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
};

/* ===========================================
   HOME PAGE
=========================================== */
router.get('/', async (req, res) => {
  try {
    res.render('home', {
      title: 'Welcome to Water Monitor',
      css: '/public/css/styles.css'
    });
  } catch (e) {
    res.status(500).render('error', { error: e });
  }
});

// Logout
router.get('/logout', (req, res) => {
  if (req.session) {
    req.session.destroy(err => {
      if (err) console.error('Session destroy error:', err);
      res.redirect('/');
    });
  } else {
    res.redirect('/');
  }
});

// Dev-only: inspect session (useful for debugging OAuth flows)
router.get('/debug/session', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).send('Not found');
  return res.json({ session: req.session || null, user: req.session ? req.session.user : null });
});

/* ===========================================
   LOGIN PAGE (GET)
=========================================== */
router.get('/login', async (req, res) => {
  res.render('login', {
    title: 'Login',
    css: '/public/css/styles.css'
  });
});

/* ===========================================
   LOGIN PAGE (POST)
=========================================== */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const users = loadUsers();

    // Find user by email
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password',
        css: '/public/css/styles.css'
      });
    }

    /* ================================
       BCRYPT PASSWORD MATCH CHECK
    ================================= */
    console.log("🔐 Bcrypt Exploration:");
    console.log("Entered Password:", password);
    console.log("Stored Hash:", user.password);

    const match = await bcrypt.compare(password, user.password);

    console.log("Password Match:", match);

    if (!match) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid email or password',
        css: '/public/css/styles.css'
      });
    }

    // LOGIN SUCCESS
    return res.render('home', {
      title: 'Welcome to Water Monitor',
      css: '/public/css/styles.css'
    });

  } catch (e) {
    console.error("Login Error:", e);
    return res.status(500).render('error', { error: e });
  }

});

/* ===========================================
   REGISTER PAGE (GET)
=========================================== */
router.get('/register', async (req, res) => {
  res.render('register', {
    title: 'Create Account',
    css: '/public/css/styles.css'
  });
});

/* ===========================================
   REGISTER PAGE (POST)
   + PASSWORD HASHING (bcrypt)
=========================================== */
router.post('/register', async (req, res) => {
  const { fname, lname, email, password } = req.body;

  try {
    const users = loadUsers();

    // Check if email exists
    if (users.find(u => u.email === email)) {
      return res.render('register', {
        title: 'Create Account',
        error: 'Email already exists',
        css: '/public/css/styles.css'
      });
    }

    /* ================================
       BCRYPT HASHING EXPLORATION
    ================================= */
    const saltRounds = 10;
    console.log("🔐 bcrypt hashing exploration:");
    console.log("Plain Password:", password);

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log("Generated Hash:", hashedPassword);

    // Save new user
    const newUser = {
      fname,
      lname,
      email,
      password: hashedPassword
    };

    users.push(newUser);
    saveUsers(users);

    return res.redirect('/login');

  } catch (e) {
    return res.status(500).render('error', { error: e });
  }
});

/* ===========================================
   OAUTH PAGES (Simple UI placeholders)
   These pages are placeholders that show a friendly
   message and allow you to "simulate" a sign-in.
   Replace with real OAuth flows (Passport.js, client IDs)
   when ready.
=========================================== */
// Google OAuth start + callback (only if strategy registered)
// Manual Google OAuth flow (avoids Passport issues)
router.get('/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.render('auth_google', {
      title: 'Sign in with Google',
      css: '/public/css/styles.css',
      error: 'Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CALLBACK_URL.'
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });

  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/login');

  try {
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code'
      })
    });

    const tokenJson = await tokenRes.json();
    if (tokenJson.error) throw tokenJson;

    const accessToken = tokenJson.access_token;

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const profile = await profileRes.json();
    const email = profile.email;
    if (!email) throw new Error('No email returned from Google');

    const lowerEmail = email.toLowerCase();
    let user = await Users.findOne({ lowerEmail });
    if (!user) {
      const randomPwd = Math.random().toString(36).slice(-20);
      const hashedPwd = await bcrypt.hash(randomPwd, SALT_ROUNDS);
      user = await Users.create({ lowerEmail, hashedPwd, role: 'user' });
    }

    // Create session
    req.session.user = { id: user._id.toString(), email: user.lowerEmail, role: user.role };
    return res.redirect('/');
  } catch (e) {
    console.error('Google OAuth callback error:', e);
    return res.status(500).render('error', { error: e });
  }
});

// Apple OAuth start + callback (only if strategy registered)
// Apple OAuth start - wrapper to check strategy at request time
router.get('/auth/apple', (req, res, next) => {
  if (!(passport._strategy && passport._strategy('apple'))) {
    return res.render('auth_apple', {
      title: 'Sign in with Apple',
      css: '/public/css/styles.css',
      error: 'Apple Sign In is not configured. Set Apple env vars as documented.'
    });
  }
  return passport.authenticate('apple')(req, res, next);
});

// Apple callbacks - wrappers
router.post('/auth/apple/callback', (req, res, next) => {
  if (!(passport._strategy && passport._strategy('apple'))) return res.redirect('/login');
  return passport.authenticate('apple', { failureRedirect: '/login' })(req, res, next);
});

router.get('/auth/apple/callback', (req, res, next) => {
  if (!(passport._strategy && passport._strategy('apple'))) return res.redirect('/login');
  return passport.authenticate('apple', { failureRedirect: '/login' })(req, res, next);
});

export default router;
