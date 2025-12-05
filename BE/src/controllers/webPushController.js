import WebPushService from "../services/WebPushService.js";

class WebPushController {
  static async saveSubscription(req, res) {
    try {
      const user_id = req.user?.user_id;
      const { subscription } = req.body;

      if (!subscription) {
        return res.status(400).json({
          success: false,
          message: "Subscription is required",
        });
      }

      await WebPushService.saveSubscription(user_id, subscription);

      res.json({
        success: true,
        message: "Subscription saved successfully",
      });
    } catch (error) {
      console.error("Save subscription error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async getVapidKey(req, res) {
    try {
      const publicKey = WebPushService.getVapidPublicKey();

      res.json({
        success: true,
        publicKey: publicKey,
      });
    } catch (error) {
      console.error("Get VAPID key error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }

  static async unsubscribe(req, res) {
    try {
      const { endpoint } = req.body;

      if (!endpoint) {
        return res.status(400).json({
          success: false,
          message: "Endpoint is required",
        });
      }

      await WebPushService.unsubscribe(endpoint);

      res.json({
        success: true,
        message: "Unsubscribed successfully",
      });
    } catch (error) {
      console.error("Unsubscribe error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
}

export default WebPushController;
