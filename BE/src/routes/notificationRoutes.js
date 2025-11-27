import express from "express";
import notificationController from "../controllers/notificationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu authentication
router.use(authMiddleware.authenticateToken);

// ==================== ROUTES CHO NGƯỜI DÙNG ====================
router.get("/my-notifications", notificationController.getMyNotifications);
router.get("/unread-count", notificationController.getUnreadCount);
router.get("/recent", notificationController.getRecentNotifications);
router.put("/mark-all-read", notificationController.markAllAsRead);
router.put("/:notification_id/read", notificationController.markAsRead);
router.delete("/:notification_id", notificationController.deleteNotification);

// ==================== ROUTES CHO HỆ THỐNG ====================

// Quản lý sự kiện - Duyệt/từ chối sự kiện (Admin)
router.post(
  "/event-approval",
  authMiddleware.requireAdmin,
  notificationController.notifyEventApproval
);

// Thông báo đăng ký mới (Manager)
router.post(
  "/new-registration",
  authMiddleware.requireManagerOrAdmin,
  notificationController.notifyNewRegistration
);

// Thông báo trạng thái đăng ký (Manager)
router.post(
  "/registration-status",
  authMiddleware.requireManagerOrAdmin,
  notificationController.notifyRegistrationStatus
);

// Thông báo nhắc nhở sự kiện (Manager)
router.post(
  "/event-reminder",
  authMiddleware.requireManagerOrAdmin,
  notificationController.notifyEventReminder
);

// Thông báo sự kiện sắp diễn ra (Manager) - THÊM MỚI
router.post(
  "/event-starting-soon",
  authMiddleware.requireManagerOrAdmin,
  notificationController.notifyEventStartingSoon
);

// Thông báo hủy sự kiện (Admin) - THÊM MỚI
router.post(
  "/event-cancelled",
  authMiddleware.requireAdmin,
  notificationController.notifyEventCancelled
);

// Thông báo cập nhật khẩn (Manager) - THÊM MỚI
router.post(
  "/event-updated-urgent",
  authMiddleware.requireManagerOrAdmin,
  notificationController.notifyEventUpdatedUrgent
);

// Thông báo nội dung mới (User)
router.post("/new-content", notificationController.notifyNewContent);

// Thông báo lượt thích (User)
router.post("/new-reaction", notificationController.notifyNewReaction);

// Thông báo khóa tài khoản (Admin) - THÊM MỚI
router.post(
  "/account-locked",
  authMiddleware.requireAdmin,
  notificationController.notifyAccountLocked
);

// Thông báo manager bị khóa (Admin) - THÊM MỚI
router.post(
  "/manager-locked",
  authMiddleware.requireAdmin,
  notificationController.notifyManagerLocked
);

// API tạo thông báo tổng quát (Admin)
router.post(
  "/",
  authMiddleware.requireAdmin,
  notificationController.createNotification
);

// API tạo thông báo hàng loạt (Admin) - THÊM MỚI
router.post(
  "/bulk",
  authMiddleware.requireAdmin,
  notificationController.bulkCreateNotifications
);

// Thông báo mở khóa tài khoản (Admin)
router.post(
  "/account-unlocked",
  authMiddleware.requireAdmin,
  notificationController.notifyAccountUnlocked
);

// Thông báo mở khóa manager (Admin)
router.post(
  "/manager-unlocked",
  authMiddleware.requireAdmin,
  notificationController.notifyManagerUnlocked
);

export default router;
