import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";
import Notification from "../models/Notification.js"; // Model đã chuyển đổi
import WebPushService from "./WebPushService.js"; // Service đã chuyển đổi

class NotificationService {
  // Tạo thông báo từ trigger (Gọi xuống Model)
  static async createNotificationFromTrigger(user_id, type, payload) {
    try {
      // Notification.createAndPush bên Model đã xử lý lưu DB + Gửi Push
      const notification = await Notification.createAndPush({
        user_id,
        type,
        payload,
      });

      console.log(`Đã tạo thông báo: ${type} cho user ${user_id}`);
      return notification.notification_id;
    } catch (error) {
      console.error("Lỗi tạo thông báo từ trigger:", error);
      // Không throw error để tránh làm crash luồng chính (ví dụ: tạo event xong thì notify lỗi cũng ko sao)
      // Tuy nhiên nếu bạn muốn chặt chẽ thì throw error.
      // Ở đây tôi throw để Controller biết.
      throw error;
    }
  }

  // =================================================================
  // CÁC HÀM WRAPPER (Logic không đổi, chỉ gọi hàm trên)
  // =================================================================

  // Gửi thông báo event approved
  static async notifyEventApproved(manager_id, event_id, event_title) {
    return await this.createNotificationFromTrigger(
      manager_id,
      "event_approved",
      {
        event_id,
        title: event_title,
        message: "Sự kiện của bạn đã được phê duyệt",
      }
    );
  }

  // Gửi thông báo event rejected
  static async notifyEventRejected(
    manager_id,
    event_id,
    event_title,
    rejection_reason
  ) {
    return await this.createNotificationFromTrigger(
      manager_id,
      "event_rejected",
      {
        event_id,
        title: event_title,
        message: "Sự kiện của bạn đã bị từ chối",
        rejection_reason: rejection_reason || "Không có lý do cụ thể",
      }
    );
  }

  // Gửi thông báo registration approved
  static async notifyRegistrationApproved(user_id, event_id, event_title) {
    return await this.createNotificationFromTrigger(
      user_id,
      "registration_approved",
      {
        event_id,
        event_title,
        message: "Đăng ký tham gia sự kiện đã được chấp nhận",
      }
    );
  }

  // Gửi thông báo registration rejected
  static async notifyRegistrationRejected(
    user_id,
    event_id,
    event_title,
    reason
  ) {
    return await this.createNotificationFromTrigger(
      user_id,
      "registration_rejected",
      {
        event_id,
        event_title,
        reason,
        message: "Đăng ký tham gia sự kiện đã bị từ chối",
      }
    );
  }

  // Gửi thông báo registration completed
  static async notifyRegistrationCompleted(user_id, event_id, event_title) {
    return await this.createNotificationFromTrigger(
      user_id,
      "registration_completed",
      {
        event_id,
        event_title,
        message: "Bạn đã hoàn thành sự kiện thành công",
      }
    );
  }

  // =================================================================
  // CÁC HÀM XỬ LÝ LOGIC PHỨC TẠP (Query User list rồi gửi hàng loạt)
  // =================================================================

  // Gửi thông báo new post trong event
  static async notifyNewPost(event_id, post_id, author_id, content_preview) {
    try {
      // 1. Lấy danh sách user cần gửi (Raw Query)
      const users = await sequelize.query(
        `SELECT DISTINCT r.user_id 
         FROM Registrations r
         WHERE r.event_id = ? AND r.status = 'approved' AND r.user_id != ?`,
        {
          replacements: [event_id, author_id],
          type: QueryTypes.SELECT,
        }
      );

      // 2. Lấy thông tin event
      const events = await sequelize.query(
        `SELECT title FROM Events WHERE event_id = ?`,
        {
          replacements: [event_id],
          type: QueryTypes.SELECT,
        }
      );
      const event_title = events[0]?.title || "Sự kiện";

      // 3. Gửi thông báo hàng loạt
      const promises = users.map((user) =>
        this.createNotificationFromTrigger(user.user_id, "new_post", {
          event_id,
          event_title,
          post_id,
          author_id,
          content_preview: content_preview.substring(0, 100),
          message: `Có bài đăng mới trong sự kiện "${event_title}"`,
        })
      );

      await Promise.all(promises);
      console.log(`Đã gửi thông báo new_post cho ${users.length} người dùng`);
    } catch (error) {
      console.error("Lỗi gửi thông báo new post:", error);
    }
  }

  // Gửi thông báo new comment
  static async notifyNewComment(
    event_id,
    comment_id,
    post_id,
    author_id,
    content_preview
  ) {
    try {
      const users = await sequelize.query(
        `SELECT DISTINCT r.user_id 
         FROM Registrations r
         WHERE r.event_id = ? AND r.status = 'approved' AND r.user_id != ?`,
        {
          replacements: [event_id, author_id],
          type: QueryTypes.SELECT,
        }
      );

      const events = await sequelize.query(
        `SELECT title FROM Events WHERE event_id = ?`,
        {
          replacements: [event_id],
          type: QueryTypes.SELECT,
        }
      );
      const event_title = events[0]?.title || "Sự kiện";

      const promises = users.map((user) =>
        this.createNotificationFromTrigger(user.user_id, "new_comment", {
          event_id,
          event_title,
          comment_id,
          post_id,
          author_id,
          content_preview: content_preview.substring(0, 100),
          message: `Có bình luận mới trong sự kiện "${event_title}"`,
        })
      );

      await Promise.all(promises);
      console.log(
        `Đã gửi thông báo new_comment cho ${users.length} người dùng`
      );
    } catch (error) {
      console.error("Lỗi gửi thông báo new comment:", error);
    }
  }

