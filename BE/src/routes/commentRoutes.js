import express from "express";
import commentController from "../controllers/commentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Xem bình luận của 1 bài viết
// URL: GET /api/comments/posts/:post_id
router.get(
  "/posts/:post_id",
  authMiddleware.authenticateToken, // Bắt buộc đăng nhập
  commentController.getPostComments
);

// Viết bình luận mới
// URL: POST /api/comments/posts/:post_id
router.post(
  "/posts/:post_id",
  authMiddleware.authenticateToken,
  authMiddleware.checkAccountActive,
  commentController.createComment
);

// Xóa bình luận
// URL: DELETE /api/comments/:comment_id
router.delete(
  "/:comment_id",
  authMiddleware.authenticateToken,
  authMiddleware.checkAccountActive,
  commentController.deleteComment
);

export default router;