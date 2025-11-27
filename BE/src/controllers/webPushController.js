import WebPushService from "../services/WebPushService.js";

const webPushController = {
  // Lưu subscription
  async saveSubscription(req, res) {
    try {
      const user_id = req.user.user_id;
      const { subscription } = req.body;

      await WebPushService.saveSubscription(user_id, subscription);

      res.json({
        success: true,
        message: "Subscription saved successfully",
      });
    } catch (error) {
      console.error("Save subscription error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to save subscription",
      });
    }
  },

  // Lấy VAPID public key
  async getVapidKey(req, res) {
    try {
      const publicKey = WebPushService.getVapidPublicKey();

      res.json({
        success: true,
        data: { publicKey },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to get VAPID key",
      });
    }
  },

  // Hủy subscription
  async unsubscribe(req, res) {
    try {
      const { endpoint } = req.body;

      await WebPushService.unsubscribe(endpoint);

      res.json({
        success: true,
        message: "Unsubscribed successfully",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to unsubscribe",
      });
    }
  },
};

export default webPushController;
