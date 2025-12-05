import express from 'express';
import * as waterSampleData from '../data/waterSamples.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const samples = await waterSampleData.getAllWaterSamples();
    res.json(samples);
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const sample = await waterSampleData.getWaterSampleById(req.params.id);
    if (!sample) return res.status(404).json({ error: 'Water sample not found' });
    res.json(sample);
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

router.get('/borough/:boroughId', async (req, res) => {
  try {
    const samples = await waterSampleData.getAllWaterSamplesForABorough(req.params.boroughId);
    if(!samples || samples.length === 0) {
      return res.status(404).json({ error: 'No water samples for that borough!' });
    }
    res.json(samples);
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

router.post('/', async (req, res) => {
  try {
    const sample = await waterSampleData.createWaterSample(req.body);
    res.status(201).json(sample);
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const sample = await waterSampleData.updateWaterSample(req.params.id, req.body);
    if (!sample) return res.status(404).json({ error: 'Water sample not found' });
    res.json(sample);
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const {deleted} = await waterSampleData.deleteWaterSample(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Water sample not found' });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

export default router;
