import { DataTypes, Model, QueryTypes } from "sequelize";
import sequelize from "../config/db.js";

class Comment extends Model {
  // =================================================================
  // CÁC HÀM STATIC (LOGIC NGHIỆP VỤ)
  // =================================================================

  // Tạo bình luận mới
  static async create({ post_id, user_id, content }) {
    try {
      // Sử dụng phương thức create của Sequelize
      const newComment = await super.create({
        post_id,
        user_id,
        content,
      });

      // Trả về ID để tương thích với logic cũ (result.insertId)
      return newComment.comment_id;
    } catch (error) {
      throw new Error(`Database error in create comment: ${error.message}`);
    }
  }

  // Lấy danh sách bình luận của 1 bài viết (Phân trang + Join User/Role)
  static async getByPostId(post_id, page = 1, limit = 20) {
    try {
      const numPage = Number(page) || 1;
      const numLimit = Number(limit) || 20;
      const offset = (numPage - 1) * numLimit;

      // 1. Đếm tổng số comments
      const countResult = await sequelize.query(
        "SELECT COUNT(*) as total FROM Comments WHERE post_id = ?",
        {
          replacements: [post_id],
          type: QueryTypes.SELECT,
        }
      );
      const total = countResult[0]?.total || 0;

      // 2. Lấy dữ liệu chi tiết
      // Dùng Raw Query để Join và lấy đúng các trường phẳng (role_name)
      const comments = await sequelize.query(
        `SELECT 
          c.comment_id, c.content, c.created_at,
          u.user_id, u.full_name, u.avatar_url,
          r.name as role_name
         FROM Comments c
         JOIN Users u ON c.user_id = u.user_id
         JOIN Roles r ON u.role_id = r.role_id
         WHERE c.post_id = ?
         ORDER BY c.created_at ASC
         LIMIT ? OFFSET ?`,
        {
          replacements: [post_id, numLimit, offset],
          type: QueryTypes.SELECT,
        }
      );

      return {
        comments,
        pagination: {
          total,
          page: numPage,
          limit: numLimit,
          totalPages: Math.ceil(total / numLimit),
        },
      };
    } catch (error) {
      throw new Error(`Database error in getByPostId: ${error.message}`);
    }
  }

  // Lấy chi tiết comment (Kèm thông tin User và Sự kiện cha để check quyền)
  static async getById(comment_id) {
    try {
      const rows = await sequelize.query(
        `SELECT 
           c.*, 
           u.full_name, u.avatar_url,
           p.event_id,
           e.manager_id as event_manager_id,
           e.is_deleted as event_is_deleted,
           e.approval_status as event_status
         FROM Comments c
         JOIN Users u ON c.user_id = u.user_id
         JOIN Posts p ON c.post_id = p.post_id
         JOIN Events e ON p.event_id = e.event_id
         WHERE c.comment_id = ?`,
        {
          replacements: [comment_id],
          type: QueryTypes.SELECT,
        }
      );

      return rows[0] || null;
    } catch (error) {
      throw new Error(`Database error in getById comment: ${error.message}`);
    }
  }

  // Xóa bình luận
  static async delete(comment_id) {
    try {
      // Sử dụng phương thức destroy của Sequelize
      const deletedCount = await super.destroy({
        where: { comment_id: comment_id },
      });

      return deletedCount > 0;
    } catch (error) {
      throw new Error(`Database error in delete comment: ${error.message}`);
    }
  }
}

// =================================================================
// CẤU HÌNH SCHEMA
// =================================================================
Comment.init(
  {
    comment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    // created_at, updated_at tự động bởi timestamps: true
  },
  {
    sequelize,
    modelName: "Comment",
    tableName: "Comments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Comment;
