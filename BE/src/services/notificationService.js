import pool from "../config/db.js";
import Notification from "../models/Notification.js";

class NotificationService {
  // Tạo thông báo từ trigger
  static async createNotificationFromTrigger(user_id, type, payload) {
    try {
      const notification = await Notification.createAndPush({
        user_id,
        type,
        payload,
      });

      console.log(`Đã tạo thông báo: ${type} cho user ${user_id}`);
      return notification.notification_id;
    } catch (error) {
      console.error("Lỗi tạo thông báo từ trigger:", error);
      throw error;
    }
  }

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

  // Gửi thông báo new post trong event
  static async notifyNewPost(event_id, post_id, author_id, content_preview) {
    try {
      const [users] = await pool.execute(
        `SELECT DISTINCT r.user_id 
         FROM Registrations r
         WHERE r.event_id = ? AND r.status = 'approved' AND r.user_id != ?`,
        [event_id, author_id]
      );

      // Lấy thông tin event để thêm vào payload
      const [events] = await pool.execute(
        `SELECT title FROM Events WHERE event_id = ?`,
        [event_id]
      );
      const event_title = events[0]?.title || "Sự kiện";

      // Gửi thông báo cho từng user
      const promises = users.map((user) =>
        this.createNotificationFromTrigger(user.user_id, "new_post", {
          event_id,
          event_title,
          post_id,
          author_id,
          content_preview: content_preview.substring(0, 100), // Giới hạn độ dài
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
      const [users] = await pool.execute(
        `SELECT DISTINCT r.user_id 
         FROM Registrations r
         WHERE r.event_id = ? AND r.status = 'approved' AND r.user_id != ?`,
        [event_id, author_id]
      );

      // Lấy thông tin event
      const [events] = await pool.execute(
        `SELECT title FROM Events WHERE event_id = ?`,
        [event_id]
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
      "new_registration", // Cần thêm type này vào ENUM
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
      const [events] = await pool.execute(
        `SELECT e.event_id, e.title, e.start_date, e.location
         FROM Events e
         WHERE e.approval_status = 'approved'
         AND e.is_deleted = FALSE
         AND e.start_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)`
      );

      let totalNotifications = 0;

      for (const event of events) {
        const [participants] = await pool.execute(
          `SELECT r.user_id, u.full_name 
           FROM Registrations r
           JOIN Users u ON r.user_id = u.user_id
           WHERE r.event_id = ? AND r.status = 'approved'`,
          [event.event_id]
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
    setInterval(async () => {
      try {
        await this.sendEventReminders();
      } catch (error) {
        console.error("Lỗi trong cron job reminders:", error);
      }
    }, 24 * 60 * 60 * 1000); // 24 giờ

    // Chạy ngay lần đầu
    await this.sendEventReminders();
  }

  // Thông báo sự kiện bị hủy cho tất cả volunteers đã đăng ký
  static async notifyEventCancelled(event_id, reason) {
    try {
      // Lấy tất cả volunteers đã đăng ký (mọi trạng thái)
      const [registrations] = await pool.execute(
        `SELECT user_id FROM Registrations WHERE event_id = ?`,
        [event_id]
      );

      // Lấy thông tin event
      const [events] = await pool.execute(
        `SELECT title FROM Events WHERE event_id = ?`,
        [event_id]
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
