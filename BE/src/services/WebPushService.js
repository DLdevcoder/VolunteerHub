import webpush from "web-push";
import pool from "../config/db.js";

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;

webpush.setVapidDetails(
  "mailto:contact@volunteerhub.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

class WebPushService {
  // Lưu subscription của user
  static async saveSubscription(user_id, subscription) {
    try {
      const { endpoint, keys } = subscription;

      // Kiểm tra đã tồn tại chưa
      const [existing] = await pool.execute(
        `SELECT subscription_id FROM PushSubscriptions WHERE endpoint = ?`,
        [endpoint]
      );

      if (existing.length > 0) {
        // Update existing
        await pool.execute(
          `UPDATE PushSubscriptions SET keys = ?, is_active = TRUE, updated_at = NOW() WHERE endpoint = ?`,
          [JSON.stringify(keys), endpoint]
        );
      } else {
        // Insert new
        await pool.execute(
          `INSERT INTO PushSubscriptions (user_id, endpoint, keys) VALUES (?, ?, ?)`,
          [user_id, endpoint, JSON.stringify(keys)]
        );
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
      // Lấy tất cả subscriptions của user
      const [subscriptions] = await pool.execute(
        `SELECT endpoint, keys FROM PushSubscriptions 
         WHERE user_id = ? AND is_active = TRUE`,
        [user_id]
      );

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
      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: JSON.parse(subscription.keys),
            },
            JSON.stringify(message)
          );
          sentCount++;
        } catch (pushError) {
          console.error("Push notification failed:", pushError);

          // Nếu subscription không còn valid, đánh dấu inactive
          if (pushError.statusCode === 410) {
            await pool.execute(
              `UPDATE PushSubscriptions SET is_active = FALSE WHERE endpoint = ?`,
              [subscription.endpoint]
            );
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
      await pool.execute(
        `UPDATE PushSubscriptions SET is_active = FALSE WHERE endpoint = ?`,
        [endpoint]
      );
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
