// src/routes/registrationRoutes.js
import express from "express";
import registrationController from "../controllers/registrationController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// API: Đăng ký tham gia sự kiện
// URL: POST /api/registrations/events/:event_id
router.post(
  "/events/:event_id",
  authMiddleware.authenticateToken, // Bắt buộc đăng nhập
  authMiddleware.requireRole(["Volunteer"]), // Chỉ TNV mới được đăng ký
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

export default router;