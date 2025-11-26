import Notification from "../models/Notification.js";
import User from "../models/User.js";
import Event from "../models/Event.js";
import pool from "../config/db.js";

const notificationController = {
  // Lấy danh sách thông báo của user hiện tại
  async getMyNotifications(req, res) {
    try {
      const user_id = req.user.user_id;
      const { page = 1, limit = 20, is_read, type } = req.query;

      const result = await Notification.findByUserId(user_id, {
        page: parseInt(page),
        limit: parseInt(limit),
        is_read,
        type,
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

  // ==================== CÁC LUỒNG THÔNG BÁO THEO SƠ ĐỒ ====================

  // Thông báo khi sự kiện được duyệt (cho Manager) - ĐÃ CÓ TRONG TRIGGER
  async notifyEventApproval(req, res) {
    try {
      const { event_id, is_approved, rejection_reason } = req.body;
      const admin_id = req.user.user_id;

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện không tồn tại",
        });
      }

      // Duyệt hoặc từ chối sự kiện (trigger sẽ tự động tạo thông báo)
      let result;
      if (is_approved) {
        result = await Event.approveEvent(event_id, admin_id);
      } else {
        result = await Event.rejectEvent(event_id, admin_id, rejection_reason);
      }

      if (!result) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật trạng thái sự kiện",
        });
      }

      res.json({
        success: true,
        message: is_approved ? "Đã duyệt sự kiện" : "Đã từ chối sự kiện",
      });
    } catch (error) {
      console.error("Event approval notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xử lý duyệt sự kiện",
      });
    }
  },

  // Thông báo khi có đăng ký mới (cho Manager/Event Host)
  // notificationController.js - trong notifyNewRegistration
  async notifyNewRegistration(req, res) {
    try {
      const { event_id, user_id } = req.body;

      console.log("=== DEBUG CONTROLLER ===");
      console.log("Event ID:", event_id, "User ID:", user_id);

      const event = await Event.getEventById(event_id);
      console.log("Event object:", event);
      console.log("Event manager_id:", event?.manager_id);
      console.log("Event title:", event?.title);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện không tồn tại",
        });
      }

      // KIỂM TRA MANAGER_ID CÓ TỒN TẠI KHÔNG
      if (!event.manager_id) {
        return res.status(400).json({
          success: false,
          message: "Sự kiện không có manager",
        });
      }

      const user = await User.findById(user_id);
      console.log("User object:", user);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // ĐẢM BẢO TẤT CẢ GIÁ TRỊ ĐỀU CÓ
      const notificationData = {
        user_id: event.manager_id, // ← KIỂM TRA GIÁ TRỊ NÀY
        type: "new_registration",
        payload: {
          event_id: event_id,
          event_title: event.title,
          user_id: user_id,
          user_name: user.full_name,
          message: `Có đăng ký mới từ ${user.full_name} cho sự kiện "${event.title}"`,
        },
      };

      console.log("Final notification data:", notificationData);

      const notification = await Notification.createAndPush(notificationData);

      res.json({
        success: true,
        message: "Đã gửi thông báo đăng ký mới",
        data: { notification },
      });
    } catch (error) {
      console.error("New registration notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo đăng ký mới",
      });
    }
  },

  // Thông báo trạng thái đăng ký (cho Volunteer) - Sử dụng trực tiếp từ DB
  async notifyRegistrationStatus(req, res) {
    try {
      const { registration_id, status, rejection_reason } = req.body;

      // Lấy thông tin registration từ database
      const [registrations] = await pool.execute(
        `SELECT r.*, e.title as event_title, u.full_name as user_name 
         FROM Registrations r
         JOIN Events e ON r.event_id = e.event_id
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.registration_id = ?`,
        [registration_id]
      );

      if (registrations.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Đăng ký không tồn tại",
        });
      }

      const registration = registrations[0];

      let type, message;
      switch (status) {
        case "approved":
          type = "registration_approved";
          message = "Đăng ký của bạn đã được chấp nhận";
          break;
        case "rejected":
          type = "registration_rejected";
          message = `Đăng ký của bạn bị từ chối: ${rejection_reason}`;
          break;
        case "completed":
          type = "registration_completed";
          message = "Bạn đã hoàn thành sự kiện thành công";
          break;
        default:
          return res.status(400).json({
            success: false,
            message: "Trạng thái không hợp lệ",
          });
      }

      // Cập nhật trạng thái registration (trigger sẽ tự động tạo thông báo)
      const [result] = await pool.execute(
        `UPDATE Registrations 
         SET status = ?, rejection_reason = ?, updated_at = CURRENT_TIMESTAMP
         WHERE registration_id = ?`,
        [status, rejection_reason, registration_id]
      );

      if (result.affectedRows === 0) {
        return res.status(400).json({
          success: false,
          message: "Không thể cập nhật trạng thái đăng ký",
        });
      }

      res.json({
        success: true,
        message: "Đã cập nhật trạng thái đăng ký và gửi thông báo",
      });
    } catch (error) {
      console.error("Registration status notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái đăng ký",
      });
    }
  },

  // Thông báo nhắc nhở sự kiện (cho Volunteer)
  async notifyEventReminder(req, res) {
    try {
      const { event_id } = req.body;

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện không tồn tại",
        });
      }

      // Lấy tất cả volunteers đã đăng ký và được chấp nhận
      const [approvedRegistrations] = await pool.execute(
        `SELECT r.user_id, u.full_name, u.email 
         FROM Registrations r
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.event_id = ? AND r.status = 'approved'`,
        [event_id]
      );

      const notifications = [];
      for (const registration of approvedRegistrations) {
        const notification = await Notification.createAndPush({
          user_id: registration.user_id,
          type: "event_reminder",
          payload: {
            event_id: event_id,
            event_title: event.title,
            start_date: event.start_date,
            location: event.location,
            reminder: "Sự kiện sắp diễn ra",
          },
        });
        notifications.push(notification);
      }

      res.json({
        success: true,
        message: `Đã gửi thông báo nhắc nhở cho ${notifications.length} tình nguyện viên`,
        data: { notifications },
      });
    } catch (error) {
      console.error("Event reminder notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo nhắc nhở",
      });
    }
  },

  // Thông báo nội dung mới trên wall (cho tất cả participants)
  async notifyNewContent(req, res) {
    try {
      const { event_id, content_type, content_id, content_preview } = req.body;
      const author_id = req.user.user_id;

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện không tồn tại",
        });
      }

      // Lấy tất cả participants của sự kiện (đã được approved)
      const [participants] = await pool.execute(
        `SELECT r.user_id, u.full_name 
         FROM Registrations r
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.event_id = ? AND r.status = 'approved'`,
        [event_id]
      );

      let type, title;
      if (content_type === "post") {
        type = "new_post";
        title = "Bài viết mới";
      } else if (content_type === "comment") {
        type = "new_comment";
        title = "Bình luận mới";
      } else {
        return res.status(400).json({
          success: false,
          message: "Loại nội dung không hợp lệ",
        });
      }

      const notifications = [];
      for (const participant of participants) {
        // Không gửi thông báo cho chính người tạo content
        if (participant.user_id !== author_id) {
          const notification = await Notification.createAndPush({
            user_id: participant.user_id,
            type,
            payload: {
              event_id: event_id,
              event_title: event.title,
              content_type: content_type,
              content_id: content_id,
              content_preview: content_preview,
              author_id: author_id,
            },
          });
          notifications.push(notification);
        }
      }

      res.json({
        success: true,
        message: `Đã gửi thông báo nội dung mới cho ${notifications.length} người tham gia`,
        data: { notifications },
      });
    } catch (error) {
      console.error("New content notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo nội dung mới",
      });
    }
  },

  // Thông báo có lượt thích mới (reaction)
  async notifyNewReaction(req, res) {
    try {
      const { content_type, content_id, reactor_id, content_owner_id } =
        req.body;

      if (!content_owner_id) {
        return res.status(400).json({
          success: false,
          message: "content_owner_id là bắt buộc",
        });
      }

      const reactor = await User.findById(reactor_id);
      const content_owner = await User.findById(content_owner_id);

      if (!reactor || !content_owner) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // Không gửi thông báo cho chính người tạo reaction
      if (reactor_id === content_owner_id) {
        return res.json({
          success: true,
          message: "Không gửi thông báo cho chính người tạo reaction",
        });
      }

      const notification = await Notification.createAndPush({
        user_id: content_owner_id,
        type: "reaction_received",
        payload: {
          content_type: content_type,
          content_id: content_id,
          reactor_id: reactor_id,
          reactor_name: reactor.full_name,
          message: `${reactor.full_name} đã thích ${
            content_type === "post" ? "bài viết" : "bình luận"
          } của bạn`,
        },
      });

      res.json({
        success: true,
        message: "Đã gửi thông báo lượt thích",
        data: { notification },
      });
    } catch (error) {
      console.error("New reaction notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo lượt thích",
      });
    }
  },

  // API tạo thông báo tổng quát (cho admin/system)
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

      // Kiểm tra user tồn tại
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // Tạo thông báo
      const notification = await Notification.createAndPush({
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
