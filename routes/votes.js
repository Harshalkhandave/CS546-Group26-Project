// routes/votes.js
import express from 'express';
import mongoose from 'mongoose';
import { getCurrentWeekStart } from '../helper/helper.js'
import { requireLogin } from '../middleware.js';
import { boroughCollection, voteCollection } from '../model/index.js';

const router = express.Router();

router.post('/', requireLogin, async (req, res) => {
  try {
    console.log('POST /votes body:', req.body);
    console.log('session user:', req.session.user);

    const { boroughId } = req.body;

    if (!boroughId || !mongoose.Types.ObjectId.isValid(boroughId)) {
      return res.status(400).render('error', { error: 'Invalid borough id.' });
    }

    const userIdString = req.session.user.id;
    if (!userIdString) {
      console.error('No id on session.user:', req.session.user);
      return res.status(500).render('error', { error: 'User session is missing id.' });
    }

    const userId = new mongoose.Types.ObjectId(userIdString);
    const weekStart = getCurrentWeekStart();

    // 1 vote per user per week
    const existing = await voteCollection.findOne({ userId, weekStart });
    if (existing) {
      req.session.toast = {
        type: 'error',
        message: 'You have already voted for a borough this week.'
      };
      return res.redirect('/votes/best');   // stay on Best Borough page after login
    }

    await voteCollection.create({
      userId,
      boroughId: new mongoose.Types.ObjectId(boroughId),
      weekStart
    });

    req.session.toast = {
      type: 'message',
      message: 'Your vote has been recorded!'
    };

    return res.redirect('/votes/best');
  } catch (err) {
    console.error('Error creating vote:', err);
    return res.status(500).render('error', { error: 'Could not create vote.' });
  }
});


// GET /votes/best 
router.get("/best", async (req, res) => {
  try {
    const weekStart = getCurrentWeekStart();

    // Toast from session (for this page only)
    let toast = null;
    if (req.session.toast) {
      toast = req.session.toast;
      delete req.session.toast;
    }

    // Winner for this week
    const agg = await voteCollection.aggregate([
      { $match: { weekStart } },
      { $group: { _id: "$boroughId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    let bestBorough = null;
    if (agg.length > 0) {
      const b = await boroughCollection.findById(agg[0]._id).lean();
      if (b) {
        bestBorough = {
          name: b.name,
          description: b.description,
          voteCount: agg[0].count
        };
      }
    }

    // Get all boroughs
    const allBoroughs = await boroughCollection.find().lean();

    // Find which borough THIS user voted for this week
    let userVoteBoroughId = null;
    if (req.session.user) {
      const userId = new mongoose.Types.ObjectId(req.session.user.id);

      const existingVote = await voteCollection
        .findOne({ userId, weekStart })
        .lean();

      if (existingVote) {
        userVoteBoroughId = existingVote.boroughId.toString();
      }
    }

    /* Build the borough list shown in "Cast Your Vote"
       If the user has voted -> show ONLY their borough
       If not -> show all boroughs */
    let votingBoroughs;
    let userHasVoted = !!userVoteBoroughId;

    if (userHasVoted) {
      votingBoroughs = allBoroughs.filter(
        (b) => b._id.toString() === userVoteBoroughId
      );
    } else {
      votingBoroughs = allBoroughs;
    }

    return res.render("bestBorough", {
      bestBorough,
      boroughs: votingBoroughs,                 
      weekStart: weekStart.toDateString(),
      isAuthenticated: !!req.session.user,
      user: req.session.user || null,
      userHasVoted,                             
      toast
    });
  } catch (err) {
    console.error("Error loading best borough:", err);
    return res
      .status(500)
      .render("error", { error: "Could not load best borough." });
  }
});




export default router;
