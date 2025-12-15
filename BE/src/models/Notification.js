import { DataTypes, Model, Op } from "sequelize";
import sequelize from "../config/db.js";

class Notification extends Model {
  // =================================================================
  // CÁC HÀM STATIC THAO TÁC CSDL (ĐÃ CHUYỂN SANG SEQUELIZE)
  // =================================================================

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

      // Xây dựng điều kiện lọc
      const whereConditions = { user_id: user_id };

      if (is_read !== undefined) {
        const isReadBool =
          is_read === true ||
          is_read === "true" ||
          is_read === "1" ||
          is_read === 1;
        whereConditions.is_read = isReadBool;
      }

      if (type) {
        whereConditions.type = type;
      }

      // Dùng findAndCountAll để vừa lấy dữ liệu vừa đếm tổng
      const { count, rows } = await super.findAndCountAll({
        where: whereConditions,
        limit: safeLimit,
        offset: offset,
        order: [["created_at", "DESC"]],
      });

      const totalPages = Math.ceil(count / safeLimit);

      return {
        notifications: rows,
        pagination: {
          current_page: safePage,
          total_pages: totalPages,
          total_records: count,
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
      const count = await super.count({
        where: {
          user_id: user_id,
          is_read: false,
        },
      });
      return count;
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
      // Sequelize tự động xử lý JSON stringify nếu cột là kiểu JSON
      const notification = await super.create({
        user_id,
        type,
        payload,
      });

      return notification;
    } catch (error) {
      throw new Error(`Database error in create: ${error.message}`);
    }
  }

