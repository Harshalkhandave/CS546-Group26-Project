import express from 'express';
import commentData from '../data/comments.js';
import commentCollection from '../model/comment.js';

const router = express.Router();

// GET /comments/:id - get comment by id
router.get('/:id', async (req, res) => {
  try {
    const comment = await commentData.getCommentById(req.params.id);
    res.json(comment);
  } catch (e) {
    res.status(e.includes('not found') ? 404 : 500).json({ error: e.message || e });
  }
});

// GET /comments/borough/:boroughId - get all comments for a borough
router.get('/borough/:boroughId', async (req, res) => {
  try {
    const comments = await commentData.getCommentsByBorough(req.params.boroughId);
    res.json(comments);
  } catch (e) {
    res.status(500).json({ error: e.message || e });
  }
});

// POST /comments - create a comment
router.post('/', async (req, res) => {
  try {
    const { userId, boroughId, comment } = req.body;
    const created = await commentData.createComment(userId, boroughId, comment);
    res.status(201).json(created);
  } catch (e) {
    res.status(400).json({ error: e.message || e });
  }
});

// DELETE /comments/:id - delete comment
router.delete('/:id', async (req, res) => {
  try {
    await commentData.deleteComment(req.params.id);
    res.json({ deleted: true });
  } catch (e) {
    res.status(e.includes('not found') ? 404 : 500).json({ error: e.message || e });
  }
});

export default router;
