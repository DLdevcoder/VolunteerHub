import pool from "../config/db.js";
import Notification from "../models/Notification.js";

class NotificationService {
  // Tạo thông báo từ trigger
  static async createNotificationFromTrigger(user_id, type, payload) {
    try {
      const notification = await Notification.create({
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
  static async notifyEventRejected(manager_id, event_id, event_title) {
    return await this.createNotificationFromTrigger(
      manager_id,
      "event_rejected",
      { event_id, title: event_title, message: "Sự kiện của bạn đã bị từ chối" }
    );
  }

  // Gửi thông báo registration approved
  static async notifyRegistrationApproved(user_id, event_id) {
    return await this.createNotificationFromTrigger(
      user_id,
      "registration_approved",
      { event_id, message: "Đăng ký tham gia sự kiện đã được chấp nhận" }
    );
  }

  // Gửi thông báo registration rejected
  static async notifyRegistrationRejected(user_id, event_id, reason) {
    return await this.createNotificationFromTrigger(
      user_id,
      "registration_rejected",
      { event_id, reason, message: "Đăng ký tham gia sự kiện đã bị từ chối" }
    );
  }

  // Gửi thông báo new post trong event
  static async notifyNewPost(event_id, post_id, author_id, content_preview) {
    const [users] = await pool.execute(
      `SELECT DISTINCT user_id FROM Registrations 
             WHERE event_id = ? AND status = 'approved' AND user_id != ?`,
      [event_id, author_id]
    );

    // Gửi thông báo cho từng user
    const promises = users.map((user) =>
      this.createNotificationFromTrigger(user.user_id, "new_post", {
        event_id,
        post_id,
        message: `Có bài đăng mới trong sự kiện: ${content_preview}`,
      })
    );

    await Promise.all(promises);
  }

  // Gửi thông báo event reminder (24h trước khi event bắt đầu)
  static async sendEventReminders() {
    try {
      // Giữ nguyên pool để quét sự kiện
      const [events] = await pool.execute(
        `SELECT e.event_id, e.title, e.start_date
                 FROM Events e
                 WHERE e.approval_status = 'approved'
                 AND e.start_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 24 HOUR)`
      );

      for (const event of events) {
        const [participants] = await pool.execute(
          `SELECT user_id FROM Registrations 
                     WHERE event_id = ? AND status = 'approved'`,
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
              message: `Sự kiện "${event.title}" sẽ diễn ra trong 24h tới`,
            }
          )
        );

        await Promise.all(promises);
      }

      console.log(`Đã gửi reminder cho ${events.length} sự kiện`);
    } catch (error) {
      console.error("Lỗi gửi event reminders:", error);
    }
  }
}

export default NotificationService;
