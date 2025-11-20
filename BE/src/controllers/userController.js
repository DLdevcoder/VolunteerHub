import User from "../models/User.js";

const userController = {
  // User: Xem thông tin cá nhân
  async getMe(req, res) {
    try {
      const user_id = req.user.user_id;
      const user = await User.findById(user_id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

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
      const isUpdated = await User.update(user_id, {
        full_name,
        phone,
        avatar_url,
      });

      if (!isUpdated) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Lấy thông tin user sau khi cập nhật
      const updatedUser = await User.findById(user_id);

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

      const result = await User.findAll({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        role,
        status,
      });

      res.json({
        success: true,
        data: {
          users: result.users,
          pagination: result.pagination,
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
      const isUpdated = await User.updateStatus(user_id, status);

      if (!isUpdated) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Lấy thông tin user sau khi cập nhật
      const updatedUser = await User.findById(user_id);

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
      const user = await User.findById(user_id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

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
