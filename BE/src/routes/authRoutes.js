import express from "express";
import authController from "../controllers/authController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh-token", authController.refreshToken);
router.post("/logout", authController.logout);
router.put(
  "/change-password",
  authMiddleware.authenticateToken,
  authController.changePassword
);

// Protected routes
router.get("/me", authMiddleware.authenticateToken, authController.getMe);

export default router;
