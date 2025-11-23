// src/models/Registration.js
import pool from "../config/db.js";

const Registration = {
  // Đăng ký tham gia
  async create(user_id, event_id) {
    const sql = `
      INSERT INTO Registrations (user_id, event_id, status) 
      VALUES (?, ?, 'pending')
    `;
    const [result] = await pool.execute(sql, [user_id, event_id]);
    return result.insertId;
  },

  // Hủy đăng ký (Ở đây dùng Soft Cancel (chuyển status = cancelled) để lưu lịch sử)
  async cancel(user_id, event_id) {
    const sql = `
      UPDATE Registrations 
      SET status = 'cancelled' 
      WHERE user_id = ? AND event_id = ? AND status IN ('pending', 'approved')
    `;
    const [result] = await pool.execute(sql, [user_id, event_id]);
    return result.affectedRows > 0;
  },

  // Kiểm tra trạng thái đăng ký của User với Event
  async findOne(user_id, event_id) {
    const sql = `
      SELECT * FROM Registrations 
      WHERE user_id = ? AND event_id = ?
    `;
    const [rows] = await pool.execute(sql, [user_id, event_id]);
    return rows[0];
  },

  // Lấy danh sách sự kiện user đã đăng ký (Lịch sử)
  async getHistoryByUserId(user_id) {
    const sql = `
      SELECT 
        r.registration_id, r.status as registration_status, r.registration_date,
        e.event_id, e.title, e.start_date, e.end_date, e.location,
        u.full_name as manager_name
      FROM Registrations r
      JOIN Events e ON r.event_id = e.event_id
      LEFT JOIN Users u ON e.manager_id = u.user_id
      WHERE r.user_id = ?
      ORDER BY r.registration_date DESC
    `;
    const [rows] = await pool.execute(sql, [user_id]);
    return rows;
  },
  
  // Đăng ký lại (Cập nhật trạng thái từ cancelled -> pending)
  async reRegister(user_id, event_id) {
    const sql = `
      UPDATE Registrations 
      SET status = 'pending', 
          registration_date = NOW()
      WHERE user_id = ? AND event_id = ?
    `;
    const [result] = await pool.execute(sql, [user_id, event_id]);
    return result.affectedRows > 0;
  }
};

export default Registration;