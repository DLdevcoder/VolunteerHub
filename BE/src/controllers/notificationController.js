import Notification from "../models/Notification.js";
import UserService from "../services/UserService.js";
import Event from "../models/Event.js";
import pool from "../config/db.js";

const notificationController = {
  // ==================== API CHO NGƯỜI DÙNG ====================

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

      // enrich each notification with title + body
      const enrichedNotifications = result.notifications.map((n) => ({
        ...n,
        title: Notification.getNotificationTitle(n.type),
        body: Notification.getNotificationBody(n.type, n.payload),
      }));

      // Đếm số thông báo chưa đọc
      const unread_count = await Notification.countUnread(user_id);

      res.json({
        success: true,
        data: {
          notifications: enrichedNotifications,
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

  // Lấy thông báo gần đây
  async getRecentNotifications(req, res) {
    try {
      const user_id = req.user.user_id;
      const { limit = 10 } = req.query;

      const notifications = await Notification.getRecentUnread(
        user_id,
        parseInt(limit)
      );

      const enrichedNotifications = notifications.map((n) => ({
        ...n,
        title: Notification.getNotificationTitle(n.type),
        body: Notification.getNotificationBody(n.type, n.payload),
      }));

      res.json({
        success: true,
        data: {
          notifications: enrichedNotifications,
        },
      });
    } catch (error) {
      console.error("Get recent notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông báo gần đây",
      });
    }
  },

  // ==================== API CHO HỆ THỐNG ====================

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
  async notifyNewRegistration(req, res) {
    try {
      const { event_id, user_id } = req.body;

      console.log("Event ID:", event_id);
      console.log("User ID:", user_id);

      // Validate input
      if (!event_id || !user_id) {
        return res.status(400).json({
          success: false,
          message: "event_id và user_id là bắt buộc",
        });
      }

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện không tồn tại",
        });
      }

      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      // Gửi thông báo cho manager của sự kiện
      const notification = await Notification.createAndPush({
        user_id: event.manager_id,
        type: "new_registration",
        payload: {
          event_id: event_id,
          event_title: event.title,
          user_id: user_id,
          user_name: user.full_name,
          message: `Có đăng ký mới từ ${user.full_name} cho sự kiện "${event.title}"`,
        },
      });

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

      // Validate input
      if (!registration_id || !status) {
        return res.status(400).json({
          success: false,
          message: "registration_id và status là bắt buộc",
        });
      }

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

      // Validate input
      if (!event_id) {
        return res.status(400).json({
          success: false,
          message: "event_id là bắt buộc",
        });
      }

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
            message: `Sự kiện "${event.title}" sẽ diễn ra vào ${new Date(
              event.start_date
            ).toLocaleString("vi-VN")}`,
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

  // Thông báo sự kiện sắp diễn ra (1h trước)
  async notifyEventStartingSoon(req, res) {
    try {
      const { event_id } = req.body;

      // Validate input
      if (!event_id) {
        return res.status(400).json({
          success: false,
          message: "event_id là bắt buộc",
        });
      }

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
          type: "event_starting_soon",
          payload: {
            event_id: event_id,
            event_title: event.title,
            start_date: event.start_date,
            location: event.location,
            message: `Sự kiện "${event.title}" sẽ bắt đầu trong 1 giờ tới`,
          },
        });
        notifications.push(notification);
      }

      res.json({
        success: true,
        message: `Đã gửi thông báo sắp diễn ra cho ${notifications.length} tình nguyện viên`,
        data: { notifications },
      });
    } catch (error) {
      console.error("Event starting soon notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo sắp diễn ra",
      });
    }
  },

  // Thông báo sự kiện bị hủy (Admin)
  async notifyEventCancelled(req, res) {
    try {
      const { event_id, reason } = req.body;

      // Validate input
      if (!event_id || !reason) {
        return res.status(400).json({
          success: false,
          message: "event_id và reason là bắt buộc",
        });
      }

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện không tồn tại",
        });
      }

      // Lấy tất cả volunteers đã đăng ký (mọi trạng thái)
      const [registrations] = await pool.execute(
        `SELECT r.user_id, u.full_name, u.email 
         FROM Registrations r
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.event_id = ?`,
        [event_id]
      );

      const notifications = [];
      for (const registration of registrations) {
        const notification = await Notification.createAndPush({
          user_id: registration.user_id,
          type: "event_cancelled",
          payload: {
            event_id: event_id,
            event_title: event.title,
            reason: reason,
            message: `Sự kiện "${event.title}" đã bị hủy: ${reason}`,
          },
        });
        notifications.push(notification);
      }

      res.json({
        success: true,
        message: `Đã gửi thông báo hủy sự kiện cho ${notifications.length} tình nguyện viên`,
        data: { notifications },
      });
    } catch (error) {
      console.error("Event cancelled notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo hủy sự kiện",
      });
    }
  },

  // Thông báo cập nhật sự kiện khẩn (Manager)
  async notifyEventUpdatedUrgent(req, res) {
    try {
      const { event_id, changes } = req.body;
      const manager_id = req.user.user_id;

      // Validate input
      if (!event_id || !changes) {
        return res.status(400).json({
          success: false,
          message: "event_id và changes là bắt buộc",
        });
      }

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện không tồn tại",
        });
      }

      // Kiểm tra quyền manager
      const isEventOwner = await Event.isEventOwner(event_id, manager_id);
      if (!isEventOwner) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền cập nhật sự kiện này",
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
          type: "event_updated_urgent",
          payload: {
            event_id: event_id,
            event_title: event.title,
            changes: changes,
            message: `Sự kiện "${event.title}" có thông tin quan trọng được cập nhật`,
          },
        });
        notifications.push(notification);
      }

      res.json({
        success: true,
        message: `Đã gửi thông báo cập nhật khẩn cho ${notifications.length} tình nguyện viên`,
        data: { notifications },
      });
    } catch (error) {
      console.error("Event updated urgent notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo cập nhật khẩn",
      });
    }
  },

  // Thông báo nội dung mới trên wall (cho tất cả participants)
  async notifyNewContent(req, res) {
    try {
      const { event_id, content_type, content_id, content_preview } = req.body;
      const author_id = req.user.user_id;

      // Validate input
      if (!event_id || !content_type || !content_id) {
        return res.status(400).json({
          success: false,
          message: "event_id, content_type và content_id là bắt buộc",
        });
      }

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
              content_preview: content_preview?.substring(0, 100) || "",
              author_id: author_id,
              message: `Có ${
                content_type === "post" ? "bài viết" : "bình luận"
              } mới trong sự kiện "${event.title}"`,
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

      // Validate input
      if (!content_type || !content_id || !reactor_id || !content_owner_id) {
        return res.status(400).json({
          success: false,
          message:
            "content_type, content_id, reactor_id và content_owner_id là bắt buộc",
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

  // Thông báo tài khoản bị khóa
  async notifyAccountLocked(req, res) {
    try {
      const { user_id, reason } = req.body;

      // Validate input
      if (!user_id || !reason) {
        return res.status(400).json({
          success: false,
          message: "user_id và reason là bắt buộc",
        });
      }

      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      const notification = await Notification.createAndPush({
        user_id: user_id,
        type: "account_locked",
        payload: {
          reason: reason,
          message: `Tài khoản của bạn đã bị khóa: ${reason}`,
        },
      });

      res.json({
        success: true,
        message: "Đã gửi thông báo khóa tài khoản",
        data: { notification },
      });
    } catch (error) {
      console.error("Account locked notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo khóa tài khoản",
      });
    }
  },

  // Thông báo manager bị khóa (cho admin)
  async notifyManagerLocked(req, res) {
    try {
      const { manager_id, reason } = req.body;
      const admin_id = req.user.user_id;

      // Validate input
      if (!manager_id || !reason) {
        return res.status(400).json({
          success: false,
          message: "manager_id và reason là bắt buộc",
        });
      }

      const manager = await User.findById(manager_id);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager không tồn tại",
        });
      }

      // Gửi thông báo cho admin
      const notification = await Notification.createAndPush({
        user_id: admin_id,
        type: "manager_account_locked",
        payload: {
          manager_id: manager_id,
          manager_name: manager.full_name,
          reason: reason,
          message: `Manager ${manager.full_name} đã bị khóa tài khoản: ${reason}`,
        },
      });

      res.json({
        success: true,
        message: "Đã gửi thông báo manager bị khóa",
        data: { notification },
      });
    } catch (error) {
      console.error("Manager locked notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo manager bị khóa",
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

  // Trong notificationController - THÊM:

  // Thông báo mở khóa tài khoản
  async notifyAccountUnlocked(req, res) {
    try {
      const { user_id } = req.body;

      // Validate input
      if (!user_id) {
        return res.status(400).json({
          success: false,
          message: "user_id là bắt buộc",
        });
      }

      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Người dùng không tồn tại",
        });
      }

      const notification = await Notification.createAndPush({
        user_id: user_id,
        type: "account_unlocked",
        payload: {
          message: "Tài khoản của bạn đã được mở khóa",
        },
      });

      res.json({
        success: true,
        message: "Đã gửi thông báo mở khóa tài khoản",
        data: { notification },
      });
    } catch (error) {
      console.error("Account unlocked notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo mở khóa tài khoản",
      });
    }
  },

  // Thông báo mở khóa manager (cho admin)
  async notifyManagerUnlocked(req, res) {
    try {
      const { manager_id } = req.body;
      const admin_id = req.user.user_id;

      // Validate input
      if (!manager_id) {
        return res.status(400).json({
          success: false,
          message: "manager_id là bắt buộc",
        });
      }

      const manager = await User.findById(manager_id);
      if (!manager) {
        return res.status(404).json({
          success: false,
          message: "Manager không tồn tại",
        });
      }

      // Gửi thông báo cho admin
      const notification = await Notification.createAndPush({
        user_id: admin_id,
        type: "manager_account_unlocked",
        payload: {
          manager_id: manager_id,
          manager_name: manager.full_name,
          message: `Manager ${manager.full_name} đã được mở khóa tài khoản`,
        },
      });

      res.json({
        success: true,
        message: "Đã gửi thông báo mở khóa manager",
        data: { notification },
      });
    } catch (error) {
      console.error("Manager unlocked notification error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi gửi thông báo mở khóa manager",
      });
    }
  },

  // Gửi thông báo hàng loạt
  async bulkCreateNotifications(req, res) {
    try {
      const { user_ids, type, payload } = req.body;

      // Validate input
      if (!user_ids || !type || !Array.isArray(user_ids)) {
        return res.status(400).json({
          success: false,
          message: "user_ids (array), type và payload là bắt buộc",
        });
      }

      // Validate type
      if (!Notification.isValidType(type)) {
        return res.status(400).json({
          success: false,
          message: "Loại thông báo không hợp lệ",
        });
      }

      // Kiểm tra users tồn tại
      for (const user_id of user_ids) {
        const user = await User.findById(user_id);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: `User ${user_id} không tồn tại`,
          });
        }
      }

      // Tạo thông báo hàng loạt
      const affectedRows = await Notification.bulkCreateForUsers(user_ids, {
        type,
        payload,
      });

      res.status(201).json({
        success: true,
        message: `Đã tạo ${affectedRows} thông báo`,
        data: {
          affected_rows: affectedRows,
        },
      });
    } catch (error) {
      console.error("Bulk create notifications error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tạo thông báo hàng loạt",
      });
    }
  },

  async testPush(req, res) {
    try {
      const user_id = req.user.user_id;

      console.log("Test push called for user:", user_id);

      // Tạo thông báo test
      const notification = await Notification.createAndPush({
        user_id: user_id,
        type: "test_notification",
        payload: {
          message: "This is a test push notification from the server!",
          test_id: Date.now(),
          url: "/notifications",
        },
      });

      res.json({
        success: true,
        message: "Test push notification sent successfully!",
        data: {
          notification: notification,
          user_id: user_id,
        },
      });
    } catch (error) {
      console.error("Test push error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

export default notificationController;
