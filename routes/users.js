import { Router } from 'express';
const router = Router();
import bcrypt from "bcrypt";
import passport from 'passport';
import crypto from 'crypto';
import Users from '../model/user.js';
import DeletedEmail from '../model/deletedEmail.js';
const SALT_ROUNDS = 10;

function isValidEmail(email) {
  const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(".+"))@(([^<>()[\]\\.,;:\s@\"]+\.)+[^<>()[\]\\.,;:\s@\"]{2,})$/i;
  return re.test(String(email).toLowerCase());
}

// Profile
router.get('/profile', (req, res) => {
  res.render('profile', {
    title: 'My Profile',
    css: '/public/css/styles.css'
  });
});

// Edit Profile (GET)
router.get('/edit-profile', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/users/login');
  }
  res.render('edit-profile', {
    title: 'Edit Profile',
    css: '/public/css/styles.css',
    user: req.session.user
  });
});

// Edit Profile (POST)
router.post('/edit-profile', async (req, res) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const { fname, lname, email } = req.body;
  const userId = req.session.user.id;

  try {
    if (!fname || !lname || !email) {
      return res.render('edit-profile', {
        title: 'Edit Profile',
        css: '/public/css/styles.css',
        user: req.session.user,
        error: 'All fields are required.'
      });
    }

    const newLowerEmail = email.toLowerCase();
    
    // Check if the new email is different and already exists
    if (newLowerEmail !== req.session.user.email) {
      const existing = await Users.findOne({ lowerEmail: newLowerEmail });
      if (existing) {
        return res.render('edit-profile', {
          title: 'Edit Profile',
          css: '/public/css/styles.css',
          user: req.session.user,
          error: 'Email already exists. Please use a different email.'
        });
      }
    }

    const updated = await Users.findByIdAndUpdate(
      userId,
      { fname, lname, lowerEmail: newLowerEmail },
      { new: true }
    );

    console.log(`[Edit Profile] Profile updated for user ${userId}`);

    // Update session with new data
    req.session.user = {
      id: updated._id.toString(),
      email: updated.lowerEmail,
      fname: updated.fname || '',
      lname: updated.lname || '',
      role: updated.role
    };

    // Redirect to profile page after successful update
    return res.redirect('/users/profile');
  } catch (e) {
    console.error('Edit profile error:', e);
    return res.render('edit-profile', {
      title: 'Edit Profile',
      css: '/public/css/styles.css',
      user: req.session.user,
      error: e.toString()
    });
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

// Delete Account
router.post('/delete-account', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const userId = req.session.user.id;
    const userEmail = req.session.user.email;
    
    console.log(`[Delete Account] Marking user ${userId} with email ${userEmail} as deleted`);
    
    // Soft delete: mark as deleted instead of removing from DB
    const result = await Users.findByIdAndUpdate(
      userId,
      { isDeleted: true },
      { new: true }
    );
    
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    console.log(`[Delete Account] User marked as deleted`);

    // Destroy session after successful deletion
    req.session.destroy(err => {
      if (err) console.error('Session destroy error:', err);
      res.json({ success: true, message: 'Account deleted successfully' });
    });
  } catch (e) {
    console.error('Delete account error:', e);
    res.status(500).json({ error: 'Error deleting account' });
  }
});

// Dev-only: inspect session (useful for debugging OAuth flows)
router.get('/debug/session', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).send('Not found');
  return res.json({ session: req.session || null, user: req.session ? req.session.user : null });
});

