import webpush from "web-push";
import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

// Cấu hình web-push
webpush.setVapidDetails(
  "mailto:contact@volunteerhub.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// =================================================================
// 1. ĐỊNH NGHĨA MODEL (PushSubscription)
// =================================================================
class PushSubscription extends Model {}

PushSubscription.init(
  {
    subscription_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    endpoint: {
      type: DataTypes.TEXT,
      allowNull: false,
      // Endpoint thường rất dài và là duy nhất
    },
    keys: {
      type: DataTypes.JSON, // Sequelize tự động xử lý JSON/Object
      allowNull: false,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    modelName: "PushSubscription",
    tableName: "PushSubscriptions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

// =================================================================
// 2. SERVICE LOGIC (Đã chuyển sang dùng Model)
// =================================================================
class WebPushService {
  // Lưu subscription của user
  static async saveSubscription(user_id, subscription) {
    try {
      const { endpoint, keys } = subscription;

      console.log("Saving subscription for user:", user_id);

      // Tìm subscription dựa trên endpoint
      const existingSub = await PushSubscription.findOne({
        where: { endpoint: endpoint },
      });

      if (existingSub) {
        // Update existing: Sequelize tự động stringify keys khi lưu xuống DB
        existingSub.keys = keys;
        existingSub.is_active = true;
        existingSub.user_id = user_id; // Cập nhật lại user sở hữu nếu cần
        await existingSub.save();

        console.log("Updated existing subscription");
      } else {
        // Insert new
        await PushSubscription.create({
          user_id,
          endpoint,
          keys, // Truyền thẳng Object, không cần JSON.stringify
        });
        console.log("Created new subscription");
      }

      return true;
    } catch (error) {
      console.error("Error saving subscription:", error);
      throw error;
    }
  }

  // Gửi thông báo push thực tế
  static async sendPushNotification(user_id, notificationData) {
    try {
      // Lấy tất cả subscriptions active của user
      const subscriptions = await PushSubscription.findAll({
        where: {
          user_id: user_id,
          is_active: true,
        },
      });

      if (subscriptions.length === 0) {
        console.log(`No active subscriptions for user ${user_id}`);
        return 0;
      }

      const message = {
        title: notificationData.title,
        body: notificationData.body,
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        image: notificationData.image,
        data: {
          notificationId: notificationData.notification_id,
          type: notificationData.type,
          url: notificationData.url || "/notifications",
          ...notificationData.data,
        },
        actions: notificationData.actions || [
          {
            action: "view",
            title: "Xem",
          },
          {
            action: "dismiss",
            title: "Đóng",
          },
        ],
      };

      let sentCount = 0;

      // Gửi đến tất cả subscriptions
      for (const sub of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              // sub.keys đã là Object do DataTypes.JSON, không cần JSON.parse
              keys: sub.keys,
            },
            JSON.stringify(message)
          );
          sentCount++;
          console.log(`Push sent to ${sub.endpoint}`);
        } catch (pushError) {
          console.error("Push notification failed:", pushError);

          // Nếu subscription không còn valid (410 Gone), đánh dấu inactive
          if (pushError.statusCode === 410) {
            sub.is_active = false;
            await sub.save();
            console.log(`Marked subscription as inactive: ${sub.endpoint}`);
          }
        }
      }

      console.log(`Sent ${sentCount} push notifications to user ${user_id}`);
      return sentCount;
    } catch (error) {
      console.error("Error in sendPushNotification:", error);
      throw error;
    }
  }

  // Hủy subscription
  static async unsubscribe(endpoint) {
    try {
      const result = await PushSubscription.update(
        { is_active: false },
        { where: { endpoint: endpoint } }
      );

      console.log(`Unsubscribed: ${endpoint}`);
      return true;
    } catch (error) {
      console.error("Error unsubscribing:", error);
      throw error;
    }
  }

  // Lấy VAPID public key cho client
  static getVapidPublicKey() {
    return VAPID_PUBLIC_KEY;
  }
}

export default WebPushService;
