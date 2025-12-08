// src/models/Post.js
import pool from "../config/db.js";

const Post = {
  // Tạo bài đăng
  async create({ event_id, user_id, content }) {
    const sql = `INSERT INTO Posts (event_id, user_id, content) VALUES (?, ?, ?)`;
    const [result] = await pool.execute(sql, [event_id, user_id, content]);
    return result.insertId;
  },

  // Lấy danh sách bài đăng của 1 sự kiện (Có phân trang)
  async getByEventId(event_id, page = 1, limit = 10, current_user_id = null) {
    const offset = (page - 1) * limit;

    // Đếm tổng số bài viết để tính totalPages
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM Posts WHERE event_id = ?",
      [event_id]
    );
    const total = countResult[0].total;

    // Lấy dữ liệu bài đăng
    const sql = `
        SELECT 
            p.post_id, p.content, p.created_at,
            u.user_id, u.full_name, u.avatar_url,
            r.name as role_name,
            
            -- Đếm tổng số reaction
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id) as like_count,
            
            -- Đếm tổng số comment
            (SELECT COUNT(*) FROM Comments WHERE post_id = p.post_id) as comment_count,

            -- Kiểm tra user hiện tại đã react chưa (trả về type hoặc null)
            (SELECT reaction_type FROM PostReactions WHERE post_id = p.post_id AND user_id = ?) as current_reaction,
            
            -- Lấy thống kê từng loại (để hiển thị Stack Icon 3 cái)
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
        LIMIT ? OFFSET ?
    `;

    const [rows] = await pool.query(sql, [
      current_user_id,
      event_id,
      Number(limit),
      Number(offset),
    ]);

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
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Lấy chi tiết bài đăng (Kèm thông tin Manager của sự kiện để check quyền xóa)
  async getById(post_id) {
    const sql = `
        SELECT 
            p.*, 
            e.manager_id as event_manager_id,
            e.is_deleted as event_is_deleted, 
            e.approval_status as event_status
        FROM Posts p
        JOIN Events e ON p.event_id = e.event_id
        WHERE p.post_id = ?
        `;
    const [rows] = await pool.execute(sql, [post_id]);
    return rows[0];
  },

  // Xóa bài đăng
  async delete(post_id) {
    const sql = "DELETE FROM Posts WHERE post_id = ?";
    const [result] = await pool.execute(sql, [post_id]);
    return result.affectedRows > 0;
  },
};

export default Post;
