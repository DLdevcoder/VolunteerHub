import pool from "../config/db.js";

class Notification {
  // Lấy danh sách thông báo của user
  static async findByUserId(
    user_id,
    { page = 1, limit = 20, is_read, type } = {}
  ) {
    try {
      // 1. Ép và validate page/limit an toàn
      const numPage = Number(page);
      const numLimit = Number(limit);

      const safePage = Number.isInteger(numPage) && numPage > 0 ? numPage : 1;

      const safeLimit =
        Number.isInteger(numLimit) && numLimit > 0 ? numLimit : 20;

      const offset = (safePage - 1) * safeLimit;

      // 2. Build WHERE + params như cũ
      let whereConditions = ["user_id = ?"];
      let queryParams = [user_id];

      if (is_read !== undefined) {
        // is_read lấy từ query string: "true" | "false" | ...
        // -> convert rõ ràng sang 0/1 cho chắc
        const isReadBool =
          is_read === true ||
          is_read === "true" ||
          is_read === "1" ||
          is_read === 1;
        whereConditions.push("is_read = ?");
        queryParams.push(isReadBool ? 1 : 0);
      }

      if (type) {
        whereConditions.push("type = ?");
        queryParams.push(type);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // 3. Query list: LIMIT/OFFSET dùng số đã sanitize, không dùng ?
      const listSql = `
      SELECT 
        notification_id, type, payload, is_read, created_at, updated_at
      FROM Notifications
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${safeLimit} OFFSET ${offset}
    `;

      const [notifications] = await pool.execute(listSql, queryParams);

      // 4. Query count: vẫn dùng params bình thường
      const countSql = `
      SELECT COUNT(*) as total
      FROM Notifications
      ${whereClause}
    `;
      const [countResult] = await pool.execute(countSql, queryParams);

      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / safeLimit);

      return {
        notifications,
        pagination: {
          current_page: safePage,
          total_pages: totalPages,
          total_records: total,
          has_next: safePage < totalPages,
          has_prev: safePage > 1,
          limit: safeLimit, // thêm luôn cho tiện FE đọc
        },
      };
    } catch (error) {
      throw new Error(`Database error in findByUserId: ${error.message}`);
    }
  }

  // Đếm số thông báo chưa đọc
  static async countUnread(user_id) {
    try {
      const [result] = await pool.execute(
        `SELECT COUNT(*) as unread_count
         FROM Notifications 
         WHERE user_id = ? AND is_read = FALSE`,
        [user_id]
      );

      return result[0].unread_count;
    } catch (error) {
      throw new Error(`Database error in countUnread: ${error.message}`);
    }
  }

  // Tạo thông báo mới
  static async create(notificationData) {
    const { user_id, type, payload } = notificationData;

    if (!this.isValidType(type)) {
      throw new Error(`Invalid notification type: ${type}`);
    }

    try {
      // Tự động stringify nếu payload là object
      let processedPayload = payload;
      if (payload && typeof payload === "object") {
        processedPayload = JSON.stringify(payload);
      }

      const [result] = await pool.execute(
        `INSERT INTO Notifications (user_id, type, payload) 
         VALUES (?, ?, ?)`,
        [user_id, type, processedPayload]
      );

      // Lấy thông báo vừa tạo
      const [notifications] = await pool.execute(
        `SELECT * FROM Notifications WHERE notification_id = ?`,
        [result.insertId]
      );

      return notifications[0];
    } catch (error) {
      throw new Error(`Database error in create: ${error.message}`);
    }
  }

  // Tạo và gửi thông báo push
  static async createAndPush(notificationData) {
    try {
      const notification = await this.create(notificationData);
      try {
        const WebPushService = await import("../services/WebPushService.js");

        const pushData = {
          title: this.getNotificationTitle(notification.type),
          body: this.getNotificationBody(
            notification.type,
            notification.payload
          ),
          notification_id: notification.notification_id,
          type: notification.type,
          url: this.getNotificationUrl(notification),
          data: {
            event_id: this.getPayloadValue(notification.payload, "event_id"),
            user_id: this.getPayloadValue(notification.payload, "user_id"),
            registration_id: this.getPayloadValue(
              notification.payload,
              "registration_id"
            ),
          },
        };

        await WebPushService.default.sendPushNotification(
          notification.user_id,
          pushData
        );
        console.log(
          `Web Push sent successfully to user ${notification.user_id}`
        );
      } catch (pushError) {
        console.error(
          "Web Push failed, but notification saved to database:",
          pushError
        );
      }

      return notification;
    } catch (error) {
      console.error("Error in createAndPush:", error);
      throw error;
    }
  }

