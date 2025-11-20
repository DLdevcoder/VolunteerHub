import express from "express";
import eventController from "../controllers/eventController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import eventPermission from "../middlewares/eventPermission.js";

const router = express.Router();

// ====================================================================
// ROUTES CÔNG KHAI (Không cần đăng nhập)
// ====================================================================

// Lấy danh sách sự kiện đang hoạt động (approved, chưa kết thúc)
// Dành cho: Tất cả người dùng (public)
router.get("/active", eventController.getActiveEvents);

// Xem chi tiết sự kiện
// Dành cho: Tất cả người dùng (public)
router.get("/:event_id", eventController.getEventById);

// ====================================================================
// ROUTES CHO MANAGER (Quản lý sự kiện)
// ====================================================================

// Tạo sự kiện mới
// Dành cho: ONLY Manager (Admin không được tạo sự kiện)
router.post(
  "/",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Manager"]),
  eventController.createEvent
);

// Lấy danh sách sự kiện của Manager đang đăng nhập
// Dành cho: Manager
router.get(
  "/my/events",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Manager"]),
  eventController.getMyEvents
);

// Cập nhật sự kiện
// Dành cho: ONLY Manager (chủ sở hữu) - Admin KHÔNG được sửa
router.put(
  "/:event_id",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Manager"]),
  eventPermission.checkEventNotStarted,
  eventPermission.checkEventOwnership,
  eventController.updateEvent
);

// Xóa mềm sự kiện
// Dành cho: Manager (chủ sở hữu) hoặc Admin
router.delete(
  "/:event_id",
  authMiddleware.authenticateToken,
  authMiddleware.requireManagerOrAdmin,
  eventPermission.checkEventOwnership,
  eventController.deleteEvent
);

// ====================================================================
// ROUTES CHO ADMIN (Quản trị viên)
// ====================================================================

// Lấy tất cả sự kiện (bao gồm pending, rejected, deleted) với filter
// Dành cho: Admin
router.get(
  "/admin/all",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  eventController.getAllEvents
);

// Duyệt sự kiện
// Dành cho: Admin
router.patch(
  "/:event_id/approve",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  eventPermission.checkEventPending,
  eventController.approveEvent
);

// Từ chối sự kiện
// Dành cho: Admin
router.patch(
  "/:event_id/reject",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  eventPermission.checkEventPending,
  eventController.rejectEvent
);

export default router;