import { Router } from 'express';
const router = Router();
import voteData from '../data/votes.js'; 

const requireLogin = (req, res, next) => {
  if (!req.session.user) return res.redirect('/users/login');
  next();
};

router.post('/', requireLogin, async (req, res) => {
  const { boroughId } = req.body;
  const userId = req.session.user.id;

  try {
    await voteData.addVote(userId, boroughId);

    req.session.toast = {
      type: 'message',
      message: 'Your vote has been recorded!'
    };
  } catch (e) {
    req.session.toast = {
      type: 'error',
      message: e.toString()
    };
  }
  
  // stay on Best Borough page after login
  return res.redirect('/votes/best');
});


// GET /votes/best 
router.get('/best', async (req, res) => {
  try {
    // Toast from session (for this page only)
    let toast = null;
    if (req.session.toast) {
      toast = req.session.toast;
      delete req.session.toast;
    }

    const bestBorough = await voteData.getBestBorough();
    const allBoroughs = await voteData.getAllBoroughs();
    const weekStart = new Date().toDateString();
    
    let userVoteBoroughId = null;
    let userHasVoted = false;
    let votingBoroughs = allBoroughs;

    if (req.session.user) {
      // Find which borough THIS user voted for this week
      userVoteBoroughId = await voteData.getUserVoteForWeek(req.session.user.id);
      
      if (userVoteBoroughId) {
        userHasVoted = true;

        /* Build the borough list shown in "Cast Your Vote"
           If the user has voted -> show ONLY their borough
           If not -> show all boroughs */
        votingBoroughs = allBoroughs.filter(
          b => b._id.toString() === userVoteBoroughId
        );
      }
    }

    res.render('bestBorough', {
      title: 'Vote for Best Borough',
      bestBorough,
      boroughs: votingBoroughs,
      weekStart,
      isAuthenticated: !!req.session.user,
      user: req.session.user || null,
      userHasVoted,
      toast,
      css: '/public/css/styles.css'
    });

  } catch (e) {
    console.error("Vote page error:", e);
    res.status(500).render('error', { error: "Could not load voting page." });
  }
});

export default router;
