import express from "express";
import dashboardController from "../controllers/dashboardController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get(
  "/",
  authMiddleware.authenticateToken,
  dashboardController.getDashboard
);

router.get(
  "/admin/overview",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  dashboardController.getOverview
);

router.get(
  "/admin/events/timeseries",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  dashboardController.getEventTimeSeries
);

router.get(
  "/admin/events/top-engaged",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  dashboardController.getTopEngagedEvents
);

router.get(
  "/admin/events/category-stats",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  dashboardController.getEventCategoryStats
);

router.get(
  "/admin/users/top-active",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  dashboardController.getTopActiveUsers
);

router.get(
  "/admin/registrations/trends",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  dashboardController.getRegistrationTrends
);

router.get(
  "/admin/system-health",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  dashboardController.getSystemHealth
);

router.get(
  "/admin/full",
  authMiddleware.authenticateToken,
  authMiddleware.requireAdmin,
  dashboardController.getFullDashboard
);

export default router;
