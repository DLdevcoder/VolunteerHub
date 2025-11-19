import express from "express";
import notificationController from "../controllers/notificationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(authMiddleware.authenticateToken);

// Routes chính
router.get("/", notificationController.getMyNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.put("/:notification_id/read", notificationController.markAsRead);
router.delete("/:notification_id", notificationController.deleteNotification);

// Route tạo thông báo (cho admin/testing)
router.post(
  "/",
  authMiddleware.requireAdmin,
  notificationController.createNotification
);

export default router;
