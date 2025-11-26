import pool from "../config/db.js";

class Notification {
  // Lấy danh sách thông báo của user
  static async findByUserId(
    user_id,
    { page = 1, limit = 20, is_read, type } = {}
  ) {
    try {
      const offset = (page - 1) * limit;

      let whereConditions = ["user_id = ?"];
      let queryParams = [user_id];

      if (is_read !== undefined) {
        whereConditions.push("is_read = ?");
        queryParams.push(is_read === "true");
      }

      if (type) {
        whereConditions.push("type = ?");
        queryParams.push(type);
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

      return {
        notifications,
        pagination: {
          current_page: parseInt(page),
          total_pages: totalPages,
          total_records: total,
          has_next: page < totalPages,
          has_prev: page > 1,
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
    let { user_id, type, payload } = notificationData;

    console.log("=== DEBUG NOTIFICATION CREATE ===");
    console.log("user_id:", user_id, "type:", type);
    console.log("payload:", payload);
    console.log("payload type:", typeof payload);

    // CHỈ STRINGIFY NẾU PAYLOAD LÀ OBJECT VÀ CHƯA STRINGIFY
    if (payload && typeof payload === "object") {
      payload = JSON.stringify(payload);
      console.log("payload after stringify:", payload);
    }

    // VALIDATE KHÔNG CÓ UNDEFINED
    if (user_id === undefined || type === undefined || payload === undefined) {
      console.log(
        "UNDEFINED FOUND - user_id:",
        user_id,
        "type:",
        type,
        "payload:",
        payload
      );
      throw new Error(
        `Cannot have undefined values: user_id=${user_id}, type=${type}, payload=${payload}`
      );
    }

    try {
      const [result] = await pool.execute(
        `INSERT INTO Notifications (user_id, type, payload) 
         VALUES (?, ?, ?)`,
        [user_id, type, payload]
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

  // Validate notification type - PHẢI KHỚP VỚI ENUM TRONG DB
  static isValidType(type) {
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
      "new_registration",
    ];

    return validTypes.includes(type);
  }

  // Các method hỗ trợ Web Push (tùy chọn - nếu triển khai sau)
  static async createAndPush(notificationData) {
    try {
      const notification = await this.create(notificationData);

      return notification;
    } catch (error) {
      console.error("Error in createAndPush:", error);
      throw error;
    }
  }

  // Helper cho nội dung thông báo
  static getNotificationTitle(type) {
    const titles = {
      event_approved: "Sự kiện đã được duyệt",
      event_rejected: "Sự kiện bị từ chối",
      registration_approved: "Đăng ký được chấp nhận",
      registration_rejected: "Đăng ký bị từ chối",
      registration_completed: "Hoàn thành sự kiện",
      event_reminder: "Nhắc nhở sự kiện",
      new_post: "Bài viết mới",
      new_comment: "Bình luận mới",
      reaction_received: "Có tương tác mới",
    };

    return titles[type] || "Thông báo mới";
  }

  static getNotificationBody(type, payload) {
    const defaultBodies = {
      event_approved: "Sự kiện của bạn đã được phê duyệt",
      event_rejected: "Sự kiện của bạn đã bị từ chối",
      registration_approved:
        "Đăng ký tham gia sự kiện của bạn đã được chấp nhận",
      registration_rejected: "Đăng ký tham gia sự kiện của bạn đã bị từ chối",
      registration_completed: "Bạn đã hoàn thành sự kiện thành công",
      event_reminder: "Sự kiện sắp diễn ra",
      new_post: "Có bài viết mới trong sự kiện",
      new_comment: "Có bình luận mới trong bài viết",
      reaction_received: "Bài viết của bạn nhận được tương tác mới",
    };

    return defaultBodies[type] || "Bạn có thông báo mới";
  }
}

export default Notification;
