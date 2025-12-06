import { commentCollection } from "../model/index.js";
import mongoose from "mongoose";
import {
    checkString,
    validateId
} from "../helper/helper.js";

const exportedMethods = {
    async createComment(userId, boroughId, comment) {
        userId = validateId(userId);
        boroughId = validateId(boroughId);
        comment = checkString(comment, "Comment");
        if (comment.length > 200) {
            throw "Comment must be 200 characters or less";
        }
        const newComment = {
            user: new mongoose.Types.ObjectId(userId),
            borough: new mongoose.Types.ObjectId(boroughId),
            comment,
            commentDate: new Date()
        };
        const created = await commentCollection.create(newComment);
        if (!created) throw "Could not create comment";
        return created;
    },

    async getCommentById(id) {
        id = validateId(id);
        const comment = await commentCollection.findById(id);
        if (!comment) throw "Comment not found";
        return comment;
    },

    async getCommentsByBorough(boroughId) {
        boroughId = validateId(boroughId);
        return await commentCollection.find({
            borough: new mongoose.Types.ObjectId(boroughId)
        });
    },

    async deleteComment(id) {
        id = validateId(id);
        const deleted = await commentCollection.findByIdAndDelete(id);
        if (!deleted) throw "Comment not found";
        return true;
    }
};

export default exportedMethods;
