import { Router } from 'express';
const router = Router();
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

export default router;
