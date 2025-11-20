import Notification from "../models/Notification.js";

const notificationController = {
  // Lấy danh sách thông báo của user hiện tại
  async getMyNotifications(req, res) {
    try {
      const user_id = req.user.user_id;
      const { page = 1, limit = 20, is_read } = req.query;

      const result = await Notification.findByUserId(user_id, {
        page: parseInt(page),
        limit: parseInt(limit),
        is_read,
      });

      // Đếm số thông báo chưa đọc
      const unread_count = await Notification.countUnread(user_id);

      res.json({
        success: true,
        data: {
          notifications: result.notifications,
          unread_count: unread_count,
          pagination: result.pagination,
        },
      });
    } catch (error) {
      console.error("Get notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông báo",
      });
    }
  },

  // Đánh dấu thông báo là đã đọc
  async markAsRead(req, res) {
    try {
      const user_id = req.user.user_id;
      const { notification_id } = req.params;

      // Kiểm tra thông báo thuộc về user
      const belongsToUser = await Notification.belongsToUser(
        notification_id,
        user_id
      );
      if (!belongsToUser) {
        return res.status(404).json({
          success: false,
          message: "Thông báo không tồn tại",
        });
      }

      // Cập nhật trạng thái đã đọc
      const isUpdated = await Notification.markAsRead(notification_id, user_id);

      res.json({
        success: true,
        message: "Đã đánh dấu thông báo là đã đọc",
      });
    } catch (error) {
      console.error("Mark as read error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi đánh dấu thông báo",
      });
    }
  },

  // Đánh dấu tất cả thông báo là đã đọc
  async markAllAsRead(req, res) {
    try {
      const user_id = req.user.user_id;

      const affectedRows = await Notification.markAllAsRead(user_id);

      res.json({
        success: true,
        message: `Đã đánh dấu ${affectedRows} thông báo là đã đọc`,
      });
    } catch (error) {
      console.error("Mark all as read error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi đánh dấu thông báo",
      });
    }
  },

  // Xóa thông báo
  async deleteNotification(req, res) {
    try {
      const user_id = req.user.user_id;
      const { notification_id } = req.params;

      // Kiểm tra thông báo thuộc về user
      const belongsToUser = await Notification.belongsToUser(
        notification_id,
        user_id
      );
      if (!belongsToUser) {
        return res.status(404).json({
          success: false,
          message: "Thông báo không tồn tại",
        });
      }

      // Xóa thông báo
      const isDeleted = await Notification.delete(notification_id, user_id);

      res.json({
        success: true,
        message: "Đã xóa thông báo",
      });
    } catch (error) {
      console.error("Delete notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa thông báo",
      });
    }
  },

  // Lấy số lượng thông báo chưa đọc (cho badge)
  async getUnreadCount(req, res) {
    try {
      const user_id = req.user.user_id;

      const unread_count = await Notification.countUnread(user_id);

      res.json({
        success: true,
        data: {
          unread_count: unread_count,
        },
      });
    } catch (error) {
      console.error("Get unread count error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy số thông báo chưa đọc",
      });
    }
  },

  // WebSocket/Push Notification: Gửi thông báo real-time (tùy chọn)
  async createNotification(req, res) {
    try {
      const { user_id, type, payload } = req.body;

      // Validate input
      if (!user_id || !type) {
        return res.status(400).json({
          success: false,
          message: "user_id và type là bắt buộc",
        });
      }

      // Validate type
      if (!Notification.isValidType(type)) {
        return res.status(400).json({
          success: false,
          message: "Loại thông báo không hợp lệ",
        });
      }

      // Tạo thông báo
      const notification = await Notification.create({
        user_id,
        type,
        payload,
      });

      res.status(201).json({
        success: true,
        message: "Đã tạo thông báo",
        data: {
          notification: notification,
        },
      });
    } catch (error) {
      console.error("Create notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo thông báo",
      });
    }
  },
};

export default notificationController;
