import pool from "../config/db.js";

const notificationController = {
  // Lấy danh sách thông báo của user hiện tại
  async getMyNotifications(req, res) {
    try {
      const user_id = req.user.user_id;
      const { page = 1, limit = 20, is_read } = req.query;

      const offset = (page - 1) * limit;

      let whereConditions = ["user_id = ?"];
      let queryParams = [user_id];

      if (is_read !== undefined) {
        whereConditions.push("is_read = ?");
        queryParams.push(is_read === "true");
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Lấy danh sách thông báo
      const [notifications] = await pool.execute(
        `SELECT 
                    notification_id, type, payload, is_read, created_at, updated_at
                 FROM Notifications 
                 ${whereClause}
                 ORDER BY created_at DESC
                 LIMIT ? OFFSET ?`,
        [...queryParams, parseInt(limit), offset]
      );

      // Đếm tổng số thông báo
      const [countResult] = await pool.execute(
        `SELECT COUNT(*) as total
                 FROM Notifications 
                 ${whereClause}`,
        queryParams
      );

      const total = countResult[0].total;
      const totalPages = Math.ceil(total / limit);

      // Đếm số thông báo chưa đọc
      const [unreadCountResult] = await pool.execute(
        `SELECT COUNT(*) as unread_count
                 FROM Notifications 
                 WHERE user_id = ? AND is_read = FALSE`,
        [user_id]
      );

      const unread_count = unreadCountResult[0].unread_count;

      res.json({
        success: true,
        data: {
          notifications: notifications,
          unread_count: unread_count,
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
      const [notifications] = await pool.execute(
        `SELECT notification_id FROM Notifications 
                 WHERE notification_id = ? AND user_id = ?`,
        [notification_id, user_id]
      );

      if (notifications.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Thông báo không tồn tại",
        });
      }

      // Cập nhật trạng thái đã đọc
      const [result] = await pool.execute(
        `UPDATE Notifications 
                 SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
                 WHERE notification_id = ? AND user_id = ?`,
        [notification_id, user_id]
      );

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

      const [result] = await pool.execute(
        `UPDATE Notifications 
                 SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
                 WHERE user_id = ? AND is_read = FALSE`,
        [user_id]
      );

      res.json({
        success: true,
        message: `Đã đánh dấu ${result.affectedRows} thông báo là đã đọc`,
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
      const [notifications] = await pool.execute(
        `SELECT notification_id FROM Notifications 
                 WHERE notification_id = ? AND user_id = ?`,
        [notification_id, user_id]
      );

      if (notifications.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Thông báo không tồn tại",
        });
      }

      // Xóa thông báo
      const [result] = await pool.execute(
        `DELETE FROM Notifications 
                 WHERE notification_id = ? AND user_id = ?`,
        [notification_id, user_id]
      );

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

      const [result] = await pool.execute(
        `SELECT COUNT(*) as unread_count
                 FROM Notifications 
                 WHERE user_id = ? AND is_read = FALSE`,
        [user_id]
      );

      const unread_count = result[0].unread_count;

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

      const validTypes = [
        "event_approved",
        "event_rejected",
        "registration_approved",
        "registration_rejected",
        "registration_completed",
        "event_reminder",
        "new_post",
        "new_comment",
        "reaction_received",
      ];

      if (!validTypes.includes(type)) {
        return res.status(400).json({
          success: false,
          message: "Loại thông báo không hợp lệ",
        });
      }

      // Tạo thông báo
      const [result] = await pool.execute(
        `INSERT INTO Notifications (user_id, type, payload) 
                 VALUES (?, ?, ?)`,
        [user_id, type, JSON.stringify(payload)]
      );

      // Lấy thông báo vừa tạo
      const [notifications] = await pool.execute(
        `SELECT * FROM Notifications WHERE notification_id = ?`,
        [result.insertId]
      );

      res.status(201).json({
        success: true,
        message: "Đã tạo thông báo",
        data: {
          notification: notifications[0],
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
