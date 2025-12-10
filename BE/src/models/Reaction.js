import { DataTypes, Model, QueryTypes } from "sequelize";
import sequelize from "../config/db.js";

// =================================================================
// 1. ĐỊNH NGHĨA MODEL: PostReaction
// =================================================================
class PostReaction extends Model {}
PostReaction.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    post_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    reaction_type: {
      type: DataTypes.ENUM("like", "love", "haha", "sad", "angry"),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "PostReaction",
    tableName: "PostReactions",
    timestamps: false, // Bảng này tự quản lý created_at, không có updated_at
  }
);

// =================================================================
// 2. ĐỊNH NGHĨA MODEL: CommentReaction
// =================================================================
class CommentReaction extends Model {}
CommentReaction.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    comment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    reaction_type: {
      type: DataTypes.ENUM("like", "love", "haha", "sad", "angry"),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "CommentReaction",
    tableName: "CommentReactions",
    timestamps: false,
  }
);

// =================================================================
// 3. SERVICE CLASS (LOGIC NGHIỆP VỤ)
// =================================================================
class Reaction {
  // -------------------------------------------------------------
  // PHẦN XỬ LÝ POST REACTION
  // -------------------------------------------------------------

  // Kiểm tra xem user đã thả Reaction chưa
  static async checkPostReaction(user_id, post_id) {
    try {
      const reaction = await PostReaction.findOne({
        where: { user_id, post_id },
      });
      return reaction;
    } catch (error) {
      throw new Error(`Database error in checkPostReaction: ${error.message}`);
    }
  }

  // Thêm Reaction mới
  static async addPostReaction(user_id, post_id, type) {
    try {
      await PostReaction.create({
        user_id,
        post_id,
        reaction_type: type,
      });
    } catch (error) {
      throw new Error(`Database error in addPostReaction: ${error.message}`);
    }
  }

  // Xóa Reaction (Gỡ bỏ)
  static async removePostReaction(user_id, post_id) {
    try {
      await PostReaction.destroy({
        where: { user_id, post_id },
      });
    } catch (error) {
      throw new Error(`Database error in removePostReaction: ${error.message}`);
    }
  }

  // Đếm tổng số lượng Reactions của bài viết
  static async countPostReactions(post_id) {
    try {
      const count = await PostReaction.count({
        where: { post_id },
      });
      return count;
    } catch (error) {
      throw new Error(`Database error in countPostReactions: ${error.message}`);
    }
  }

  // Lấy danh sách Reactions của bài viết (Kèm thống kê chi tiết)
  static async getPostReactions(post_id, filterType = null) {
    try {
      // Query thống kê (Summary)
      const countSql = `
        SELECT reaction_type, COUNT(*) as count
        FROM PostReactions
        WHERE post_id = ?
        GROUP BY reaction_type
      `;

      // Query danh sách chi tiết (List)
      let listSql = `
        SELECT 
          u.user_id, u.full_name, u.avatar_url, 
          pr.reaction_type, 
          pr.created_at
        FROM PostReactions pr
        JOIN Users u ON pr.user_id = u.user_id
        WHERE pr.post_id = ?
      `;

      const params = [post_id];

      if (filterType && filterType !== "all") {
        listSql += ` AND pr.reaction_type = ?`;
        params.push(filterType);
      }

      listSql += ` ORDER BY pr.created_at DESC`;

      // Chạy song song 2 query
      const [listResult, countResult] = await Promise.all([
        sequelize.query(listSql, {
          replacements: params,
          type: QueryTypes.SELECT,
        }),
        sequelize.query(countSql, {
          replacements: [post_id],
          type: QueryTypes.SELECT,
        }),
      ]);

      // Xử lý dữ liệu summary
      const summary = { all: 0 };
      countResult.forEach((row) => {
        summary[row.reaction_type] = row.count;
        summary.all += row.count;
      });

      return {
        reactions: listResult,
        summary: summary,
      };
    } catch (error) {
      throw new Error(`Database error in getPostReactions: ${error.message}`);
    }
  }

  // -------------------------------------------------------------
  // PHẦN XỬ LÝ COMMENT REACTION
  // -------------------------------------------------------------

  // Kiểm tra xem user đã Reactions comment chưa
  static async checkCommentReaction(user_id, comment_id) {
    try {
      const reaction = await CommentReaction.findOne({
        where: { user_id, comment_id },
      });
      return reaction;
    } catch (error) {
      throw new Error(
        `Database error in checkCommentReaction: ${error.message}`
      );
    }
  }

  // Thêm Reactions Comment
  static async addCommentReaction(user_id, comment_id, type) {
    try {
      await CommentReaction.create({
        user_id,
        comment_id,
        reaction_type: type,
      });
    } catch (error) {
      throw new Error(`Database error in addCommentReaction: ${error.message}`);
    }
  }

  // Bỏ Reactions Comment
  static async removeCommentReaction(user_id, comment_id) {
    try {
      await CommentReaction.destroy({
        where: { user_id, comment_id },
      });
    } catch (error) {
      throw new Error(
        `Database error in removeCommentReaction: ${error.message}`
      );
    }
  }

  // Đếm số Reactions comment
  static async countCommentReactions(comment_id) {
    try {
      const count = await CommentReaction.count({
        where: { comment_id },
      });
      return count;
    } catch (error) {
      throw new Error(
        `Database error in countCommentReactions: ${error.message}`
      );
    }
  }

  // Lấy danh sách Comment Reaction (Có lọc + Thống kê)
  static async getCommentReactions(comment_id, filterType = null) {
    try {
      const countSql = `
        SELECT reaction_type, COUNT(*) as count
        FROM CommentReactions
        WHERE comment_id = ?
        GROUP BY reaction_type
      `;

      let listSql = `
        SELECT 
          u.user_id, u.full_name, u.avatar_url, 
          cr.reaction_type, 
          cr.created_at
        FROM CommentReactions cr
        JOIN Users u ON cr.user_id = u.user_id
        WHERE cr.comment_id = ?
      `;

      const params = [comment_id];

      if (filterType && filterType !== "all") {
        listSql += ` AND cr.reaction_type = ?`;
        params.push(filterType);
      }

      listSql += ` ORDER BY cr.created_at DESC`;

      const [listResult, countResult] = await Promise.all([
        sequelize.query(listSql, {
          replacements: params,
          type: QueryTypes.SELECT,
        }),
        sequelize.query(countSql, {
          replacements: [comment_id],
          type: QueryTypes.SELECT,
        }),
      ]);

      const summary = { all: 0 };
      countResult.forEach((row) => {
        summary[row.reaction_type] = row.count;
        summary.all += row.count;
      });

      return {
        reactions: listResult,
        summary: summary,
      };
    } catch (error) {
      throw new Error(
        `Database error in getCommentReactions: ${error.message}`
      );
    }
  }
}

export default Reaction;
