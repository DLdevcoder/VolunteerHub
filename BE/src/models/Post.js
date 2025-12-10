import { DataTypes, Model, QueryTypes } from "sequelize";
import sequelize from "../config/db.js";

class Post extends Model {
  // =================================================================
  // CÁC HÀM STATIC (SERVICE LAYER)
  // =================================================================

  // Tạo bài đăng
  static async create({ event_id, user_id, content }) {
    try {
      const newPost = await super.create({
        event_id,
        user_id,
        content,
      });
      // Trả về ID để giống với logic cũ (result.insertId)
      return newPost.post_id;
    } catch (error) {
      throw new Error(`Database error in create post: ${error.message}`);
    }
  }

  // Lấy danh sách bài đăng của 1 sự kiện (Có phân trang & Thống kê Reaction)
  static async getByEventId(
    event_id,
    page = 1,
    limit = 10,
    current_user_id = null
  ) {
    try {
      const numPage = Number(page) || 1;
      const numLimit = Number(limit) || 10;
      const offset = (numPage - 1) * numLimit;

      // 1. Đếm tổng số bài viết
      const countResult = await sequelize.query(
        "SELECT COUNT(*) as total FROM Posts WHERE event_id = ?",
        {
          replacements: [event_id],
          type: QueryTypes.SELECT,
        }
      );
      const total = countResult[0]?.total || 0;

      // 2. Lấy dữ liệu bài đăng (kèm sub-query đếm reaction)
      const rows = await sequelize.query(
        `SELECT 
            p.post_id, p.content, p.created_at,
            u.user_id, u.full_name, u.avatar_url,
            r.name as role_name,
            
            -- Đếm tổng số reaction
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id) as like_count,
            
            -- Đếm tổng số comment
            (SELECT COUNT(*) FROM Comments WHERE post_id = p.post_id) as comment_count,

            -- Kiểm tra user hiện tại đã react chưa
            (SELECT reaction_type FROM PostReactions WHERE post_id = p.post_id AND user_id = ?) as current_reaction,
            
            -- Lấy thống kê từng loại
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id AND reaction_type='like') as count_like,
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id AND reaction_type='love') as count_love,
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id AND reaction_type='haha') as count_haha,
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id AND reaction_type='wow') as count_wow,
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id AND reaction_type='sad') as count_sad,
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id AND reaction_type='angry') as count_angry

         FROM Posts p
         JOIN Users u ON p.user_id = u.user_id
         JOIN Roles r ON u.role_id = r.role_id
         WHERE p.event_id = ?
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        {
          // Thứ tự tham số phải khớp với dấu ? trong câu SQL
          replacements: [current_user_id, event_id, numLimit, offset],
          type: QueryTypes.SELECT,
        }
      );

      // 3. Map dữ liệu để gom nhóm reaction_stats (Logic cũ)
      const posts = rows.map((post) => ({
        ...post,
        reaction_stats: {
          like: post.count_like,
          love: post.count_love,
          haha: post.count_haha,
          wow: post.count_wow,
          sad: post.count_sad,
          angry: post.count_angry,
        },
      }));

      return {
        posts: posts,
        pagination: {
          total,
          page: numPage,
          limit: numLimit,
          totalPages: Math.ceil(total / numLimit),
        },
      };
    } catch (error) {
      throw new Error(`Database error in getByEventId: ${error.message}`);
    }
  }

  // Lấy chi tiết bài đăng
  static async getById(post_id) {
    try {
      const rows = await sequelize.query(
        `SELECT 
            p.*, 
            e.manager_id as event_manager_id,
            e.is_deleted as event_is_deleted, 
            e.approval_status as event_status
         FROM Posts p
         JOIN Events e ON p.event_id = e.event_id
         WHERE p.post_id = ?`,
        {
          replacements: [post_id],
          type: QueryTypes.SELECT,
        }
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Database error in getById post: ${error.message}`);
    }
  }

  // Xóa bài đăng
  static async delete(post_id) {
    try {
      const deletedCount = await super.destroy({
        where: { post_id: post_id },
      });
      return deletedCount > 0;
    } catch (error) {
      throw new Error(`Database error in delete post: ${error.message}`);
    }
  }
}

// =================================================================
// CẤU HÌNH SCHEMA
// =================================================================
Post.init(
  {
    post_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    event_id: {
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
    // created_at, updated_at tự động
  },
  {
    sequelize,
    modelName: "Post",
    tableName: "Posts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Post;
