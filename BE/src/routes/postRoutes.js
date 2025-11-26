import express from "express";
import postController from "../controllers/postController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Xem danh sách bài đăng
// GET /api/posts/events/:event_id
router.get(
  "/events/:event_id",
  authMiddleware.authenticateToken,
  postController.getEventPosts
);

// Đăng bài (Cần đăng nhập)
// POST /api/posts/events/:event_id
router.post(
  "/events/:event_id",
  authMiddleware.authenticateToken,
  postController.createPost
);

// Xóa bài
// DELETE /api/posts/:post_id
router.delete(
  "/:post_id",
  authMiddleware.authenticateToken,
  postController.deletePost
);

export default router;