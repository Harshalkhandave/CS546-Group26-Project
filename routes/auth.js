import { Router } from 'express';
const router = Router();
import bcrypt from "bcrypt";
import passport from 'passport';
import Users from '../model/user.js';
import DeletedEmail from '../model/deletedEmail.js';
const SALT_ROUNDS = 10;

// Google OAuth start
router.get('/auth/google', (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_CALLBACK_URL;
  if (!clientId || !redirectUri) {
    return res.render('error', {
      title: 'Google Sign In Error',
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

// Google OAuth callback
router.get('/auth/google/callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.redirect('/users/login');

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
    const givenName = profile.given_name || profile.givenName || '';
    const familyName = profile.family_name || profile.familyName || '';
    if (!email) throw new Error('No email returned from Google');

    const lowerEmail = email.toLowerCase();

    // Look for active user
    let user = await Users.findOne({ lowerEmail, isDeleted: false });
    if (!user) {
      // Check if there's a deleted account - if so, reactivate it
      const deletedUser = await Users.findOne({ lowerEmail, isDeleted: true });
      if (deletedUser) {
        console.log(`[Google OAuth] Reactivating deleted account for ${lowerEmail}`);
        const randomPwd = Math.random().toString(36).slice(-20);
        const hashedPwd = await bcrypt.hash(randomPwd, SALT_ROUNDS);
        user = await Users.findByIdAndUpdate(
          deletedUser._id,
          { 
            hashedPwd, 
            fname: givenName, 
            lname: familyName,
            isDeleted: false 
          },
          { new: true }
        );
      } else {
        console.log(`[Google OAuth] Creating new account for ${lowerEmail}`);
        const randomPwd = Math.random().toString(36).slice(-20);
        const hashedPwd = await bcrypt.hash(randomPwd, SALT_ROUNDS);
        user = await Users.create({ lowerEmail, hashedPwd, role: 'user', fname: givenName, lname: familyName, isDeleted: false });
        console.log(`[Google OAuth] New account created for ${lowerEmail}`);
      }
    } else {
      console.log(`[Google OAuth] User exists, logging in: ${lowerEmail}`);
    }

    // Create session
    req.session.user = { id: user._id.toString(), email: user.lowerEmail, role: user.role, fname: user.fname || givenName };
    console.log(`[Google OAuth] Session created for ${lowerEmail}`);
    
    return res.redirect('/');
  } catch (e) {
    console.error('Google OAuth callback error:', e);
    return res.status(500).render('error', { error: e });
  }
});

// Apple OAuth start
// Apple Sign In routes removed. Re-enable if you configure Apple OAuth.

export default router;
