import express from 'express';
import { boroughCollection, waterSampleCollection, sampleSiteCollection, userCollection as User } from '../model/index.js';
import commentsData from '../data/comments.js';
import userData from '../data/users.js';
import { isValidId } from '../helper/helper.js';

const router = express.Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'You must be logged in to perform this action.' });
  }
  next();
};

router.get('/', async (req, res) => {
  try {
    const boroughs = await boroughCollection.find().lean();

    boroughs.forEach(b => {
      if (b.stats && b.stats.length > 0) {
        b.avg_chlorine = b.stats[0].avg_chlorine;
        b.avg_turbidity = b.stats[0].avg_turbidity;
      }
    });

    res.render('boroughs', {
      boroughs,
      isAuthenticated: !!req.session.user
    });
  } catch (e) {
    console.error('Borough Listings Error:', e);
    res.status(500).render('error', { error: 'Could not load borough listings' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const boroughId = req.params.id;
    const borough = await boroughCollection.findById(boroughId).lean();

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
        ? new Date(s.sample_date).toISOString().split('T')[0]
        : 'N/A';
    });

    const comments = await commentsData.getCommentsByBorough(boroughId);

    let isLiked = false;
    if (req.session.user) {
      const user = await User.findById(req.session.user.id)
        .select('likedBoroughs')
        .lean();

      if (user && user.likedBoroughs) {
        isLiked = user.likedBoroughs
          .map(id => id.toString())
          .includes(boroughId);
      }
    }

    res.render('boroughDetails', {
      borough,
      samples,
      comments,
      isLiked,
      isAuthenticated: !!req.session.user
    });
  } catch (e) {
    console.error('Borough Details Error:', e);
    res.status(500).render('error', { error: 'Could not load borough details' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = isValidId(req.params.id);
    const borough = await boroughCollection.findByIdAndDelete(id);

    if (!borough) {
      return res.status(404).json({ error: 'Borough not found' });
    }

    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

router.post('/:id/like', requireAuth, async (req, res) => {
  const boroughId = req.params.id;
  const userId = req.session.user.id;

  try {
    const updatedUser = await userData.toggleLikeBorough(userId, boroughId);

    const isLiked = updatedUser.likedBoroughs
      .map(id => id.toString())
      .includes(boroughId);

    res.json({ success: true, isLiked });
  } catch (e) {
    res.status(400).json({ error: e.toString() });
  }
});

export default router;
