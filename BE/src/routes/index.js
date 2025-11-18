import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";

const router = express.Router();

// Sử dụng các route
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// Route mặc định để test
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "VolunteerHub API đang hoạt động!",
    timestamp: new Date().toISOString(),
  });
});

// Route health check
router.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Server đang hoạt động tốt",
    timestamp: new Date().toISOString(),
  });
});

export default router;
