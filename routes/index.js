import { Router } from 'express';
const router = Router();
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, "../data/users.json");

const loadUsers = () => {
  const fileData = fs.readFileSync(usersFilePath, "utf-8");
  return JSON.parse(fileData);
};


router.route('/').get(async (req, res) => {
  try {
    res.render('home', {
      title: 'Welcome to Water Monitor',
      css: '/public/css/styles.css'
    });
  } catch (e) {
    res.status(500).render('error', { error: e });
  }
});

router.get('/login', async (req, res) => {
  res.render('login', {
    title: 'Login',
    css: '/public/css/styles.css'
  });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const users = loadUsers();

    const user = users.find(u => u.username === username);

    if (!user) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid username or password',
        css: '/public/css/styles.css'
      });
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.render('login', {
        title: 'Login',
        error: 'Invalid username or password',
        css: '/public/css/styles.css'
      });
    }
    return res.render('home', {
      title: 'Welcome to Water Monitor',
      css: '/public/css/styles.css'
    });

  } catch (e) {
    return res.status(500).render('error', { error: e });
  }
 
});

export default router;
