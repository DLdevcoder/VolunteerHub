import express from "express";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
import notificationRoutes from "./notificationRoutes.js";
import eventRoutes from "./eventRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import exportRoutes from "./exportRoutes.js";
import registrationRoutes from "./registrationRoutes.js";
// import userRoutes from './userRoutes.js';
// import postRoutes from './postRoutes.js';

const router = express.Router();

// Sử dụng các route
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/events", eventRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/export", exportRoutes);
router.use("/registrations", registrationRoutes);
// router.use('/users', userRoutes);
// router.use('/posts', postRoutes);

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
