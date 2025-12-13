import { voteCollection, boroughCollection } from "../model/index.js";
import { isValidId, getCurrentWeekStart } from "../helper/helper.js";

const exportedMethods = {
  async addVote(userId, boroughId) {
    userId = isValidId(userId);
    boroughId = isValidId(boroughId);

    const borough = await boroughCollection.findById(boroughId);
    if (!borough) throw "Borough not found";

    const weekStart = getCurrentWeekStart();

    try {
      // 1 vote per user per week
      const newVote = await voteCollection.create({
        userId,
        boroughId,
        weekStart
      });
      return newVote;
    } catch (e) {
      if (e.code === 11000) {
        throw "You have already voted for a borough this week.";
      }
      throw e;
    }
  },

  async getBestBorough() {
    const weekStart = getCurrentWeekStart();

    // Winner for this week
    const agg = await voteCollection.aggregate([
      { $match: { weekStart } },
      { $group: { _id: "$boroughId", count: { $sum: 1 } } },
      //Prevent multiple best borough
      { $sort: { count: -1, _id: 1 } },
      { $limit: 1 }
    ]);

    if (agg.length === 0) return null;

    const borough = await boroughCollection.findById(agg[0]._id);
    if (!borough) return null;

    return {
      name: borough.name,
      description: borough.description,
      voteCount: agg[0].count
    };
  },

  async getUserVoteForWeek(userId) {
    userId = isValidId(userId);
    const weekStart = getCurrentWeekStart();

    // Find which borough THIS user voted for this week
    const vote = await voteCollection.findOne({ userId, weekStart });
    return vote ? vote.boroughId.toString() : null;
  },

  async getAllBoroughs() {
    // Get all boroughs
    return await boroughCollection.find({}).lean();
  }
};

export default exportedMethods;