// Dev simulate Apple removed

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
    // Basic server-side validation
    if (!email || !password) {
      return res.render('login', { title: 'Login', error: 'Email and password are required.', css: '/public/css/styles.css' });
    }
    if (!isValidEmail(email)) {
      return res.render('login', { title: 'Login', error: 'Please provide a valid email address.', css: '/public/css/styles.css' });
    }

    const lowerEmail = email.toLowerCase();
    console.log(`[Login] Attempting login for ${lowerEmail}`);
    
    // First check if user exists and is active
    const user = await Users.findOne({ lowerEmail, isDeleted: false });
    if (!user) {
      // Check if account exists but is deleted
      const deletedUser = await Users.findOne({ lowerEmail, isDeleted: true });
      if (deletedUser) {
        console.log(`[Login] Account deleted: ${lowerEmail}`);
        return res.render('login', { title: 'Login', error: "This account has been deleted. Don't have an account? Create one.", css: '/public/css/styles.css' });
      }
      
      console.log(`[Login] User not found: ${lowerEmail}`);
      return res.render('login', { title: 'Login', error: "Don't have an account? Create one.", css: '/public/css/styles.css' });
    }

    console.log(`[Login] User found, checking password...`);
    const match = await bcrypt.compare(password, user.hashedPwd);
    if (!match) {
      console.log(`[Login] Password mismatch for ${lowerEmail}`);
      return res.render('login', { title: 'Login', error: 'Invalid email or password.', css: '/public/css/styles.css' });
    }

    console.log(`[Login] ✓ Login successful for ${lowerEmail}`);
    // LOGIN SUCCESS
    req.session.user = { id: user._id.toString(), email: user.lowerEmail, fname: user.fname || '', lname: user.lname || '', role: user.role };
    return res.redirect('/');

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
    // Server-side validation
    if (!fname || !lname || !email || !password) {
      return res.render('register', { title: 'Create Account', error: 'All fields are required.', css: '/public/css/styles.css' });
    }
    if (!isValidEmail(email)) {
      return res.render('register', { title: 'Create Account', error: 'Please provide a valid email address.', css: '/public/css/styles.css' });
    }
    // Password strength: min 8 chars, uppercase, lowercase, number, symbol
    const pwdRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdRe.test(password)) {
      return res.render('register', { title: 'Create Account', error: 'Password must be at least 8 characters and include uppercase, lowercase, number and symbol.', css: '/public/css/styles.css' });
    }

    const lowerEmail = email.toLowerCase();
    const existing = await Users.findOne({ lowerEmail, isDeleted: false });
    if (existing) {
      return res.render('register', { title: 'Create Account', error: 'An account with that email already exists.', css: '/public/css/styles.css' });
    }

    // Check if there's a deleted account with this email - if so, reactivate it
    const deletedAccount = await Users.findOne({ lowerEmail, isDeleted: true });
    if (deletedAccount) {
      console.log(`[Register] Reactivating deleted account for ${lowerEmail}`);
      // Reactivate the deleted account
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
      const updated = await Users.findByIdAndUpdate(
        deletedAccount._id,
        { 
          hashedPwd: hashedPassword,
          fname, 
          lname, 
          isDeleted: false 
        },
        { new: true }
      );
      
      // Auto-login after reactivation
      req.session.user = { id: updated._id.toString(), email: updated.lowerEmail, fname: updated.fname || '', lname: updated.lname || '', role: updated.role };
      return res.redirect('/');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const created = await Users.create({ lowerEmail, hashedPwd: hashedPassword, fname, lname, role: 'user', isDeleted: false });


    // Auto-login after registration
    req.session.user = { id: created._id.toString(), email: created.lowerEmail, fname: created.fname || '', lname: created.lname || '', role: created.role };
    return res.redirect('/');

  } catch (e) {
    return res.status(500).render('error', { error: e });
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
  const { email } = req.body;

  try {
    if (!email) {
      return res.render('forgot-password', { 
        title: 'Forgot Password', 
        error: 'Please provide an email address.', 
        css: '/public/css/styles.css' 
      });
    }

    if (!isValidEmail(email)) {
      return res.render('forgot-password', { 
        title: 'Forgot Password', 
        error: 'Please provide a valid email address.', 
        css: '/public/css/styles.css' 
      });
    }

    const lowerEmail = email.toLowerCase();
    const user = await Users.findOne({ lowerEmail, isDeleted: false });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      console.log(`[Forgot Password] No active user found for ${lowerEmail}`);
      return res.render('forgot-password', { 
        title: 'Forgot Password', 
        message: 'If an account with that email exists, you will receive password reset instructions.', 
        css: '/public/css/styles.css' 
      });
    }

    // Generate reset token (random 32-char hex string)
    const resetToken = crypto.randomBytes(16).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    // Save token to user
    await Users.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpires
    });

    // Build reset link
    const resetLink = `http://localhost:3000/users/reset-password/${resetToken}`;

    // For development: log the link to console
    console.log(`[Forgot Password] Reset link for ${lowerEmail}: ${resetLink}`);
    console.log(`[Forgot Password] Token expires at: ${resetTokenExpires.toISOString()}`);

    // For development: show the link directly on the page
    res.render('forgot-password', { 
      title: 'Forgot Password', 
      message: 'Password reset link has been generated. Click below to reset your password.', 
      resetLink,
      css: '/public/css/styles.css' 
    });

  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).render('error', { error: e });
  }
});

/* ===========================================
   RESET PASSWORD PAGE (GET) - Show Reset Form
=========================================== */
router.get('/reset-password/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const user = await Users.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.render('error', { 
        error: 'Password reset token is invalid or has expired. Please request a new one.' 
      });
    }

    res.render('reset-password', {
      title: 'Reset Password',
      token,
      css: '/public/css/styles.css'
    });

  } catch (e) {
    console.error('Reset password page error:', e);
    res.status(500).render('error', { error: e });
  }
});

/* ===========================================
   RESET PASSWORD PAGE (POST) - Update Password
=========================================== */
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;

  try {
    // Validate inputs
    if (!password || !confirmPassword) {
      return res.render('reset-password', {
        title: 'Reset Password',
        token,
        error: 'Both password fields are required.',
        css: '/public/css/styles.css'
      });
    }

    if (password !== confirmPassword) {
      return res.render('reset-password', {
        title: 'Reset Password',
        token,
        error: 'Passwords do not match.',
        css: '/public/css/styles.css'
      });
    }

    // Password strength: min 8 chars, uppercase, lowercase, number, symbol
    const pwdRe = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
    if (!pwdRe.test(password)) {
      return res.render('reset-password', {
        title: 'Reset Password',
        token,
        error: 'Password must be at least 8 characters and include uppercase, lowercase, number and symbol.',
        css: '/public/css/styles.css'
      });
    }

    // Find user with valid token
    const user = await Users.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.render('error', { 
        error: 'Password reset token is invalid or has expired. Please request a new one.' 
      });
    }

    // Hash new password and update user
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    await Users.findByIdAndUpdate(user._id, {
      hashedPwd: hashedPassword,
      resetToken: null,
      resetTokenExpires: null
    });

    console.log(`[Reset Password] Password reset successful for ${user.lowerEmail}`);

    // Redirect to login with success message
    res.render('login', {
      title: 'Login',
      message: 'Password reset successful! Please log in with your new password.',
      css: '/public/css/styles.css'
    });

  } catch (e) {
    console.error('Reset password error:', e);
    res.status(500).render('error', { error: e });
  }
});

export default router;
