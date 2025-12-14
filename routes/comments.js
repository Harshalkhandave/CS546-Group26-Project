import { Router } from 'express';
import commentData from '../data/comments.js';
import { commentCollection as Comment } from '../model/index.js';
import { isValidId } from '../helper/helper.js';

const router = Router();

const requireAuth = (req, res, next) => {
  if (!req.session.user) return res.status(401).json({ error: 'You must be logged in to perform this action.' });
  next();
};

router.get('/borough/:boroughId', async (req, res) => {
  try {
    const comments = await commentData.getCommentsByBorough(req.params.boroughId);
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.toString() });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const comment = await commentData.getCommentById(req.params.id);
    res.json(comment);
  } catch (e) {
    res.status(e.toString().includes('not found') ? 404 : 500).json({ error: e.toString() });
  }
});

router.post('/', requireAuth, async (req, res) => {
  try {
    const userId = req.session.user.id;
    const { boroughId, comment } = req.body;

    const created = await commentData.createComment(userId, boroughId, comment);

    const populatedComment = await Comment.findById(created._id)
      .populate('user', 'fname lname')
      .lean();

    res.status(201).json(populatedComment);
  } catch (e) {
    res.status(400).json({ error: e.toString() });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const commentId = isValidId(req.params.id);
    const comment = await Comment.findById(commentId).lean();
    if (!comment) return res.status(404).json({ error: 'Comment not found' });

    const userRole = req.session.user.role;
    const isOwner = comment.user.toString() === req.session.user.id;

    if (userRole !== 'admin' && !isOwner) {
      return res.status(403).json({ error: 'You do not have permission to delete this comment.' });
    }

    await commentData.deleteComment(commentId);
    res.json({ deleted: true });
  } catch (e) {
    res.status(e.toString().includes('not found') ? 404 : 500).json({ error: e.toString() });
  }
});

export default router;