  // Helper method để lấy giá trị từ payload
  static getPayloadValue(payload, key) {
    try {
      const payloadObj =
        typeof payload === "string" ? JSON.parse(payload) : payload;
      return payloadObj?.[key] || null;
    } catch (error) {
      return null;
    }
  }

  // Đánh dấu thông báo là đã đọc
  static async markAsRead(notification_id, user_id) {
    try {
      const [result] = await pool.execute(
        `UPDATE Notifications 
         SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE notification_id = ? AND user_id = ?`,
        [notification_id, user_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in markAsRead: ${error.message}`);
    }
  }

  // Đánh dấu tất cả thông báo là đã đọc
  static async markAllAsRead(user_id) {
    try {
      const [result] = await pool.execute(
        `UPDATE Notifications 
         SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = ? AND is_read = FALSE`,
        [user_id]
      );

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Database error in markAllAsRead: ${error.message}`);
    }
  }

  // Xóa thông báo
  static async delete(notification_id, user_id) {
    try {
      const [result] = await pool.execute(
        `DELETE FROM Notifications 
         WHERE notification_id = ? AND user_id = ?`,
        [notification_id, user_id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Database error in delete: ${error.message}`);
    }
  }

  // Kiểm tra thông báo thuộc về user
  static async belongsToUser(notification_id, user_id) {
    try {
      const [notifications] = await pool.execute(
        `SELECT notification_id FROM Notifications 
         WHERE notification_id = ? AND user_id = ?`,
        [notification_id, user_id]
      );

      return notifications.length > 0;
    } catch (error) {
      throw new Error(`Database error in belongsToUser: ${error.message}`);
    }
  }

  // Lấy thông báo by ID
  static async findById(notification_id) {
    try {
      const [notifications] = await pool.execute(
        `SELECT * FROM Notifications WHERE notification_id = ?`,
        [notification_id]
      );

      return notifications[0] || null;
    } catch (error) {
      throw new Error(`Database error in findById: ${error.message}`);
    }
  }

  // Validate notification type - ĐẦY ĐỦ CÁC TYPE THEO DB
  static isValidType(type) {
    const validTypes = [
      // Event related
      "event_approved",
      "event_rejected",
      "event_reminder",
      "event_updated_urgent",
      "event_starting_soon",
      "event_cancelled",

      // Registration related
      "registration_approved",
      "registration_rejected",
      "registration_completed",
      "new_registration",

      // Content related (wall-like)
      "new_post",
      "new_comment",
      "reaction_received",

      // Account related
      "account_locked",
      "manager_account_locked",
      "account_unlocked",
      "manager_account_unlocked",
    ];

    return validTypes.includes(type);
  }

  // Helper methods cho nội dung thông báo
  static getNotificationTitle(type) {
    const titles = {
      // Event related
      event_approved: "Sự kiện đã được duyệt",
      event_rejected: "Sự kiện bị từ chối",
      event_reminder: "Nhắc nhở sự kiện",
      event_updated_urgent: "Sự kiện được cập nhật khẩn",
      event_starting_soon: "Sự kiện sắp bắt đầu",
      event_cancelled: "Sự kiện đã bị hủy",

      // Registration related
      registration_approved: "Đăng ký được chấp nhận",
      registration_rejected: "Đăng ký bị từ chối",
      registration_completed: "Hoàn thành sự kiện",
      new_registration: "Có đăng ký mới",

      // Content related
      new_post: "Bài viết mới",
      new_comment: "Bình luận mới",
      reaction_received: "Có tương tác mới",

      // Account related
      account_locked: "Tài khoản bị khóa",
      manager_account_locked: "Manager bị khóa",
      account_unlocked: "Tài khoản đã được mở khóa",
      manager_account_unlocked: "Manager đã được mở khóa",
    };

    return titles[type] || "Thông báo mới";
  }

  static getNotificationBody(type, payload) {
    const defaultBodies = {
      // Event related
      event_approved: "Sự kiện của bạn đã được phê duyệt",
      event_rejected: "Sự kiện của bạn đã bị từ chối",
      event_reminder: "Sự kiện sắp diễn ra",
      event_updated_urgent: "Sự kiện có thông tin quan trọng được cập nhật",
      event_starting_soon: "Sự kiện sẽ bắt đầu trong 1 giờ tới",
      event_cancelled: "Sự kiện bạn đã đăng ký đã bị hủy",

      // Registration related
      registration_approved:
        "Đăng ký tham gia sự kiện của bạn đã được chấp nhận",
      registration_rejected: "Đăng ký tham gia sự kiện của bạn đã bị từ chối",
      registration_completed: "Bạn đã hoàn thành sự kiện thành công",
      new_registration: "Có người mới đăng ký tham gia sự kiện",

      // Content related
      new_post: "Có bài viết mới trong sự kiện",
      new_comment: "Có bình luận mới trong bài viết",
      reaction_received: "Bài viết của bạn nhận được tương tác mới",

      // Account related
      account_locked: "Tài khoản volunteer đã bị khóa",
      manager_account_locked: "Tài khoản manager đã bị khóa",
      account_unlocked: "Tài khoản volunteer mở bị khóa",
      manager_account_unlocked: "Tài khoản manager đã mở khóa",
    };

    return defaultBodies[type] || "Bạn có thông báo mới";
  }

  // Lấy URL cho thông báo (dùng để điều hướng khi click)
  static getNotificationUrl(notification) {
    try {
      const payload =
        typeof notification.payload === "string"
          ? JSON.parse(notification.payload)
          : notification.payload;

      const urlMap = {
        // Event related - đi đến trang sự kiện
        event_approved: `/events/${payload?.event_id}`,
        event_rejected: `/events/${payload?.event_id}`,
        event_reminder: `/events/${payload?.event_id}`,
        event_updated_urgent: `/events/${payload?.event_id}`,
        event_starting_soon: `/events/${payload?.event_id}`,
        event_cancelled: `/events/${payload?.event_id}`,

        // Registration related - đi đến trang đăng ký của tôi
        registration_approved: `/my-registrations`,
        registration_rejected: `/my-registrations`,
        registration_completed: `/my-registrations`,
        new_registration: `/events/${payload?.event_id}/registrations`,

        // Content related - đi đến bài viết/comment
        new_post: `/posts/${payload?.post_id || payload?.content_id}`,
        new_comment: `/posts/${payload?.post_id}`,
        reaction_received: `/posts/${payload?.post_id || payload?.content_id}`,

        // Account related - đi đến trang tài khoản
        account_locked: `/profile`,
        manager_account_locked: `/admin/users`,
      };

      return urlMap[notification.type] || "/notifications";
    } catch (error) {
      return "/notifications";
    }
  }

  // Bulk create notifications for multiple users
  static async bulkCreateForUsers(userIds, notificationData) {
    try {
      const { type, payload } = notificationData;

      if (!this.isValidType(type)) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      // Tự động stringify payload
      let processedPayload = payload;
      if (payload && typeof payload === "object") {
        processedPayload = JSON.stringify(payload);
      }

      const values = userIds.map((user_id) => [
        user_id,
        type,
        processedPayload,
      ]);

      const placeholders = userIds.map(() => "(?, ?, ?)").join(", ");

      const [result] = await pool.execute(
        `INSERT INTO Notifications (user_id, type, payload) 
         VALUES ${placeholders}`,
        values.flat()
      );

      return result.affectedRows;
    } catch (error) {
      throw new Error(`Database error in bulkCreateForUsers: ${error.message}`);
    }
  }

  // Lấy thông báo chưa đọc gần đây
  static async getRecentUnread(user_id, limit = 10) {
    try {
      // Convert limit to a safe integer
      const safeLimit =
        Number.isInteger(Number(limit)) && Number(limit) > 0
          ? Number(limit)
          : 10;

      const sql = `
      SELECT notification_id, type, payload, created_at
      FROM Notifications
      WHERE user_id = ?
        AND is_read = FALSE
      ORDER BY created_at DESC
      LIMIT ${safeLimit}
    `;

      // Chỉ còn 1 dấu ? nên chỉ truyền user_id
      const [notifications] = await pool.execute(sql, [user_id]);
      return notifications;
    } catch (error) {
      throw new Error(`Database error in getRecentUnread: ${error.message}`);
    }
  }

  // Lấy thông báo theo loại
  static async findByType(user_id, type, limit = 20) {
    try {
      const [notifications] = await pool.execute(
        `SELECT notification_id, type, payload, is_read, created_at
         FROM Notifications 
         WHERE user_id = ? AND type = ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [user_id, type, limit]
      );
      return notifications;
    } catch (error) {
      throw new Error(`Database error in findByType: ${error.message}`);
    }
  }

  // Lấy thông báo theo khoảng thời gian
  static async findByTimeRange(user_id, startDate, endDate, limit = 50) {
    try {
      const [notifications] = await pool.execute(
        `SELECT notification_id, type, payload, is_read, created_at
         FROM Notifications 
         WHERE user_id = ? AND created_at BETWEEN ? AND ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [user_id, startDate, endDate, limit]
      );
      return notifications;
    } catch (error) {
      throw new Error(`Database error in findByTimeRange: ${error.message}`);
    }
  }
}

export default Notification;
