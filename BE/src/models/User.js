import pool from "../config/db.js";

const User = {
  // Tìm user theo email (bao gồm password_hash để xác thực đăng nhập)
  async getUserByEmailWithPassword(email) {
    const [users] = await pool.execute(
      `SELECT u.user_id, u.email, u.password_hash, u.full_name, u.phone, 
              u.avatar_url, r.name as role_name, u.status 
       FROM Users u 
       JOIN Roles r ON u.role_id = r.role_id 
       WHERE u.email = ?`,
      [email]
    );
    return users.length > 0 ? users[0] : null;
  },

  // Lấy thông tin user theo ID (kèm role và created_at, không có password)
  async getUserByIdWithRole(user_id) {
    const [users] = await pool.execute(
      `SELECT u.user_id, u.email, u.full_name, u.phone, 
              u.avatar_url, r.name as role_name, u.status, u.created_at
       FROM Users u 
       JOIN Roles r ON u.role_id = r.role_id 
       WHERE u.user_id = ?`,
      [user_id]
    );
    return users.length > 0 ? users[0] : null;
  },

  // Kiểm tra email đã tồn tại trong hệ thống
  async checkEmailExists(email) {
    const [users] = await pool.execute(
      "SELECT user_id FROM Users WHERE email = ?",
      [email]
    );
    return users.length > 0;
  },

  // Tạo user mới và trả về user_id
  async createNewUser(userData) {
    const { email, password_hash, full_name, phone, role_id } = userData;
    const [result] = await pool.execute(
      "INSERT INTO Users (email, password_hash, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?)",
      [email, password_hash, full_name, phone, role_id]
    );
    return result.insertId;
  },

  // Lấy role_id từ tên role
  async getRoleId(role_name) {
    const [roles] = await pool.execute(
      "SELECT role_id FROM Roles WHERE name = ?",
      [role_name]
    );
    return roles.length > 0 ? roles[0].role_id : null;
  },
};

export default User;