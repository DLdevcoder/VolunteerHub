import UserService from "../services/UserService.js";
import Notification from "../models/Notification.js";

const userController = {
  // User: Xem thông tin cá nhân
  async getMe(req, res) {
    try {
      const user_id = req.user.user_id;
      // [SỬA] User -> UserService
      const user = await UserService.findById(user_id);

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

      // [SỬA] User -> UserService
      const isUpdated = await UserService.update(user_id, {
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

      // [SỬA] User -> UserService
      const updatedUser = await UserService.findById(user_id);

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

      // [SỬA] User -> UserService
      const result = await UserService.findAll({
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

      // [SỬA] User -> UserService
      const currentUser = await UserService.findById(user_id);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Validate status
      const allowedStatuses = ["Active", "Locked", "Suspended"];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: "Trạng thái không hợp lệ",
        });
      }

      // Không cho khóa chính mình
      if (parseInt(user_id, 10) === req.user.user_id) {
        return res.status(400).json({
          success: false,
          message: "Không thể thay đổi trạng thái của chính mình",
        });
      }

      // [SỬA] User -> UserService
      const isUpdated = await UserService.updateStatus(user_id, status);

      if (!isUpdated) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // [SỬA] User -> UserService
      const updatedUser = await UserService.findById(user_id);

      // ====== Tạo notification cho user đó ======
      try {
        if (status === "Locked") {
          await Notification.createAndPush({
            user_id: updatedUser.user_id,
            type: "account_locked",
            payload: {
              old_status: currentUser.status,
              new_status: updatedUser.status,
              message: "Tài khoản của bạn đã bị khóa bởi admin.",
            },
          });
        } else if (status === "Active") {
          await Notification.createAndPush({
            user_id: updatedUser.user_id,
            type: "account_unlocked", // Đảm bảo ENUM DB có type này hoặc map về type hợp lệ
            payload: {
              old_status: currentUser.status,
              new_status: updatedUser.status,
              message: "Tài khoản của bạn đã được mở khóa.",
            },
          });
        } else if (status === "Suspended") {
          await Notification.createAndPush({
            user_id: updatedUser.user_id,
            type: "account_locked",
            payload: {
              old_status: currentUser.status,
              new_status: updatedUser.status,
              message:
                "Tài khoản của bạn đã bị tạm ngưng bởi admin (Suspended).",
            },
          });
        }
      } catch (notifErr) {
        console.error("Create notification for status change error:", notifErr);
      }

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
      // [SỬA] User -> UserService
      const user = await UserService.findById(user_id);

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

  // Admin: Cập nhật role user (Volunteer / Manager / Admin)
  async updateUserRole(req, res) {
    try {
      const { user_id } = req.params;
      const { role_name } = req.body;

      if (!role_name) {
        return res.status(400).json({
          success: false,
          message: "role_name là bắt buộc",
        });
      }

      // [SỬA] User -> UserService
      const currentUser = await UserService.findById(user_id);
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Không cho tự đổi role của chính mình
      if (parseInt(user_id, 10) === req.user.user_id) {
        return res.status(400).json({
          success: false,
          message: "Không thể thay đổi role của chính mình",
        });
      }

      const allowedRoles = ["Volunteer", "Manager", "Admin"];
      if (!allowedRoles.includes(role_name)) {
        return res.status(400).json({
          success: false,
          message: "Role không hợp lệ",
        });
      }

      // [SỬA] User -> UserService
      const role_id = await UserService.getRoleId(role_name);
      if (!role_id) {
        return res.status(400).json({
          success: false,
          message: "Role không hợp lệ",
        });
      }

      // [SỬA] User -> UserService
      const isUpdated = await UserService.updateRole(user_id, role_id);

      if (!isUpdated) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // [SỬA] User -> UserService
      const updatedUser = await UserService.findById(user_id);

      // ====== Tạo notification ======
      try {
        await Notification.createAndPush({
          user_id: updatedUser.user_id,
          type: "role_changed", // Đảm bảo ENUM DB có type này
          payload: {
            old_role: currentUser.role_name,
            new_role: updatedUser.role_name,
            message: `Quyền của bạn đã được thay đổi từ ${currentUser.role_name} sang ${updatedUser.role_name}.`,
          },
        });
      } catch (notifErr) {
        console.error("Create notification for role change error:", notifErr);
      }

      return res.json({
        success: true,
        message: `Đã cập nhật role user thành ${role_name}`,
        data: {
          user: updatedUser,
        },
      });
    } catch (error) {
      console.error("Update user role error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật role user",
      });
    }
  },
};

export default userController;
