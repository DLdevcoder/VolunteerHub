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

  // Lấy người dùng đăng ký của 1 sự kiện
  async getByEventId(event_id) {
    const sql = `
      SELECT 
        r.registration_id, 
        r.status, 
        r.registration_date, 
        r.rejection_reason,
        -- Lấy thông tin người dùng để hiển thị
        u.user_id, 
        u.full_name, 
        u.email, 
        u.phone, 
        u.avatar_url
      FROM Registrations r
      JOIN Users u ON r.user_id = u.user_id
      WHERE r.event_id = ?
      ORDER BY r.registration_date DESC
    `;
    const [rows] = await pool.execute(sql, [event_id]);
    return rows;
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
  }, 

  // Đếm tổng số lượng đã đăng ký (bao gồm cả Pending và Approved)
  async countRequests(event_id) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as total FROM Registrations 
       WHERE event_id = ? AND status IN ('pending', 'approved')`,
      [event_id]
    );
    return rows[0].total;
  },

  // Lấy chi tiết đăng ký kèm thông tin Manager của sự kiện
  // Dùng để Controller kiểm tra xem Manager đang thao tác có phải chủ sự kiện không
  async getDetailById(registration_id) {
    const sql = `
      SELECT 
        r.registration_id, 
        r.status, 
        r.user_id,       
        r.event_id,
        
        e.title as event_title, 
        e.manager_id,
        e.start_date, 
        e.end_date, 
        e.target_participants, 
        e.current_participants,
        e.is_deleted as event_is_deleted,
        u.full_name as volunteer_name,
        u.email as volunteer_email,
        u.status as user_status
      FROM Registrations r
      JOIN Events e ON r.event_id = e.event_id
      JOIN Users u ON r.user_id = u.user_id
      WHERE r.registration_id = ?
    `;
    
    const [rows] = await pool.execute(sql, [registration_id]);
    return rows[0];
  },

  // Duyệt đăng ký
  async approve(registration_id) {
    const sql = "UPDATE Registrations SET status = 'approved', rejection_reason = NULL WHERE registration_id = ?";
    const [result] = await pool.execute(sql, [registration_id]);
    return result.affectedRows > 0;
  },

  // Từ chối đăng ký
  async reject(registration_id, reason) {
    const sql = "UPDATE Registrations SET status = 'rejected', rejection_reason = ? WHERE registration_id = ?";
    const [result] = await pool.execute(sql, [reason, registration_id]);
    return result.affectedRows > 0;
  },

  // Đánh dấu hoàn thành
  async complete(registration_id, manager_id) {
    const sql = `
      UPDATE Registrations 
      SET status = 'completed', 
          completed_by_manager_id = ?, 
          completion_date = NOW() 
      WHERE registration_id = ?
    `;
    const [result] = await pool.execute(sql, [manager_id, registration_id]);
    return result.affectedRows > 0;
  }
};

export default Registration;