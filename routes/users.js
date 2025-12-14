import { Router } from 'express';
const router = Router();
import userData from '../data/users.js';

// Middleware: ensure user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.redirect('/users/login');
  next();
};

// Profile
router.get('/profile', requireAuth, (req, res) => {
  res.render('profile', {
    title: 'My Profile',
    user: req.session.user,
    css: '/public/css/styles.css'
  });
});

// Edit Profile (GET)
router.get('/edit-profile', requireAuth, (req, res) => {
  res.render('edit-profile', {
    title: 'Edit Profile',
    css: '/public/css/styles.css',
    user: req.session.user
  });
});

// Edit Profile (POST)
router.post('/edit-profile', requireAuth, async (req, res) => {
  let { fname, lname, email } = req.body;

  try {
    const updatedUser = await userData.updateUser(
      req.session.user.id,
      fname,
      lname,
      email
    );

    req.session.user = updatedUser;

    return res.redirect('/users/profile');
  } catch (e) {
    return res.render('edit-profile', {
      title: 'Edit Profile',
      css: '/public/css/styles.css',
      user: req.session.user,
      error: e.toString(),
      hasErrors: true
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Delete Account
router.post('/delete-account', requireAuth, async (req, res) => {
  try {
    await userData.removeUser(req.session.user.id);
    req.session.destroy();
    return res.json({ success: true, message: 'Account deleted' });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
});

// Dev-only: inspect session (useful for debugging OAuth flows)
router.get('/debug/session', (req, res) => {
  if (process.env.NODE_ENV === 'production')
    return res.status(404).send('Not found');

  return res.json({
    session: req.session || null,
    user: req.session ? req.session.user : null
  });
});

// Dev simulate Apple removed

/* ===========================================
   LOGIN PAGE (GET)
=========================================== */
router.get('/login', async (req, res) => {
  if (req.session.user) return res.redirect('/');
  res.render('login', {
    title: 'Login',
    css: '/public/css/styles.css',
    redirect: req.query.redirect || '/'
  });
});

/* ===========================================
   LOGIN PAGE (POST)
=========================================== */
router.post('/login', async (req, res) => {
  let { email, password, redirect } = req.body;
  try {
    // LOGIN (DATA): VERIFY EMAIL + PASSWORD
    const sessionUser = await userData.login(email, password);
    req.session.user = sessionUser;
    return res.redirect(redirect || '/');
  } catch (e) {
    return res.status(400).render('login', {
      title: 'Login',
      error: e,
      hasErrors: true,
      email: email,
      css: '/public/css/styles.css',
      redirect
    });
  }
});

/* ===========================================
   REGISTER PAGE (GET)
=========================================== */
router.get('/register', (req, res) => {
  if (req.session.user) return res.redirect('/');
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
  let { fname, lname, email, password } = req.body;
  try {
    // REGISTER (DATA): VALIDATE INPUT + HASH PASSWORD (bcrypt)
    const sessionUser = await userData.createUser(
      fname,
      lname,
      email,
      password
    );
    // Auto-login after registration
    req.session.user = sessionUser;
    return res.redirect('/');
  } catch (e) {
    return res.status(400).render('register', {
      title: 'Create Account',
      error: e,
      hasErrors: true,
      reqBody: { fname, lname, email },
      css: '/public/css/styles.css'
    });
  }
});

/* ===========================================
   FORGOT PASSWORD PAGE (GET)
=========================================== */
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password', {
    title: 'Forgot Password',
    css: '/public/css/styles.css'
  });
});

/* ===========================================
   FORGOT PASSWORD PAGE (POST) - Send Reset Link
=========================================== */
router.post('/forgot-password', async (req, res) => {
  let { email } = req.body;
  try {
    const result = await userData.creatPwdResetToken(email);

    // Don't reveal if email exists (security best practice)
    let message =
      'If an account with that email exists, you will receive password reset instructions.';
    let resetLink = null;

    if (result) {
      // Build reset link (dev)
      resetLink = `http://localhost:3000/users/reset-password/${result.token}`;

      // For development: log the link to console
      console.log(`[Dev Reset Link]: ${resetLink}`);
    }

    // For development: show the link directly on the page
    res.render('forgot-password', {
      title: 'Forgot Password',
      message,
      resetLink,
      css: '/public/css/styles.css'
    });
  } catch (e) {
    res.render('forgot-password', {
      title: 'Forgot Password',
      error: e,
      hasErrors: true,
      css: '/public/css/styles.css'
    });
  }
});

/* ===========================================
   RESET PASSWORD PAGE (GET) - Show Reset Form
=========================================== */
router.get('/reset-password/:token', async (req, res) => {
  res.render('reset-password', {
    title: 'Reset Password',
    token: req.params.token,
    css: '/public/css/styles.css'
  });
});

/* ===========================================
   RESET PASSWORD PAGE (POST) - Update Password
=========================================== */
router.post('/reset-password/:token', async (req, res) => {
  let { password, confirmPassword } = req.body;
  let token = req.params.token;

  try {
    if (password !== confirmPassword) throw 'Passwords do not match';

    await userData.resetPwd(token, password);

    res.render('login', {
      title: 'Login',
      message: 'Password reset successful! Please log in.',
      css: '/public/css/styles.css'
    });
  } catch (e) {
    res.status(400).render('reset-password', {
      title: 'Reset Password',
      token,
      error: e,
      hasErrors: true,
      css: '/public/css/styles.css'
    });
  }
});

export default router;
