import { comments } from "../config/mongoCollections.js";
import { ObjectId } from "mongodb";
import {
    checkString,
    validateId
} from "../helper/helper.js";

const exportedMethods = {
    async createComment(userId, boroughId, comment) {
        userId = validateId(userId);
        boroughId = validateId(boroughId);
        comment = checkString(comment, "Comment");
        // Check the length
        if (comment.length > 200) throw "Comment must be 200 characters or less";

        const commentCollection = await comments();
        const newComment = {
            _id: new ObjectId(),
            user: new ObjectId(userId),
            borough: new ObjectId(boroughId),
            comment,
            commentDate: new Date()
        };

        const insertInfo = await commentCollection.insertOne(newComment);
        if (!insertInfo.insertedId) throw "Could not create comment";

        return this.getCommentById(insertInfo.insertedId.toString());
    },

    async getCommentById(id) {
        id = validateId(id);
        const _id = new ObjectId(id);
        const commentCollection = await comments();
        const comment = await commentCollection.findOne({ _id });
        if (!comment) throw "Comment not found";
        return comment;
    },

    
    async getCommentsByBorough(boroughId) {
        boroughId = validateId(boroughId);
        const _id = new ObjectId(boroughId);
        const commentCollection = await comments();

        return commentCollection.find({ borough: _id }).toArray();
    },

    async deleteComment(id) {
        id = validateId(id);
        const _id = new ObjectId(id);
        const commentCollection = await comments();
        const deletion = await commentCollection.findOneAndDelete({ _id });
        if (!deletion) throw "Comment not found";
        return true;
    }
};

export default exportedMethods;
