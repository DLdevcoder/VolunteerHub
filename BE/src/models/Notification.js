import pool from "../config/db.js";

class Notification {
  // Lấy danh sách thông báo của user
  static async findByUserId(
    user_id,
    { page = 1, limit = 20, is_read, type } = {}
  ) {
    try {
      const numPage = Number(page);
      const numLimit = Number(limit);

      const safePage = Number.isInteger(numPage) && numPage > 0 ? numPage : 1;
      const safeLimit =
        Number.isInteger(numLimit) && numLimit > 0 ? numLimit : 20;

      const offset = (safePage - 1) * safeLimit;

      let whereConditions = ["user_id = ?"];
      let queryParams = [user_id];

      if (is_read !== undefined) {
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

      const listSql = `
        SELECT 
          notification_id, user_id, type, payload, is_read, created_at, updated_at
        FROM Notifications
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT ${safeLimit} OFFSET ${offset}
      `;

      const [notifications] = await pool.execute(listSql, queryParams);

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
          limit: safeLimit,
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
      let processedPayload = payload;
      if (payload && typeof payload === "object") {
        processedPayload = JSON.stringify(payload);
      }

      const [result] = await pool.execute(
        `INSERT INTO Notifications (user_id, type, payload) 
         VALUES (?, ?, ?)`,
        [user_id, type, processedPayload]
      );

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

      // manager tạo event → admin phải duyệt
      "event_pending_approval",

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

      // NEW TYPES
      "role_changed",
      "test_notification",
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
      event_pending_approval: "Sự kiện mới chờ duyệt",

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

      // NEW
      role_changed: "Quyền tài khoản đã thay đổi",
      test_notification: "Thông báo thử hệ thống",
    };

    return titles[type] || "Thông báo mới";
  }

  // 🔥 UPDATED: Ưu tiên payload.message, sau đó build từ event_title / reason
  static getNotificationBody(type, payload) {
    let payloadObj = null;
    try {
      if (typeof payload === "string") {
        payloadObj = JSON.parse(payload);
      } else if (typeof payload === "object" && payload !== null) {
        payloadObj = payload;
      }
    } catch {
      payloadObj = null;
    }

    const defaultBodies = {
      // Event related
      event_approved: "Sự kiện của bạn đã được phê duyệt",
      event_rejected: "Sự kiện của bạn đã bị từ chối",
      event_reminder: "Sự kiện sắp diễn ra",
      event_updated_urgent: "Sự kiện có thông tin quan trọng được cập nhật",
      event_starting_soon: "Sự kiện sẽ bắt đầu trong 1 giờ tới",
      event_cancelled: "Sự kiện bạn đã đăng ký đã bị hủy",
      event_pending_approval:
        "Có sự kiện mới được tạo bởi Manager, cần xem xét và duyệt.",

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
      account_unlocked: "Tài khoản volunteer đã được mở khóa",
      manager_account_unlocked: "Tài khoản manager đã được mở khóa",

      // NEW
      role_changed: "Quyền tài khoản của bạn đã được thay đổi.",
      test_notification: "Đây là thông báo test từ hệ thống.",
    };

    const eventTitle = payloadObj?.event_title;
    const reason = payloadObj?.reason || payloadObj?.rejection_reason;
    const userName =
      payloadObj?.user_name ||
      payloadObj?.manager_name ||
      payloadObj?.reactor_name;

    // 1️⃣ Ưu tiên các case cần hiển thị reason / thông tin chi tiết
    switch (type) {
      // ===== EVENT =====
      case "event_approved":
        if (eventTitle) {
          return `Sự kiện "${eventTitle}" đã được phê duyệt.`;
        }
        break;

      case "event_rejected":
        if (eventTitle && reason) {
          return `Sự kiện "${eventTitle}" đã bị từ chối.\nLý do: ${reason}`;
        }
        if (eventTitle) {
          return `Sự kiện "${eventTitle}" đã bị từ chối.`;
        }
        if (reason) {
          return `Sự kiện của bạn đã bị từ chối.\nLý do: ${reason}`;
        }
        break;

      case "event_cancelled":
        if (eventTitle && reason) {
          return `Sự kiện "${eventTitle}" đã bị hủy.\nLý do: ${reason}`;
        }
        if (eventTitle) {
          return `Sự kiện "${eventTitle}" đã bị hủy.`;
        }
        if (reason) {
          return `Một sự kiện đã bị hủy.\nLý do: ${reason}`;
        }
        break;

      case "event_reminder":
        if (eventTitle) {
          return `Nhắc nhở: Sự kiện "${eventTitle}" sắp diễn ra.`;
        }
        break;

      case "event_starting_soon":
        if (eventTitle) {
          return `Sự kiện "${eventTitle}" sẽ bắt đầu trong thời gian ngắn.`;
        }
        break;

      case "event_updated_urgent":
        if (eventTitle) {
          return `Sự kiện "${eventTitle}" có cập nhật quan trọng. Vui lòng kiểm tra chi tiết.`;
        }
        break;

      case "event_pending_approval":
        if (eventTitle) {
          return `Sự kiện "${eventTitle}" vừa được tạo và đang chờ duyệt.`;
        }
        break;

      // ===== REGISTRATION =====
      case "registration_approved":
        if (eventTitle) {
          return `Đăng ký của bạn cho sự kiện "${eventTitle}" đã được chấp nhận.`;
        }
        break;

      case "registration_rejected":
        if (eventTitle && reason) {
          return `Đăng ký của bạn cho sự kiện "${eventTitle}" đã bị từ chối.\nLý do: ${reason}`;
        }
        if (eventTitle) {
          return `Đăng ký của bạn cho sự kiện "${eventTitle}" đã bị từ chối.`;
        }
        if (reason) {
          return `Đăng ký của bạn đã bị từ chối.\nLý do: ${reason}`;
        }
        break;

      case "registration_completed":
        if (eventTitle) {
          return `Bạn đã được xác nhận hoàn thành sự kiện "${eventTitle}". Cảm ơn bạn đã tham gia!`;
        }
        break;

      case "new_registration":
        if (eventTitle && userName) {
          return `Có đăng ký mới từ ${userName} cho sự kiện "${eventTitle}".`;
        }
        if (eventTitle) {
          return `Có đăng ký mới cho sự kiện "${eventTitle}".`;
        }
        break;

      // ===== ACCOUNT =====
      case "account_locked":
        if (reason) {
          return `Tài khoản của bạn đã bị khóa.\nLý do: ${reason}`;
        }
        break;

      case "manager_account_locked":
        if (userName && reason) {
          return `Manager ${userName} đã bị khóa tài khoản.\nLý do: ${reason}`;
        }
        if (userName) {
          return `Manager ${userName} đã bị khóa tài khoản.`;
        }
        break;

      case "account_unlocked":
        return "Tài khoản của bạn đã được mở khóa.";

      case "manager_account_unlocked":
        if (userName) {
          return `Manager ${userName} đã được mở khóa tài khoản.`;
        }
        break;

      case "role_changed":
        return "Quyền tài khoản của bạn đã được thay đổi.";

      default:
        break;
    }

    // 2️⃣ Nếu controller có set payload.message -> dùng như fallback thông minh
    if (
      payloadObj &&
      typeof payloadObj.message === "string" &&
      payloadObj.message.trim().length > 0
    ) {
      return payloadObj.message.trim();
    }

    // 3️⃣ Cuối cùng: fallback về text mặc định
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
        // Event related
        event_approved: `/events/${payload?.event_id}`,
        event_rejected: `/events/${payload?.event_id}`,
        event_reminder: `/events/${payload?.event_id}`,
        event_updated_urgent: `/events/${payload?.event_id}`,
        event_starting_soon: `/events/${payload?.event_id}`,
        event_cancelled: `/events/${payload?.event_id}`,
        event_pending_approval: `/admin/events?event_id=${payload?.event_id}`,

        // Registration related
        registration_approved: `/my-registrations`,
        registration_rejected: `/my-registrations`,
        registration_completed: `/my-registrations`,
        new_registration: `/events/${payload?.event_id}/registrations`,

        // Content related
        new_post: `/posts/${payload?.post_id || payload?.content_id}`,
        new_comment: `/posts/${payload?.post_id}`,
        reaction_received: `/posts/${payload?.post_id || payload?.content_id}`,

        // Account related
        account_locked: `/profile`,
        manager_account_locked: `/admin/users`,
        account_unlocked: `/profile`,
        manager_account_unlocked: `/admin/users`,

        // NEW
        role_changed: `/profile`,
        test_notification: `/notifications`,
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
      const safeLimit =
        Number.isInteger(Number(limit)) && Number(limit) > 0
          ? Number(limit)
          : 10;

      const sql = `
        SELECT notification_id, user_id, type, payload, is_read, created_at
        FROM Notifications
        WHERE user_id = ?
          AND is_read = FALSE
        ORDER BY created_at DESC
        LIMIT ${safeLimit}
      `;

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
