import express from "express";
import notificationController from "../controllers/notificationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(authMiddleware.authenticateToken);

// ==================== ROUTES CHO NGƯỜI DÙNG ====================
router.get("/my-notifications", notificationController.getMyNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.put("/:notification_id/read", notificationController.markAsRead);
router.delete("/:notification_id", notificationController.deleteNotification);

// ==================== ROUTES CHO HỆ THỐNG ====================

// Quản lý sự kiện - Duyệt/từ chối sự kiện (Admin/Manager)
router.post(
  "/event-approval",
  authMiddleware.requireAdmin, // Chỉ Admin mới được duyệt sự kiện
  notificationController.notifyEventApproval
);

// Thông báo đăng ký mới (Cho Event Manager)

router.post(
  "/new-registration",
  authMiddleware.requireManagerOrAdmin, // ← SỬA THÀNH requireManagerOrAdmin
  notificationController.notifyNewRegistration
);

// Thông báo trạng thái đăng ký (Cho Manager xử lý đăng ký)
router.post(
  "/registration-status",
  authMiddleware.requireManagerOrAdmin, // Manager hoặc Admin
  notificationController.notifyRegistrationStatus
);

// Thông báo nhắc nhở sự kiện (Hệ thống tự động hoặc Manager)
router.post(
  "/event-reminder",
  authMiddleware.requireManagerOrAdmin, // Manager hoặc Admin
  notificationController.notifyEventReminder
);

// Thông báo nội dung mới trên wall (Tự động khi có post/comment)
router.post(
  "/new-content",
  authMiddleware.authenticateToken, // Bất kỳ user đã đăng nhập
  notificationController.notifyNewContent
);

// Thông báo lượt thích mới (Tự động khi có reaction)
router.post(
  "/new-reaction",
  authMiddleware.authenticateToken, // Bất kỳ user đã đăng nhập
  notificationController.notifyNewReaction
);

// API tạo thông báo tổng quát (Cho admin/testing)
router.post(
  "/",
  authMiddleware.requireAdmin,
  notificationController.createNotification
);

export default router;
