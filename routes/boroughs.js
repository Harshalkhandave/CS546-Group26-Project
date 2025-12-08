import express from 'express';
import { boroughCollection, waterSampleCollection} from '../model/index.js';
import { isValidId, checkString } from '../helper/helper.js';
const router = express.Router();

router.get('/', async (req, res) => {
  const boroughs = await boroughCollection.find().lean(); 
  boroughs.forEach(b => {
    if (b.stats && b.stats.length > 0) {
      b.quality = {
        _id: b._id,
        chlorine: b.stats[0].avg_chlorine,
        turbidity: b.stats[0].avg_turbidity
      };
    }
  });
  res.render("boroughs", { 
    boroughs});
});


router.get('/:id', async (req, res) => {
  const borough = await boroughCollection.findById(req.params.id).lean();
  const samples = await waterSampleCollection
      .find({ boroughId: req.params.id })
      .sort({ sample_date: -1 })
      .lean();

  samples.forEach(s => {
      s.sample_date = new Date(s.sample_date).toISOString().split("T")[0];
  });

  res.render("boroughDetails", {
      borough,
      samples
  });
});

router.delete('/:id', async (req, res) => {
  try {
    const id = isValidId(req.params.id);
    const borough = await boroughCollection.findByIdAndDelete(id);
    if (!borough) return res.status(404).json({ error: 'Borough not found' });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

export default router;
