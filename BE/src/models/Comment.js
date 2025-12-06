import pool from "../config/db.js";

const Comment = {
  // Tạo bình luận mới
  async create({ post_id, user_id, content }) {
    const sql = `
      INSERT INTO Comments (post_id, user_id, content) 
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.execute(sql, [post_id, user_id, content]);
    return result.insertId;
  },

  // Lấy danh sách bình luận của 1 bài viết
  async getByPostId(post_id, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // Đếm tổng
    const [countResult] = await pool.execute(
      "SELECT COUNT(*) as total FROM Comments WHERE post_id = ?",
      [post_id]
    );
    const total = countResult[0].total;

    // Lấy dữ liệu
    const sql = `
      SELECT 
        c.comment_id, c.content, c.created_at,
        u.user_id, u.full_name, u.avatar_url,
        r.name as role_name
      FROM Comments c
      JOIN Users u ON c.user_id = u.user_id
      JOIN Roles r ON u.role_id = r.role_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC
      LIMIT ? OFFSET ?
    `;

    const [comments] = await pool.query(sql, [
      post_id,
      Number(limit),
      Number(offset),
    ]);

    return {
      comments,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  // Lấy chi tiết comment (Kèm thông tin Sự kiện cha để check quyền)
  async getById(comment_id) {
    const sql = `
      SELECT 
        c.*, 
        u.full_name, u.avatar_url,  -- <--- THÊM DÒNG NÀY QUAN TRỌNG
        p.event_id,
        e.manager_id as event_manager_id,
        e.is_deleted as event_is_deleted,
        e.approval_status as event_status
      FROM Comments c
      JOIN Users u ON c.user_id = u.user_id
      JOIN Posts p ON c.post_id = p.post_id
      JOIN Events e ON p.event_id = e.event_id
      WHERE c.comment_id = ?
    `;
    const [rows] = await pool.execute(sql, [comment_id]);
    return rows[0];
  },

  // Xóa bình luận
  async delete(comment_id) {
    const sql = "DELETE FROM Comments WHERE comment_id = ?";
    const [result] = await pool.execute(sql, [comment_id]);
    return result.affectedRows > 0;
  },
};

export default Comment;
