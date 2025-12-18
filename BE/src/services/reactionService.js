import sequelize from "../config/db.js";
import { PostReaction, CommentReaction } from "../models/Reaction.js";
import User from "../models/User.js";

class ReactionService {
  static async checkPostReaction(user_id, post_id) {
    return await PostReaction.findOne({ where: { user_id, post_id } });
  }

  static async addPostReaction(user_id, post_id, type) {
    return await PostReaction.create({ user_id, post_id, reaction_type: type });
  }

  static async removePostReaction(user_id, post_id) {
    return await PostReaction.destroy({ where: { user_id, post_id } });
  }

  static async countPostReactions(post_id) {
    return await PostReaction.count({ where: { post_id } });
  }

  static async getPostReactions(post_id, filterType = null) {
    try {
      const whereCondition = { post_id };
      if (filterType && filterType !== "all") {
        whereCondition.reaction_type = filterType;
      }

      const listPromise = PostReaction.findAll({
        where: whereCondition,
        order: [["created_at", "DESC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["user_id", "full_name", "avatar_url"],
          },
        ],
      });

      const summaryPromise = PostReaction.findAll({
        where: { post_id },
        attributes: [
          "reaction_type",
          [sequelize.fn("COUNT", sequelize.col("reaction_type")), "count"],
        ],
        group: ["reaction_type"],
        raw: true,
      });

      const [listResult, summaryResult] = await Promise.all([
        listPromise,
        summaryPromise,
      ]);

      const summary = { all: 0 };
      summaryResult.forEach((row) => {
        const count = Number(row.count);
        summary[row.reaction_type] = count;
        summary.all += count;
      });

      const flatList = listResult.map((r) => {
        const plain = r.get({ plain: true });
        return {
          user_id: plain.user?.user_id,
          full_name: plain.user?.full_name,
          avatar_url: plain.user?.avatar_url,
          reaction_type: plain.reaction_type,
          created_at: plain.created_at,
        };
      });

      return { reactions: flatList, summary };
    } catch (error) {
      throw new Error(`Service getPostReactions Error: ${error.message}`);
    }
  }

  static async checkCommentReaction(user_id, comment_id) {
    return await CommentReaction.findOne({ where: { user_id, comment_id } });
  }

  static async addCommentReaction(user_id, comment_id, type) {
    return await CommentReaction.create({
      user_id,
      comment_id,
      reaction_type: type,
    });
  }

  static async removeCommentReaction(user_id, comment_id) {
    return await CommentReaction.destroy({ where: { user_id, comment_id } });
  }

  static async countCommentReactions(comment_id) {
    return await CommentReaction.count({ where: { comment_id } });
  }

  static async getCommentReactions(comment_id, filterType = null) {
    try {
      const whereCondition = { comment_id };
      if (filterType && filterType !== "all") {
        whereCondition.reaction_type = filterType;
      }

      const listPromise = CommentReaction.findAll({
        where: whereCondition,
        order: [["created_at", "DESC"]],
        include: [
          {
            model: User,
            as: "user",
            attributes: ["user_id", "full_name", "avatar_url"],
          },
        ],
      });

      const summaryPromise = CommentReaction.findAll({
        where: { comment_id },
        attributes: [
          "reaction_type",
          [sequelize.fn("COUNT", sequelize.col("reaction_type")), "count"],
        ],
        group: ["reaction_type"],
        raw: true,
      });

      const [listResult, summaryResult] = await Promise.all([
        listPromise,
        summaryPromise,
      ]);

      const summary = { all: 0 };
      summaryResult.forEach((row) => {
        const count = Number(row.count);
        summary[row.reaction_type] = count;
        summary.all += count;
      });

      const flatList = listResult.map((r) => {
        const plain = r.get({ plain: true });
        return {
          user_id: plain.user?.user_id,
          full_name: plain.user?.full_name,
          avatar_url: plain.user?.avatar_url,
          reaction_type: plain.reaction_type,
          created_at: plain.created_at,
        };
      });

      return { reactions: flatList, summary };
    } catch (error) {
      throw new Error(`Service getCommentReactions Error: ${error.message}`);
    }
  }
}

export default ReactionService;