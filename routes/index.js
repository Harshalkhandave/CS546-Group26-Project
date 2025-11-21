import { Router } from 'express';
const router = Router();

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
  
  res.render('login', {
    title: 'Login',
    error: 'Invalid username or password',
    css: '/public/css/styles.css'
  });
});

export default router;
