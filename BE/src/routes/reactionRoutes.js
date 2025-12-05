import express from "express";
import reactionController from "../controllers/reactionController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Xem danh sách người thả Reaction Bài viết
// URL: GET /api/reactions/posts/:post_id?type=love
router.get(
  "/posts/:post_id",
  authMiddleware.authenticateToken,
  reactionController.getPostReactions
);

// Thả/Gỡ/Đổi Reaction Bài viết (Toggle)
// URL: POST /api/reactions/posts/:post_id
// Body: { "type": "love" }
router.post(
  "/posts/:post_id",
  authMiddleware.authenticateToken,
  reactionController.togglePostReaction
);

// Xem danh sách người thả Reaction Bình luận
// URL: GET /api/reactions/comments/:comment_id?type=haha
router.get(
  "/comments/:comment_id",
  authMiddleware.authenticateToken,
  reactionController.getCommentReactions
);

// Thả/Gỡ/Đổi Reaction Bình luận (Toggle)
// URL: POST /api/reactions/comments/:comment_id
// Body: { "type": "like" }
router.post(
  "/comments/:comment_id",
  authMiddleware.authenticateToken,
  reactionController.toggleCommentReaction
);

export default router;