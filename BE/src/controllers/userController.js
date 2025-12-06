import User from "../models/User.js";
import Notification from "../models/Notification.js";

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

      // Lấy user hiện tại trước khi cập nhật (để biết old_status)
      const currentUser = await User.findById(user_id);
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

      // ====== Tạo notification cho user đó ======
      try {
        if (status === "Locked") {
          // tài khoản bị khóa
          await Notification.createAndPush({
            user_id: updatedUser.user_id,
            type: "account_locked", // type này bạn đã dùng trong notificationController
            payload: {
              old_status: currentUser.status,
              new_status: updatedUser.status,
              message: "Tài khoản của bạn đã bị khóa bởi admin.",
            },
          });
        } else if (status === "Active") {
          // tài khoản được mở khóa
          await Notification.createAndPush({
            user_id: updatedUser.user_id,
            type: "account_unlocked",
            payload: {
              old_status: currentUser.status,
              new_status: updatedUser.status,
              message: "Tài khoản của bạn đã được mở khóa.",
            },
          });
        } else if (status === "Suspended") {
          // nếu bạn muốn phân biệt Suspended
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
        // không fail API chỉ vì lỗi notification → log thôi
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

      // Lấy user hiện tại để biết role cũ
      const currentUser = await User.findById(user_id);
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

      // (Optional) Validate role_name nếu bạn muốn:
      const allowedRoles = ["Volunteer", "Manager", "Admin"];
      if (!allowedRoles.includes(role_name)) {
        return res.status(400).json({
          success: false,
          message: "Role không hợp lệ",
        });
      }

      // Lấy role_id từ role_name
      const role_id = await User.getRoleId(role_name);
      if (!role_id) {
        return res.status(400).json({
          success: false,
          message: "Role không hợp lệ",
        });
      }

      // Cập nhật role
      const isUpdated = await User.updateRole(user_id, role_id);

      if (!isUpdated) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      // Lấy user sau khi cập nhật
      const updatedUser = await User.findById(user_id);

      // ====== Tạo notification cho user đó về việc đổi role ======
      try {
        await Notification.createAndPush({
          user_id: updatedUser.user_id,
          type: "role_changed",
          payload: {
            old_role: currentUser.role_name,
            new_role: updatedUser.role_name,
            message: `Quyền của bạn đã được thay đổi từ ${currentUser.role_name} sang ${updatedUser.role_name}.`,
          },
        });
      } catch (notifErr) {
        console.error("Create notification for role change error:", notifErr);
        // chỉ log, không trả lỗi cho client
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
