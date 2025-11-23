import express from "express";
import userController from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Routes cho user thông thường
router.get("/me", authMiddleware.authenticateToken, userController.getMe);
router.put("/me", authMiddleware.authenticateToken, userController.updateMe);

// Routes cho admin (chỉ admin mới có quyền)
router.get(
  "/",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  userController.getAllUsers
);
router.get(
  "/:user_id",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  userController.getUserById
);
router.put(
  "/:user_id/status",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  userController.updateUserStatus
);

export default router;
