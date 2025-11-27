import express from "express";
import webPushController from "../controllers/webPushController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.post("/subscribe", webPushController.saveSubscription);
router.get("/vapid-key", webPushController.getVapidKey);
router.post("/unsubscribe", webPushController.unsubscribe);

export default router;
