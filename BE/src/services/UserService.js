import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";
import bcrypt from "bcryptjs";
import User from "../models/User.js"; // Import Model vừa tạo

class UserService {
  // Lấy user by ID (giữ nguyên logic trả về role_name dạng phẳng)
  static async findById(user_id) {
    try {
      const users = await sequelize.query(
        `SELECT 
          u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
          r.name as role_name, u.status, u.created_at, u.updated_at
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         WHERE u.user_id = ?`,
        {
          replacements: [user_id],
          type: QueryTypes.SELECT,
        }
      );
      return users[0] || null;
    } catch (error) {
      throw new Error(`Service error in findById: ${error.message}`);
    }
  }

  // Lấy user by email (cho login)
  static async findByEmail(email) {
    try {
      const users = await sequelize.query(
        `SELECT 
          u.user_id, u.email, u.password_hash, u.full_name, u.phone, u.avatar_url,
          r.name as role_name, u.status, u.created_at, u.updated_at
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         WHERE u.email = ?`,
        {
          replacements: [email],
          type: QueryTypes.SELECT,
        }
      );
      return users[0] || null;
    } catch (error) {
      throw new Error(`Service error in findByEmail: ${error.message}`);
    }
  }

  // Tạo user mới (Dùng ORM)
  static async create(userData) {
    try {
      // Logic hash password đã được gộp vào luồng tạo mới cho gọn
      // Nếu controller của bạn đã hash rồi thì có thể bỏ dòng này
      // Nhưng để đúng chuẩn Service thì nên xử lý ở đây nếu chưa có.
      // Giả sử userData đã có password_hash sẵn như code cũ:

      const newUser = await User.create({
        email: userData.email,
        password_hash: userData.password_hash,
        full_name: userData.full_name,
        phone: userData.phone,
        role_id: userData.role_id,
      });

      return newUser.user_id;
    } catch (error) {
      throw new Error(`Service error in create: ${error.message}`);
    }
  }

  // Cập nhật thông tin
  static async update(user_id, updateData) {
    try {
      const allowedFields = ["full_name", "phone", "avatar_url"];
      const dataToUpdate = {};

      Object.keys(updateData).forEach((key) => {
        if (
          allowedFields.includes(key) &&
          updateData[key] !== undefined &&
          updateData[key] !== null
        ) {
          dataToUpdate[key] = updateData[key];
        }
      });

      if (Object.keys(dataToUpdate).length === 0) {
        throw new Error("No valid fields to update");
      }

      const [affectedCount] = await User.update(dataToUpdate, {
        where: { user_id: user_id },
      });

      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Service error in update: ${error.message}`);
    }
  }

  // Cập nhật trạng thái
  static async updateStatus(user_id, status) {
    try {
      const [affectedCount] = await User.update(
        { status: status },
        { where: { user_id: user_id } }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Service error in updateStatus: ${error.message}`);
    }
  }

  // Lấy danh sách (Pagination)
  static async findAll({
    page = 1,
    limit = 10,
    search = "",
    role = "",
    status = "",
  } = {}) {
    const safePage = Math.max(1, Number(page) || 1);
    const safeLimit = Math.max(1, Number(limit) || 10);
    const offset = (safePage - 1) * safeLimit;

    let whereClause = "";
    let replacements = {};

    if (search) {
      whereClause += " AND (u.full_name LIKE :search OR u.email LIKE :search)";
      replacements.search = `%${search}%`;
    }
    if (role) {
      whereClause += " AND r.name = :role";
      replacements.role = role;
    }
    if (status) {
      whereClause += " AND u.status = :status";
      replacements.status = status;
    }

    try {
      const users = await sequelize.query(
        `SELECT 
          u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
          r.name as role_name, u.status, u.created_at, u.updated_at
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         WHERE 1=1 ${whereClause}
         ORDER BY u.created_at DESC
         LIMIT :limit OFFSET :offset`,
        {
          replacements: { ...replacements, limit: safeLimit, offset: offset },
          type: QueryTypes.SELECT,
        }
      );

      const countResult = await sequelize.query(
        `SELECT COUNT(*) as total
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         WHERE 1=1 ${whereClause}`,
        {
          replacements: replacements,
          type: QueryTypes.SELECT,
        }
      );

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
      throw new Error(`Service error in findAll: ${error.message}`);
    }
  }

  static async emailExists(email) {
    try {
      const count = await User.count({ where: { email: email } });
      return count > 0;
    } catch (error) {
      throw new Error(`Service error in emailExists: ${error.message}`);
    }
  }

  static async getRoleId(role_name) {
    try {
      const roles = await sequelize.query(
        "SELECT role_id FROM Roles WHERE name = ?",
        { replacements: [role_name], type: QueryTypes.SELECT }
      );
      return roles[0]?.role_id || null;
    } catch (error) {
      throw new Error(`Service error in getRoleId: ${error.message}`);
    }
  }

  static async changePassword(user_id, current_password, new_password) {
    try {
      const user = await User.findByPk(user_id);
      if (!user) throw new Error("User không tồn tại");

      const isPasswordValid = await bcrypt.compare(
        current_password,
        user.password_hash
      );
      if (!isPasswordValid) throw new Error("Mật khẩu hiện tại không đúng");

      const saltRounds = 12;
      const new_password_hash = await bcrypt.hash(new_password, saltRounds);

      user.password_hash = new_password_hash;
      await user.save();

      return true;
    } catch (error) {
      throw new Error(`Service error in changePassword: ${error.message}`);
    }
  }

  static async getAdmins() {
    try {
      return await sequelize.query(
        `SELECT u.user_id, u.email, u.full_name 
         FROM Users u JOIN Roles r ON u.role_id = r.role_id 
         WHERE r.name = 'Admin'`,
        { type: QueryTypes.SELECT }
      );
    } catch (error) {
      throw new Error(`Service error in getAdmins: ${error.message}`);
    }
  }

  static async updateRole(user_id, role_id) {
    try {
      const [affected] = await User.update({ role_id }, { where: { user_id } });
      return affected > 0;
    } catch (error) {
      throw new Error(`Service error in updateRole: ${error.message}`);
    }
  }
}

export default UserService;
