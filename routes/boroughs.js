import express from 'express';
import { voteCollection, boroughCollection, waterSampleCollection } from '../model/index.js';
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
  const borough = await boroughCollection.findById(req.params.id).lean();
  const samples = await waterSampleCollection
    .find({ boroughId: req.params.id })
    .sort({ sample_date: -1 })
    .lean();

  samples.forEach(s => {
    s.sample_date = new Date(s.sample_date).toISOString().split("T")[0];
  });

  // --- Health Tips ---
  const GUIDELINES = {
    chlorine: 4.0,
    turbidity: 0.0,
    coliform: 0.0,
    ecoli: 0.0, 
    fluoride: 2.0
  };

  const tips = [];
  const notices = [];

  const stats = borough?.stats?.[0]; // in case of crashing
  if (stats) {
    if (stats.avg_turbidity > GUIDELINES.turbidity) {
      notices.push("Turbidity");
      tips.push("If you notice cloudiness, consider using a basic water filter for drinking.");
    }

    if (stats.avg_chlorine > GUIDELINES.chlorine) {
      notices.push("Chlorine");
      tips.push("If the taste/smell is strong, letting water sit can reduce chlorine odor.");
    }

    if (stats.avg_coliform > GUIDELINES.coliform) {
      notices.push("Coliform");
      tips.push("For extra caution, follow local public health guidance if advisories are issued.");
    }

    if (stats.avg_e_coli > GUIDELINES.ecoli) {
      notices.push("E. coli");
      tips.push("Avoid making assumptions—check official advisories for recommended actions.");
    }

    if (stats.avg_fluoride > GUIDELINES.fluoride) {
      notices.push("Fluoride");
      tips.push("If you have questions about fluoride levels, check local water quality reports for context.");
    }
  }

  let combinedNotice = null;
  if (notices.length > 0) {
    combinedNotice = `${notices.join(", ")} ${notices.length === 1 ? "is" : "are"} above the guideline for this borough.`;
  }

  // *always show something*
  const showHealthTips = true;
  if (showHealthTips && tips.length === 0) {
    tips.push("All monitored indicators are within the defined guideline range for this borough.");
  }

  res.render("boroughDetails", {
    borough,
    samples,
    tips,
    combinedNotice
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