  // Tạo và gửi thông báo push
  static async createAndPush(notificationData) {
    try {
      const notification = await this.create(notificationData);

      // Gửi WebPush (giữ nguyên logic cũ)
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
      const [affectedCount] = await super.update(
        { is_read: true },
        {
          where: {
            notification_id: notification_id,
            user_id: user_id,
          },
        }
      );

      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Database error in markAsRead: ${error.message}`);
    }
  }

  // Đánh dấu tất cả thông báo là đã đọc
  static async markAllAsRead(user_id) {
    try {
      const [affectedCount] = await super.update(
        { is_read: true },
        {
          where: {
            user_id: user_id,
            is_read: false,
          },
        }
      );

      return affectedCount;
    } catch (error) {
      throw new Error(`Database error in markAllAsRead: ${error.message}`);
    }
  }

  // Xóa thông báo
  static async delete(notification_id, user_id) {
    try {
      const deletedCount = await super.destroy({
        where: {
          notification_id: notification_id,
          user_id: user_id,
        },
      });

      return deletedCount > 0;
    } catch (error) {
      throw new Error(`Database error in delete: ${error.message}`);
    }
  }

  // Kiểm tra thông báo thuộc về user
  static async belongsToUser(notification_id, user_id) {
    try {
      const count = await super.count({
        where: {
          notification_id: notification_id,
          user_id: user_id,
        },
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Database error in belongsToUser: ${error.message}`);
    }
  }

  // Lấy thông báo by ID
  static async findById(notification_id) {
    try {
      const notification = await super.findByPk(notification_id);
      return notification;
    } catch (error) {
      throw new Error(`Database error in findById: ${error.message}`);
    }
  }

  // Bulk create notifications for multiple users
  static async bulkCreateForUsers(userIds, notificationData) {
    try {
      const { type, payload } = notificationData;

      if (!this.isValidType(type)) {
        throw new Error(`Invalid notification type: ${type}`);
      }

      // Chuẩn bị mảng data để insert một lần (batch insert)
      const records = userIds.map((user_id) => ({
        user_id,
        type,
        payload,
      }));

      const result = await super.bulkCreate(records);

      return result.length; // Trả về số lượng bản ghi đã tạo
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

      const notifications = await super.findAll({
        where: {
          user_id: user_id,
          is_read: false,
        },
        order: [["created_at", "DESC"]],
        limit: safeLimit,
      });

      return notifications;
    } catch (error) {
      throw new Error(`Database error in getRecentUnread: ${error.message}`);
    }
  }

  // Lấy thông báo theo loại
  static async findByType(user_id, type, limit = 20) {
    try {
      const notifications = await super.findAll({
        where: {
          user_id: user_id,
          type: type,
        },
        order: [["created_at", "DESC"]],
        limit: Number(limit),
      });
      return notifications;
    } catch (error) {
      throw new Error(`Database error in findByType: ${error.message}`);
    }
  }

  // Lấy thông báo theo khoảng thời gian
  static async findByTimeRange(user_id, startDate, endDate, limit = 50) {
    try {
      const notifications = await super.findAll({
        where: {
          user_id: user_id,
          created_at: {
            [Op.between]: [startDate, endDate], // Sử dụng Operator của Sequelize
          },
        },
        order: [["created_at", "DESC"]],
        limit: Number(limit),
      });
      return notifications;
    } catch (error) {
      throw new Error(`Database error in findByTimeRange: ${error.message}`);
    }
  }

  // =================================================================
  // CÁC HÀM LOGIC (GIỮ NGUYÊN HOÀN TOÀN)
  // =================================================================

  static isValidType(type) {
    const validTypes = [
      "event_approved",
      "event_rejected",
      "event_reminder",
      "event_updated_urgent",
      "event_starting_soon",
      "event_cancelled",
      "event_pending_approval",
      "registration_approved",
      "registration_rejected",
      "registration_completed",
      "registration_cancelled", // ✅ ADD
      "new_registration",
      "new_post",
      "new_comment",
      "reaction_received",
      "account_locked",
      "manager_account_locked",
      "account_unlocked",
      "manager_account_unlocked",
      "role_changed",
      "test_notification",
    ];
    return validTypes.includes(type);
  }

  static getNotificationTitle(type) {
    const titles = {
      event_approved: "Sự kiện đã được duyệt",
      event_rejected: "Sự kiện bị từ chối",
      event_reminder: "Nhắc nhở sự kiện",
      event_updated_urgent: "Sự kiện được cập nhật khẩn",
      event_starting_soon: "Sự kiện sắp bắt đầu",
      event_cancelled: "Sự kiện đã bị hủy",
      event_pending_approval: "Sự kiện mới chờ duyệt",
      registration_approved: "Đăng ký được chấp nhận",
      registration_rejected: "Đăng ký bị từ chối",
      registration_completed: "Hoàn thành sự kiện",
      registration_cancelled: "Có người hủy đăng ký", // ✅ ADD
      new_registration: "Có đăng ký mới",
      new_post: "Bài viết mới",
      new_comment: "Bình luận mới",
      reaction_received: "Có tương tác mới",
      account_locked: "Tài khoản bị khóa",
      manager_account_locked: "Manager bị khóa",
      account_unlocked: "Tài khoản đã được mở khóa",
      manager_account_unlocked: "Manager đã được mở khóa",
      role_changed: "Quyền tài khoản đã thay đổi",
      test_notification: "Thông báo thử hệ thống",
    };
    return titles[type] || "Thông báo mới";
  }

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
      event_approved: "Sự kiện của bạn đã được phê duyệt",
      event_rejected: "Sự kiện của bạn đã bị từ chối",
      event_reminder: "Sự kiện sắp diễn ra",
      event_updated_urgent: "Sự kiện có thông tin quan trọng được cập nhật",
      event_starting_soon: "Sự kiện sẽ bắt đầu trong 1 giờ tới",
      event_cancelled: "Sự kiện bạn đã đăng ký đã bị hủy",
      event_pending_approval:
        "Có sự kiện mới được tạo bởi Manager, cần xem xét và duyệt.",
      registration_approved:
        "Đăng ký tham gia sự kiện của bạn đã được chấp nhận",
      registration_rejected: "Đăng ký tham gia sự kiện của bạn đã bị từ chối",
      registration_completed: "Bạn đã hoàn thành sự kiện thành công",
      registration_cancelled: "Có tình nguyện viên vừa hủy đăng ký", // ✅ ADD
      new_registration: "Có người mới đăng ký tham gia sự kiện",
      new_post: "Có bài viết mới trong sự kiện",
      new_comment: "Có bình luận mới trong bài viết",
      reaction_received: "Bài viết của bạn nhận được tương tác mới",
      account_locked: "Tài khoản volunteer đã bị khóa",
      manager_account_locked: "Tài khoản manager đã bị khóa",
      account_unlocked: "Tài khoản volunteer đã được mở khóa",
      manager_account_unlocked: "Tài khoản manager đã được mở khóa",
      role_changed: "Quyền tài khoản của bạn đã được thay đổi.",
      test_notification: "Đây là thông báo test từ hệ thống.",
    };

    // ✅ ƯU TIÊN payload.message, nhưng nếu có reason thì nối thêm
    if (
      payloadObj &&
      typeof payloadObj.message === "string" &&
      payloadObj.message.trim().length > 0
    ) {
      const baseMsg = payloadObj.message.trim();
      const reason = payloadObj.reason || payloadObj.rejection_reason;

      const typesWithReason = new Set([
        "event_rejected",
        "event_cancelled",
        "registration_rejected",
        "account_locked",
        "manager_account_locked",
      ]);

      if (reason && typesWithReason.has(type)) {
        return `${baseMsg}\nLý do: ${reason}`;
      }

      return baseMsg;
    }

    // 🔽 Nếu không có payload.message thì dùng logic cũ
    const eventTitle = payloadObj?.event_title;
    const reason = payloadObj?.reason || payloadObj?.rejection_reason;
    const userName =
      payloadObj?.user_name ||
      payloadObj?.manager_name ||
      payloadObj?.reactor_name;

    switch (type) {
      case "event_approved":
        if (eventTitle) return `Sự kiện "${eventTitle}" đã được phê duyệt.`;
        break;

      case "event_rejected":
        if (eventTitle)
          return `Sự kiện "${eventTitle}" đã bị từ chối.${
            reason ? ` \n Lý do: ${reason}` : ""
          }`;
        break;

      case "event_cancelled":
        if (eventTitle)
          return `Sự kiện "${eventTitle}" đã bị hủy.${
            reason ? ` \n Lý do: ${reason}` : ""
          }`;
        break;

      case "event_reminder":
        if (eventTitle) return `Nhắc nhở: Sự kiện "${eventTitle}" sắp diễn ra.`;
        break;

      case "event_starting_soon":
        if (eventTitle)
          return `Sự kiện "${eventTitle}" sẽ bắt đầu trong thời gian ngắn.`;
        break;

      case "event_updated_urgent":
        if (eventTitle)
          return `Sự kiện "${eventTitle}" có cập nhật quan trọng. Vui lòng kiểm tra chi tiết.`;
        break;

      case "event_pending_approval":
        if (eventTitle)
          return `Sự kiện "${eventTitle}" vừa được tạo và đang chờ duyệt.`;
        break;

      case "registration_approved":
        if (eventTitle)
          return `Đăng ký của bạn cho sự kiện "${eventTitle}" đã được chấp nhận.`;
        break;

      case "registration_rejected":
        if (eventTitle)
          return `Đăng ký của bạn cho sự kiện "${eventTitle}" đã bị từ chối.${
            reason ? ` \n Lý do: ${reason}` : ""
          }`;
        break;

      case "registration_completed":
        if (eventTitle)
          return `Bạn đã được xác nhận hoàn thành sự kiện "${eventTitle}". Cảm ơn bạn đã tham gia!`;
        break;

      case "new_registration":
        if (eventTitle)
          return `Có đăng ký mới${
            userName ? ` từ ${userName}` : ""
          } cho sự kiện "${eventTitle}".`;
        break;

      case "account_locked":
        if (reason) return `Tài khoản của bạn đã bị khóa. \n Lý do: ${reason}`;
        break;

      case "manager_account_locked":
        if (userName)
          return `Manager ${userName} đã bị khóa tài khoản.${
            reason ? ` \n Lý do: ${reason}` : ""
          }`;
        break;

      case "account_unlocked":
        return "Tài khoản của bạn đã được mở khóa.";

      case "manager_account_unlocked":
        if (userName) return `Manager ${userName} đã được mở khóa tài khoản.`;
        break;

      case "role_changed":
        return "Quyền tài khoản của bạn đã được thay đổi.";
    }

    return defaultBodies[type] || "Bạn có thông báo mới";
  }

  static getNotificationUrl(notification) {
    try {
      const payload =
        typeof notification.payload === "string"
          ? JSON.parse(notification.payload)
          : notification.payload;
      const urlMap = {
        event_approved: `/events/${payload?.event_id}`,
        event_rejected: `/events/${payload?.event_id}`,
        event_reminder: `/events/${payload?.event_id}`,
        event_updated_urgent: `/events/${payload?.event_id}`,
        event_starting_soon: `/events/${payload?.event_id}`,
        event_cancelled: `/events/${payload?.event_id}`,
        event_pending_approval: `/admin/events?event_id=${payload?.event_id}`,
        registration_approved: `/my-registrations`,
        registration_rejected: `/my-registrations`,
        registration_completed: `/my-registrations`,
        new_registration: `/events/${payload?.event_id}/registrations`,
        new_post: `/posts/${payload?.post_id || payload?.content_id}`,
        new_comment: `/posts/${payload?.post_id}`,
        reaction_received: `/posts/${payload?.post_id || payload?.content_id}`,
        account_locked: `/profile`,
        manager_account_locked: `/admin/users`,
        account_unlocked: `/profile`,
        manager_account_unlocked: `/admin/users`,
        role_changed: `/profile`,
        test_notification: `/notifications`,
      };
      return urlMap[notification.type] || "/notifications";
    } catch (error) {
      return "/notifications";
    }
  }
}

// =================================================================
// CẤU HÌNH SCHEMA (ÁNH XẠ VÀO BẢNG Notifications)
// =================================================================
Notification.init(
  {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        "event_approved",
        "event_rejected",
        "event_reminder",
        "event_updated_urgent",
        "event_starting_soon",
        "event_cancelled",
        "event_pending_approval",
        "registration_approved",
        "registration_rejected",
        "registration_completed",
        "registration_cancelled", // ✅ ADD HERE
        "new_registration",
        "new_post",
        "new_comment",
        "reaction_received",
        "account_locked",
        "manager_account_locked",
        "account_unlocked",
        "manager_account_unlocked",
        "role_changed",
        "test_notification"
      ),
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSON, // Sequelize tự động xử lý JSON
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "Notifications",
    timestamps: true, // Tự động quản lý created_at, updated_at
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

export default Notification;
