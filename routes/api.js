import express from 'express';
import {boroughsData, waterSamplesData} from '../data/index.js'
const router = express.Router();

router.get("/borough-stats", async (req, res) => {
    try {
        const { year, month } = req.query;
        const results = await boroughsData.getBoroughsDataByMonthYear(year, month)
        res.json(results);
    } catch (e) {
        res.status(500).json({ e });
    }
});

router.get("/data-dates", async (req, res) => {
    try {
        const results = await waterSamplesData.getDataDates()
        res.json(results);
    } catch (e) {
        res.status(500).json({ e });
    }
});

router.get('/water-samples', async (req, res) => {
  try {
    const { page } = req.query;
    const results = await waterSamplesData.getSamplesByPage(page);
    res.json(results);
  } catch (e) {
    res.status(500).json({ e });
  }
});

export default router;