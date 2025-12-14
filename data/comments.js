import { commentCollection as Comment } from '../model/index.js';
import mongoose from 'mongoose';
import { checkString, isValidId } from '../helper/helper.js';

const exportedMethods = {
  async createComment(userId, boroughId, comment) {
    userId = isValidId(userId);
    boroughId = isValidId(boroughId);
    comment = checkString(comment, 'Comment');

    if (comment.length > 200) {
      throw 'Comment must be 200 characters or less';
    }

    const newComment = {
      user: new mongoose.Types.ObjectId(userId),
      borough: new mongoose.Types.ObjectId(boroughId),
      comment,
      commentDate: new Date()
    };

    const created = await Comment.create(newComment);
    if (!created) throw 'Could not create comment';

    return created;
  },

  async getCommentById(id) {
    id = isValidId(id);

    const comment = await Comment.findById(id);
    if (!comment) throw 'Comment not found';

    return comment;
  },

  async getCommentsByBorough(boroughId) {
    boroughId = isValidId(boroughId);

    return Comment.find({ borough: new mongoose.Types.ObjectId(boroughId) })
      .populate('user', 'fname lname')
      .sort({ commentDate: -1 })
      .lean();
  },

  async getCommentsByUser(userId) {
    userId = isValidId(userId);

    return Comment.find({ user: new mongoose.Types.ObjectId(userId) })
      .populate('borough', 'name')
      .sort({ commentDate: -1 })
      .lean();
  },

  async deleteComment(id) {
    id = isValidId(id);

    const deleted = await Comment.findByIdAndDelete(id);
    if (!deleted) throw 'Comment not found';

    return true;
  }
};

export default exportedMethods;
