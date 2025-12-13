import express from 'express';
import { voteCollection, boroughCollection, waterSampleCollection, sampleSiteCollection} from '../model/index.js';
import { isValidId, checkString, getCurrentWeekStart } from '../helper/helper.js';
import mongoose from 'mongoose';
const router = express.Router();

router.get('/', async (req, res) => {

  // Extract toast message
  let toast = null;
  if (req.session.toast) {
    toast = req.session.toast;
    delete req.session.toast;   // ensure it only displays once
  }

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

  // detect if user voted this week
  let userVoteBoroughId = null;

  if (req.session.user) {
    const userId = req.session.user.id;

    const getCurrentWeekStart = () => {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      const day = d.getDay();
      const diff = (day + 6) % 7;
      d.setDate(d.getDate() - diff);
      return d;
    };

    const weekStart = getCurrentWeekStart();

    const existingVote = await voteCollection.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      weekStart
    }).lean();

    if (existingVote) {
      userVoteBoroughId = existingVote.boroughId.toString();
    }
  }

  // render with toast
  res.render("boroughs", { 
    boroughs,
    isAuthenticated: !!req.session.user,
    user: req.session.user || null,
    userVoteBoroughId,
    toast
  });
});




router.get('/:id', async (req, res) => {
  try {
    const borough = await boroughCollection.findById(req.params.id).lean();
    if (!borough) {
      return res.status(404).render('error', { error: 'Borough not found' });
    }

    const sites = await sampleSiteCollection
      .find({ borough: borough.name }) 
      .select('sample_site')
      .lean();

    const siteNames = sites.map(s => s.sample_site);

    const samples = await waterSampleCollection
        .find({ sample_site: { $in: siteNames } }) 
        .sort({ sample_date: -1 })
        .limit(200) 
        .lean();

    samples.forEach(s => {
        s.sample_date = s.sample_date 
          ? new Date(s.sample_date).toISOString().split("T")[0] 
          : 'N/A';
    });

    res.render("boroughDetails", {
        borough,
        samples,
        isAuthenticated: !!req.session.user
    });

  } catch (e) {
    console.error("Borough Details Error:", e);
    res.status(500).render('error', { error: 'Could not load borough details' });
  }
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