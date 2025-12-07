// src/routes/registrationRoutes.js
import express from "express";
import registrationController from "../controllers/registrationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// API: Đăng ký tham gia sự kiện
// URL: POST /api/registrations/events/:event_id
router.post(
  "/events/:event_id",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Volunteer"]),
  registrationController.registerEvent
);

// API: Hủy đăng ký
// URL: DELETE /api/registrations/events/:event_id
router.delete(
  "/events/:event_id",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Volunteer"]),
  registrationController.cancelRegistration
);

// Lấy danh sách đăng ký của một sự kiện
router.get(
  "/events/:event_id",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Manager"]),
  registrationController.getEventRegistrations
);

// Duyệt đăng ký
// PATCH /api/registrations/:registration_id/approve
router.patch(
  "/:registration_id/approve",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Manager"]),
  registrationController.approveRegistration
);

// Từ chối đăng ký
// PATCH /api/registrations/:registration_id/reject
router.patch(
  "/:registration_id/reject",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Manager"]),
  registrationController.rejectRegistration
);

// Đánh dấu hoàn thành
// PATCH /api/registrations/:registration_id/complete
router.patch(
  "/:registration_id/complete",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Manager"]),
  registrationController.completeRegistration
);

// NEW: Volunteer – trạng thái đăng ký của bản thân cho 1 event
// GET /api/registrations/events/:event_id/my-status
router.get(
  "/events/:event_id/my-status",
  authMiddleware.authenticateToken,
  authMiddleware.requireRole(["Volunteer"]),
  registrationController.getMyRegistrationStatus
);

export default router;
