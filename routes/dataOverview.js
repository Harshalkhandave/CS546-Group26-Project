import { Router } from 'express';
import { getBoroughTrends } from '../data/boroughs.js'; 

const router = Router();

// GET /data-overview
router.get('/', async (req, res) => {
    try {
        const trends = await getBoroughTrends();
        
        res.render('dataOverview', {
            title: 'Water Quality Data Overview & Trends',
            trends: trends,
            isAuthenticated: !!req.session.user
        });
    } catch (e) {
        console.error("Data Overview Error:", e);
        res.status(500).render('error', { error: 'Could not load data overview.' });
    }
});

export default router;