import express from 'express';
import BoroughCollection from '../model/borough.js';
import { isValidId, checkString } from '../helper/helper.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const boroughs = await BoroughCollection.find({}).lean();
    boroughs.forEach(b => { b._id = b._id.toString(); });
    res.json(boroughs); //Render UI Later
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const id = isValidId(req.params.id);
    const borough = await BoroughCollection.findById(id).lean();
    if (!borough) return res.status(404).json({ error: 'Borough not found' });
    borough._id = borough._id.toString();
    res.json(borough); //Render UI Later
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = isValidId(req.params.id);
    const borough = await BoroughCollection.findByIdAndDelete(id);
    if (!borough) return res.status(404).json({ error: 'Borough not found' });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

export default router;