  // Gửi thông báo reaction received
  static async notifyReactionReceived(
    user_id,
    content_type,
    content_id,
    reactor_id,
    reactor_name
  ) {
    return await this.createNotificationFromTrigger(
      user_id,
      "reaction_received",
      {
        content_type,
        content_id,
        reactor_id,
        reactor_name,
        message: `${reactor_name} đã thích ${
          content_type === "post" ? "bài viết" : "bình luận"
        } của bạn`,
      }
    );
  }

  // Gửi thông báo có đăng ký mới (cho manager)
  static async notifyNewRegistrationToManager(
    manager_id,
    event_id,
    event_title,
    user_id,
    user_name
  ) {
    return await this.createNotificationFromTrigger(
      manager_id,
      "new_registration",
      {
        event_id,
        event_title,
        user_id,
        user_name,
        message: `Có đăng ký mới từ ${user_name} cho sự kiện "${event_title}"`,
      }
    );
  }

  // Gửi thông báo event reminder (24h trước khi event bắt đầu)
  static async sendEventReminders() {
    try {
      // Lấy sự kiện sắp diễn ra trong 24h tới
      const events = await sequelize.query(
        `SELECT e.event_id, e.title, e.start_date, e.location
         FROM Events e
         WHERE e.approval_status = 'approved'
         AND e.is_deleted = FALSE
         AND e.start_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)`,
        { type: QueryTypes.SELECT }
      );

      let totalNotifications = 0;

      for (const event of events) {
        const participants = await sequelize.query(
          `SELECT r.user_id, u.full_name 
           FROM Registrations r
           JOIN Users u ON r.user_id = u.user_id
           WHERE r.event_id = ? AND r.status = 'approved'`,
          {
            replacements: [event.event_id],
            type: QueryTypes.SELECT,
          }
        );

        const promises = participants.map((participant) =>
          this.createNotificationFromTrigger(
            participant.user_id,
            "event_reminder",
            {
              event_id: event.event_id,
              title: event.title,
              start_date: event.start_date,
              location: event.location,
              message: `Sự kiện "${event.title}" sẽ diễn ra vào ${new Date(
                event.start_date
              ).toLocaleString("vi-VN")} tại ${event.location}`,
            }
          )
        );

        await Promise.all(promises);
        totalNotifications += participants.length;
      }

      console.log(
        `Đã gửi reminder cho ${totalNotifications} người tham gia ${events.length} sự kiện`
      );
      return totalNotifications;
    } catch (error) {
      console.error("Lỗi gửi event reminders:", error);
      throw error;
    }
  }

  // Cron job để chạy reminders hàng ngày
  static async startReminderCronJob() {
    // Chạy mỗi ngày một lần
    setInterval(
      async () => {
        try {
          await this.sendEventReminders();
        } catch (error) {
          console.error("Lỗi trong cron job reminders:", error);
        }
      },
      24 * 60 * 60 * 1000
    ); // 24 giờ

    // Chạy ngay lần đầu
    // await this.sendEventReminders(); // Tạm tắt để không spam khi restart server
  }

  // Helper gửi push thủ công (nếu cần)
  static async sendPushNotification(user_id, type, payload) {
    try {
      const notificationConfig = {
        event_approved: {
          title: "Sự kiện đã được duyệt",
          body: `Sự kiện "${payload.title}" đã được phê duyệt`,
        },
        registration_approved: {
          title: "Đăng ký thành công",
          body: "Đăng ký tham gia sự kiện đã được chấp nhận",
        },
        // ... thêm các type khác
      };

      const config = notificationConfig[type] || {
        title: "VolunteerHub",
        body: "Bạn có thông báo mới",
      };

      await WebPushService.sendPushNotification(user_id, {
        ...config,
        notification_id: payload.notification_id,
        type: type,
        url: `/notifications/${payload.notification_id}`,
        data: payload,
      });
    } catch (error) {
      console.error("Send push notification error:", error);
    }
  }

  // Thông báo sự kiện bị hủy cho tất cả volunteers đã đăng ký
  static async notifyEventCancelled(event_id, reason) {
    try {
      const registrations = await sequelize.query(
        `SELECT user_id FROM Registrations WHERE event_id = ?`,
        {
          replacements: [event_id],
          type: QueryTypes.SELECT,
        }
      );

      const events = await sequelize.query(
        `SELECT title FROM Events WHERE event_id = ?`,
        {
          replacements: [event_id],
          type: QueryTypes.SELECT,
        }
      );
      const event_title = events[0]?.title || "Sự kiện";

      const notifications = [];
      for (const registration of registrations) {
        const notification = await this.createNotificationFromTrigger(
          registration.user_id,
          "event_cancelled",
          {
            event_id: event_id,
            event_title: event_title,
            reason: reason,
            message: `Sự kiện "${event_title}" đã bị hủy: ${reason}`,
          }
        );
        notifications.push(notification);
      }

      console.log(
        `Đã gửi thông báo hủy sự kiện cho ${notifications.length} volunteers`
      );
      return notifications;
    } catch (error) {
      console.error("Lỗi gửi thông báo hủy sự kiện:", error);
      throw error;
    }
  }
}

export default NotificationService;
