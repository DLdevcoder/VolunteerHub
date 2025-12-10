import express from "express";
import eventController from "../controllers/eventController.js";
import authMiddleware from "../middlewares/authMiddleware.js";
import eventPermission from "../middlewares/eventPermission.js";

const router = express.Router();

// ====================================================================
// ROUTES CỤ THỂ (SPECIFIC) - ĐẶT TRƯỚC
// ====================================================================

// Lấy danh sách tất cả danh mục (public)
router.get("/categories", eventController.getCategories);

// Lấy danh sách sự kiện đang hoạt động (public)
// router.get("/active", eventController.getActiveEvents);
router.get(
  "/active",
  authMiddleware.authenticateTokenOptional,
  eventController.getActiveEvents
);

// ====================================================================
// ROUTES CHO ADMIN - ĐẶT TRƯỚC (vì có prefix /admin)
// ====================================================================

// Lấy tất cả sự kiện (bao gồm pending, rejected, deleted)
router.get(
  "/admin/all",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  eventController.getAllEvents
);

// ====================================================================
// ROUTES CHO VOLUNTEER - /my/history
// ====================================================================

/**
 * Lấy lịch sử tham gia sự kiện của Volunteer
 * GET /api/events/my/history
 */
router.get(
  "/my/history",
  authMiddleware.authenticateToken,
  eventController.getMyEventHistory
);

// ====================================================================
// ROUTES CHO MANAGER - /my/events
// ====================================================================

/**
 * Lấy danh sách sự kiện của Manager đang đăng nhập
 * GET /api/events/my/events
 */
router.get(
  "/my/events",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Manager"]),
  eventController.getMyEvents
);

/**
 * Tạo sự kiện mới
 * POST /api/events
 */
router.post(
  "/",
  authMiddleware.authenticateToken,
  authMiddleware.checkAccountActive,
  authMiddleware.requireRole(["Manager"]),
  eventController.createEvent
);

// ====================================================================
// ROUTES CÓ PARAMS - ĐẶT CUỐI CÙNG
// ====================================================================

/**
 * Xem chi tiết sự kiện (public)
 * GET /api/events/:event_id
 */
router.get("/:event_id", eventController.getEventById);

/**
 * Duyệt sự kiện (Admin only)
 * PATCH /api/events/:event_id/approve
 */
router.patch(
  "/:event_id/approve",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  eventPermission.checkEventNotApproved,
  eventController.approveEvent
);

/**
 * Từ chối sự kiện (Admin only)
 * PATCH /api/events/:event_id/reject
 */
router.patch(
  "/:event_id/reject",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  eventPermission.checkEventNotRejected,
  eventController.rejectEvent
);

/**
 * Cập nhật sự kiện (Manager - owner only)
 * PUT /api/events/:event_id
 */
router.put(
  "/:event_id",
  authMiddleware.authenticateToken,
  authMiddleware.checkAccountActive,
  authMiddleware.requireRole(["Manager"]),
  eventPermission.checkEventNotStarted,
  eventPermission.checkEventOwnership,
  eventController.updateEvent
);

/**
 * Xóa mềm sự kiện (Manager owner hoặc Admin)
 * DELETE /api/events/:event_id
 */
router.delete(
  "/:event_id",
  authMiddleware.authenticateToken,
  authMiddleware.checkAccountActive,
  authMiddleware.requireManagerOrAdmin,
  eventPermission.checkEventOwnership,
  eventController.deleteEvent
);

export default router;
