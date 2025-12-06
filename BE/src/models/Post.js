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
  async getByEventId(event_id, page = 1, limit = 10) {
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
                    r.name as role_name
                FROM Posts p
                JOIN Users u ON p.user_id = u.user_id
                JOIN Roles r ON u.role_id = r.role_id
                WHERE p.event_id = ?
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
                `;

    const [rows] = await pool.query(sql, [
      event_id,
      Number(limit),
      Number(offset),
    ]);

    return {
      posts: rows,
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
