import express from "express";
import webPushController from "../controllers/webPushController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Route lấy VAPID key không cần auth (để test)
router.get("/vapid-key", webPushController.getVapidKey);

// Các routes khác cần auth
router.use(authMiddleware.authenticateToken);
router.post("/subscribe", webPushController.saveSubscription);
router.post("/unsubscribe", webPushController.unsubscribe);

export default router;
