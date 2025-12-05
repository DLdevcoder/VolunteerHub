import express from "express";
import exportController from "../controllers/exportController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Tất cả routes đều yêu cầu quyền Admin
router.use(authMiddleware.authenticateToken, authMiddleware.requireAdmin);

// Routes export
router.get("/users", exportController.exportUsers);
router.get("/events", exportController.exportEvents);
router.get("/registrations", exportController.exportRegistrations);
router.get("/posts", exportController.exportPosts);
router.get("/summary", exportController.exportSummary);
router.get("/all", exportController.exportAll);

export default router;
