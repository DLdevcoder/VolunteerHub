import pool from "../config/db.js";
import bcrypt from "bcryptjs";

class User {
  // Lấy user by ID với role name
  static async findById(user_id) {
    try {
      const [users] = await pool.execute(
        `SELECT 
          u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
          r.name as role_name, u.status, u.created_at, u.updated_at
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         WHERE u.user_id = ?`,
        [user_id]
      );
      return users[0] || null;
    } catch (error) {
      throw new Error(`Database error in findById: ${error.message}`);
    }
  }

  // Lấy user by email (cho login)
  static async findByEmail(email) {
    try {
      const [users] = await pool.execute(
        `SELECT 
          u.user_id, u.email, u.password_hash, u.full_name, u.phone, u.avatar_url,
          r.name as role_name, u.status, u.created_at, u.updated_at
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         WHERE u.email = ?`,
        [email]
      );
      return users[0] || null;
    } catch (error) {
      throw new Error(`Database error in findByEmail: ${error.message}`);
    }
  }

  // Tạo user mới
  static async create(userData) {
    const { email, password_hash, full_name, phone, role_id } = userData;

    try {
      const [result] = await pool.execute(
        `INSERT INTO Users (email, password_hash, full_name, phone, role_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [email, password_hash, full_name, phone, role_id]
      );

      return result.insertId;
    } catch (error) {
      throw new Error(`Database error in create: ${error.message}`);
    }
  }

  // Cập nhật thông tin user
  static async update(user_id, updateData) {
    const { full_name, phone, avatar_url } = updateData;
    const allowedFields = { full_name, phone, avatar_url };

    // Lọc ra các field có giá trị
    const fieldsToUpdate = Object.entries(allowedFields)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, _]) => `${key} = ?`);

    if (fieldsToUpdate.length === 0) {
      throw new Error("No valid fields to update");
    }

    const values = Object.entries(allowedFields)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([_, value]) => value);

    values.push(user_id);

    try {
      const [result] = await pool.execute(
        `UPDATE Users 
         SET ${fieldsToUpdate.join(", ")}, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in update: ${error.message}`);
    }
  }

  // Cập nhật status user
  static async updateStatus(user_id, status) {
    try {
      const [result] = await pool.execute(
        `UPDATE Users 
         SET status = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [status, user_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in updateStatus: ${error.message}`);
    }
  }

  // Lấy danh sách users với pagination và filter
  static async findAll({
    page = 1,
    limit = 10,
    search = "",
    role = "",
    status = "",
  } = {}) {
    // Ép kiểu an toàn
    const numPage = Number(page);
    const safePage = Number.isInteger(numPage) && numPage > 0 ? numPage : 1;

    const numLimit = Number(limit);
    const safeLimit =
      Number.isInteger(numLimit) && numLimit > 0 ? numLimit : 10;

    const offset = (safePage - 1) * safeLimit;

    // Xây dựng query động
    let whereConditions = [];
    let queryParams = [];

    if (search) {
      whereConditions.push("(u.full_name LIKE ? OR u.email LIKE ?)");
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    if (role) {
      whereConditions.push("r.name = ?");
      queryParams.push(role);
    }

    if (status) {
      whereConditions.push("u.status = ?");
      queryParams.push(status);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    try {
      // ====== Query danh sách ======
      const listSql = `
      SELECT 
        u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
        r.name as role_name, u.status, u.created_at, u.updated_at
      FROM Users u 
      JOIN Roles r ON u.role_id = r.role_id 
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

      const [users] = await pool.execute(listSql, queryParams);

      // ====== Query tổng records ======
      const countSql = `
      SELECT COUNT(*) as total
      FROM Users u 
      JOIN Roles r ON u.role_id = r.role_id 
      ${whereClause}
    `;
      const [countResult] = await pool.execute(countSql, queryParams);

      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / safeLimit);

      return {
        users,
        pagination: {
          current_page: safePage,
          total_pages: totalPages,
          total_records: total,
          has_next: safePage < totalPages,
          has_prev: safePage > 1,
          limit: safeLimit,
        },
      };
    } catch (error) {
      console.error("User.findAll error SQL:", error);
      throw new Error(`Database error in findAll: ${error.message}`);
    }
  }

  // Kiểm tra email đã tồn tại
  static async emailExists(email) {
    try {
      const [users] = await pool.execute(
        "SELECT user_id FROM Users WHERE email = ?",
        [email]
      );
      return users.length > 0;
    } catch (error) {
      throw new Error(`Database error in emailExists: ${error.message}`);
    }
  }

  // Lấy role_id từ role_name
  static async getRoleId(role_name) {
    try {
      const [roles] = await pool.execute(
        "SELECT role_id FROM Roles WHERE name = ?",
        [role_name]
      );
      return roles[0]?.role_id || null;
    } catch (error) {
      throw new Error(`Database error in getRoleId: ${error.message}`);
    }
  }

  // Đổi mật khẩu
  static async changePassword(user_id, current_password, new_password) {
    try {
      // Lấy thông tin user hiện tại để kiểm tra mật khẩu cũ
      const [users] = await pool.execute(
        `SELECT password_hash FROM Users WHERE user_id = ?`,
        [user_id]
      );

      if (users.length === 0) {
        throw new Error("User không tồn tại");
      }

      const user = users[0];

      // Kiểm tra mật khẩu hiện tại
      const isPasswordValid = await bcrypt.compare(
        current_password,
        user.password_hash
      );
      if (!isPasswordValid) {
        throw new Error("Mật khẩu hiện tại không đúng");
      }

      // Mã hóa mật khẩu mới
      const saltRounds = 12;
      const new_password_hash = await bcrypt.hash(new_password, saltRounds);

      // Cập nhật mật khẩu mới
      const [result] = await pool.execute(
        `UPDATE Users 
             SET password_hash = ?, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = ?`,
        [new_password_hash, user_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in changePassword: ${error.message}`);
    }
  }

  // Lấy danh sách admin (dùng để gửi notification duyệt sự kiện)
  static async getAdmins() {
    try {
      const [rows] = await pool.execute(
        `SELECT 
         u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
         r.name as role_name, u.status, u.created_at, u.updated_at
       FROM Users u
       JOIN Roles r ON u.role_id = r.role_id
       WHERE r.name = 'Admin'`
        // Nếu bạn có cột status và muốn chỉ lấy active:
        // AND u.status = 'active'
      );

      return rows; // mảng admin
    } catch (error) {
      throw new Error(`Database error in getAdmins: ${error.message}`);
    }
  }

  // Cập nhật role (role_id) cho user
  static async updateRole(user_id, role_id) {
    try {
      const [result] = await pool.execute(
        `UPDATE Users 
         SET role_id = ?, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ?`,
        [role_id, user_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in updateRole: ${error.message}`);
    }
  }
}

export default User;
