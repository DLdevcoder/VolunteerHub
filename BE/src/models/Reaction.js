import pool from "../config/db.js";

const Reaction = {
  // Kiểm tra xem user đã thả Reaction chưa
  async checkPostReaction(user_id, post_id) {
    const sql = `SELECT * FROM PostReactions WHERE user_id = ? AND post_id = ?`;
    const [rows] = await pool.execute(sql, [user_id, post_id]);
    return rows[0];
  },

  // Thêm Reaction mới 
  async addPostReaction(user_id, post_id, type) {
    const sql = `INSERT INTO PostReactions (user_id, post_id, reaction_type) VALUES (?, ?, ?)`;
    await pool.execute(sql, [user_id, post_id, type]);
  },

  // Xóa Reaction (Gỡ bỏ)
  async removePostReaction(user_id, post_id) {
    const sql = `DELETE FROM PostReactions WHERE user_id = ? AND post_id = ?`;
    await pool.execute(sql, [user_id, post_id]);
  },

  // Đếm tổng số lượng Reactions của bài viết
  async countPostReactions(post_id) {
    const sql = `SELECT COUNT(*) as total FROM PostReactions WHERE post_id = ?`;
    const [rows] = await pool.execute(sql, [post_id]);
    return rows[0].total;
  },

  // Lấy danh sách Reactions của bài viết (Kèm thống kê chi tiết)
  async getPostReactions(post_id, filterType = null) {
    const countSql = `
      SELECT reaction_type, COUNT(*) as count
      FROM PostReactions
      WHERE post_id = ?
      GROUP BY reaction_type
    `;

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

    if (filterType && filterType !== 'all') {
      listSql += ` AND pr.reaction_type = ?`;
      params.push(filterType);
    }

    listSql += ` ORDER BY pr.created_at DESC`;

    const [listResult, countResult] = await Promise.all([
      pool.execute(listSql, params),
      pool.execute(countSql, [post_id])
    ]);

    const summary = { all: 0 };
    countResult[0].forEach(row => {
      summary[row.reaction_type] = row.count;
      summary.all += row.count;
    });

    return {
      reactions: listResult[0],
      summary: summary
    };
  },

  // Kiểm tra xem user đã Reactions comment chưa
  async checkCommentReaction(user_id, comment_id) {
    const sql = `SELECT * FROM CommentReactions WHERE user_id = ? AND comment_id = ?`;
    const [rows] = await pool.execute(sql, [user_id, comment_id]);
    return rows[0];
  },

  // Thêm Reactions Comment
  async addCommentReaction(user_id, comment_id, type) {
    const sql = `INSERT INTO CommentReactions (user_id, comment_id, reaction_type) VALUES (?, ?, ?)`;
    await pool.execute(sql, [user_id, comment_id, type]);
  },

  // Bỏ Reactions Comment
  async removeCommentReaction(user_id, comment_id) {
    const sql = `DELETE FROM CommentReactions WHERE user_id = ? AND comment_id = ?`;
    await pool.execute(sql, [user_id, comment_id]);
  },

  // Đếm số Reactions comment
  async countCommentReactions(comment_id) {
    const sql = `SELECT COUNT(*) as total FROM CommentReactions WHERE comment_id = ?`;
    const [rows] = await pool.execute(sql, [comment_id]);
    return rows[0].total;
  },

  // Lấy danh sách Post Reaction (Có lọc + Thống kê)
  async getCommentReactions(comment_id, filterType = null) {
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

    if (filterType && filterType !== 'all') {
      listSql += ` AND cr.reaction_type = ?`;
      params.push(filterType);
    }

    listSql += ` ORDER BY cr.created_at DESC`;

    const [listResult, countResult] = await Promise.all([
      pool.execute(listSql, params),
      pool.execute(countSql, [comment_id])
    ]);

    const summary = { all: 0 };
    countResult[0].forEach(row => {
      summary[row.reaction_type] = row.count;
      summary.all += row.count;
    });

    return {
      reactions: listResult[0],
      summary: summary
    };
  }
};

export default Reaction;