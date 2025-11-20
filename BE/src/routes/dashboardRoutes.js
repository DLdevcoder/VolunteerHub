import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu quyền Admin
router.use(authMiddleware.authenticateToken, authMiddleware.requireAdmin);

// Routes dashboard
router.get("/overview", dashboardController.getOverview);
router.get("/events/timeseries", dashboardController.getEventTimeSeries);
router.get("/events/top-engaged", dashboardController.getTopEngagedEvents);
router.get("/events/category-stats", dashboardController.getEventCategoryStats);
router.get("/users/top-active", dashboardController.getTopActiveUsers);
router.get("/registrations/trends", dashboardController.getRegistrationTrends);
router.get("/system-health", dashboardController.getSystemHealth);
router.get("/full", dashboardController.getFullDashboard);

export default router;
