import {Router} from 'express';

const router = Router();

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

  export default router;