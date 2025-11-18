import pool from "../config/db.js";

const userController = {
  // User: Xem thông tin cá nhân
  async getMe(req, res) {
    try {
      const user_id = req.user.user_id;

      const [users] = await pool.execute(
        `SELECT 
                    u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
                    r.name as role_name, u.status, u.created_at, u.updated_at
                 FROM Users u 
                 JOIN Roles r ON u.role_id = r.role_id 
                 WHERE u.user_id = ?`,
        [user_id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      const user = users[0];
      res.json({
        success: true,
        data: {
          user: user,
        },
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin user",
      });
    }
  },

  // User: Cập nhật thông tin cá nhân
  async updateMe(req, res) {
    try {
      const user_id = req.user.user_id;
      const { full_name, phone, avatar_url } = req.body;

      // Validate input
      if (!full_name) {
        return res.status(400).json({
          success: false,
          message: "Họ tên là bắt buộc",
        });
      }

      // Cập nhật thông tin
      const [result] = await pool.execute(
        `UPDATE Users 
                 SET full_name = ?, phone = ?, avatar_url = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ?`,
        [full_name, phone, avatar_url, user_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Lấy thông tin user sau khi cập nhật
      const [users] = await pool.execute(
        `SELECT 
                    u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
                    r.name as role_name, u.status, u.created_at, u.updated_at
                 FROM Users u 
                 JOIN Roles r ON u.role_id = r.role_id 
                 WHERE u.user_id = ?`,
        [user_id]
      );

      const updatedUser = users[0];

      res.json({
        success: true,
        message: "Cập nhật thông tin thành công",
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Update me error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật thông tin",
      });
    }
  },

  // Admin: Xem danh sách tất cả users (có phân trang và filter)
  async getAllUsers(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        role = "",
        status = "",
      } = req.query;

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

      res.json({
        success: true,
        data: {
          users: users,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_records: total,
            has_next: page < totalPages,
            has_prev: page > 1,
          },
        },
      });
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách users",
      });
    }
  },

  // Admin: Khóa/Mở khóa tài khoản user
  async updateUserStatus(req, res) {
    try {
      const { user_id } = req.params;
      const { status } = req.body;

      // Validate status
      if (!["Active", "Locked", "Suspended"].includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }

      // Không cho khóa chính mình
      if (parseInt(user_id) === req.user.user_id) {
        return res.status(400).json({
          success: false,
          message: "Không thể thay đổi trạng thái của chính mình",
        });
      }

      // Cập nhật status
      const [result] = await pool.execute(
        `UPDATE Users 
                 SET status = ?, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ?`,
        [status, user_id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Lấy thông tin user sau khi cập nhật
      const [users] = await pool.execute(
        `SELECT 
                    u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
                    r.name as role_name, u.status, u.created_at, u.updated_at
                 FROM Users u 
                 JOIN Roles r ON u.role_id = r.role_id 
                 WHERE u.user_id = ?`,
        [user_id]
      );

      const updatedUser = users[0];

      res.json({
        success: true,
        message: `Cập nhật trạng thái user thành ${status}`,
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Update user status error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái user",
      });
    }
  },

  // Admin: Xem chi tiết user
  async getUserById(req, res) {
    try {
      const { user_id } = req.params;

      const [users] = await pool.execute(
        `SELECT 
                    u.user_id, u.email, u.full_name, u.phone, u.avatar_url,
                    r.name as role_name, u.status, u.created_at, u.updated_at
                 FROM Users u 
                 JOIN Roles r ON u.role_id = r.role_id 
                 WHERE u.user_id = ?`,
        [user_id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      const user = users[0];

      res.json({
        success: true,
        data: {
          user: user,
        },
      });
    } catch (error) {
      console.error("Get user by id error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin user",
      });
    }
  },
};

export default userController;
