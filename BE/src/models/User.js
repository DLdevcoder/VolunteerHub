import pool from "../config/db.js";

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
    const offset = (page - 1) * limit;

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
      // Query chính
      const [users] = await pool.execute(
        `SELECT 
          u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
          r.name as role_name, u.status, u.created_at, u.updated_at
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      // Query tổng số records
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      return {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: total,
          has_next: page < totalPages,
          has_prev: page > 1,
        },
      };
    } catch (error) {
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
}

export default User;