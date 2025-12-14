import express from 'express';
import * as waterSampleData from '../data/waterSamples.js';

const router = express.Router();

// Render search/browse page
router.get('/', async (req, res) => {
  try {
    res.render('watersamples', {
      title: 'Water Quality Samples (2023-2024)',
      css: '/public/css/styles.css'
    });
  } catch (e) {
    res.status(500).render('error', { error: e.message || e });
  }
});

// API: search/filter samples
router.get('/api/search', async (req, res) => {
  try {
    const { sample_number, sample_site, borough, startDate, endDate, page, limit } = req.query;
    const results = await waterSampleData.getSamplesByFilter({ sample_number, sample_site, borough, startDate, endDate, page, limit });
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

export default router;