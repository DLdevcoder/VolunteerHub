import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

// Đăng ký tài khoản mới
router.post("/register", authController.register);

// Đăng nhập
router.post("/login", authController.login);

// Refresh token (tùy chọn, nâng cao)
router.post("/refresh-token", authController.refreshToken);

// Đăng xuất (tùy chọn)
router.post("/logout", authController.logout);

export default router;
