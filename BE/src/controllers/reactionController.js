import ReactionService from "../services/reactionService.js";
import PostService from "../services/postService.js";
import CommentService from "../services/commentService.js";
import UserService from "../services/UserService.js";
import NotificationService from "../services/notificationService.js";
import EventService from "../services/eventService.js";
import RegistrationService from "../services/registrationService.js";

// Helper: Check quyền tham gia
const checkParticipation = async (user_id, event_id) => {
  const event = await EventService.getEventById(event_id);

  if (!event) return false;
  if (event.approval_status !== "approved") return false;

  // - Manager (Chủ sự kiện)
  if (event.manager_id === user_id) return true;

  // - Volunteer: Đã đăng ký và được duyệt/hoàn thành
  const reg = await RegistrationService.findOne(user_id, event_id);

  if (reg && (reg.status === "approved" || reg.status === "completed")) {
    return true;
  }

  return false;
};

const reactionController = {
  // ============================================================
  // XỬ LÝ BÀI VIẾT (POST)
  // ============================================================

  // Thả/Gỡ/Đổi Reaction Bài viết
  async togglePostReaction(req, res) {
    try {
      const { post_id } = req.params;
      const user_id = req.user.user_id;
      let { type } = req.body;

      // Validate Type
      if (type) type = type.toString().toLowerCase().trim();
      const validTypes = ["like", "love", "haha", "sad", "angry"];
      if (!type || !validTypes.includes(type)) {
        type = "like";
      }

      // Check User Active
      const currentUser = await UserService.findById(user_id);
      if (!currentUser || currentUser.status !== "Active") {
        return res.status(403).json({ message: "Tài khoản bị khóa" });
      }

      // Check Post & Event Status
      const post = await PostService.getById(post_id);
      if (!post)
        return res.status(404).json({ message: "Bài viết không tồn tại" });

      if (post.event_is_deleted || post.event_status === "rejected") {
        return res.status(403).json({ message: "Sự kiện đã bị đóng." });
      }

      // Check Quyền tham gia
      const canInteract = await checkParticipation(user_id, post.event_id);
      if (!canInteract) {
        return res
          .status(403)
          .json({ message: "Bạn không có quyền tương tác trong sự kiện này." });
      }

      // Logic Toggle
      const existing = await ReactionService.checkPostReaction(
        user_id,
        post_id
      );
      let action = "";
      let currentType = type;

      if (existing) {
        if (existing.reaction_type.toLowerCase() === type) {
          // Gỡ
          await ReactionService.removePostReaction(user_id, post_id);
          action = "removed";
          currentType = null;
        } else {
          // Đổi
          await ReactionService.removePostReaction(user_id, post_id);
          await ReactionService.addPostReaction(user_id, post_id, type);
          action = "changed";
        }
      } else {
        // Thêm mới
        await ReactionService.addPostReaction(user_id, post_id, type);
        action = "added";

        // Gửi thông báo (trừ khi tự like bài mình)
        if (post.user_id !== user_id) {
          await NotificationService.notifyReactionReceived(
            post.user_id,
            "post",
            post_id,
            user_id,
            currentUser.full_name
          );
        }
      }

      // Lấy số lượng mới nhất
      const count = await ReactionService.countPostReactions(post_id);

      res.json({
        success: true,
        message: `Thao tác ${action} thành công`,
        data: {
          action: action,
          current_reaction: currentType,
          total_reactions: count,
        },
      });
    } catch (error) {
      console.error("Toggle post reaction error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // Xem danh sách Reaction Bài viết
  async getPostReactions(req, res) {
    try {
      const { post_id } = req.params;
      const { type } = req.query;
      const user_id = req.user.user_id;

      const post = await PostService.getById(post_id);
      if (!post)
        return res.status(404).json({ message: "Bài viết không tồn tại" });

      const canView = await checkParticipation(user_id, post.event_id);
      if (!canView)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xem danh sách này." });

      const result = await ReactionService.getPostReactions(post_id, type);

      res.json({
        success: true,
        summary: result.summary,
        data: result.reactions,
      });
    } catch (error) {
      console.error("Get post reactions error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // ============================================================
  // XỬ LÝ BÌNH LUẬN (COMMENT)
  // ============================================================

  // Toggle Reaction Bình luận
  async toggleCommentReaction(req, res) {
    try {
      const { comment_id } = req.params;
      const user_id = req.user.user_id;
      let { type } = req.body;

      if (type) type = type.toString().toLowerCase().trim();
      const validTypes = ["like", "love", "haha", "sad", "angry"];
      if (!type || !validTypes.includes(type)) {
        type = "like";
      }

      const currentUser = await UserService.findById(user_id);
      if (!currentUser || currentUser.status !== "Active")
        return res.status(403).json({ message: "Tài khoản bị khóa" });

      const comment = await CommentService.getById(comment_id);
      if (!comment)
        return res.status(404).json({ message: "Bình luận không tồn tại" });

      if (comment.event_is_deleted || comment.event_status === "rejected") {
        return res.status(403).json({ message: "Sự kiện đã bị đóng." });
      }

      const canInteract = await checkParticipation(user_id, comment.event_id);
      if (!canInteract)
        return res.status(403).json({ message: "Bạn không có quyền tương tác." });

      // Logic Toggle Comment
      const existing = await ReactionService.checkCommentReaction(
        user_id,
        comment_id
      );
      let action = "";
      let currentType = type;

      if (existing) {
        if (existing.reaction_type.toLowerCase() === type) {
          await ReactionService.removeCommentReaction(user_id, comment_id);
          action = "removed";
          currentType = null;
        } else {
          await ReactionService.removeCommentReaction(user_id, comment_id);
          await ReactionService.addCommentReaction(user_id, comment_id, type);
          action = "changed";
        }
      } else {
        await ReactionService.addCommentReaction(user_id, comment_id, type);
        action = "added";

        if (comment.user_id !== user_id) {
          await NotificationService.notifyReactionReceived(
            comment.user_id,
            "comment",
            comment_id,
            user_id,
            currentUser.full_name
          );
        }
      }

      const count = await ReactionService.countCommentReactions(comment_id);

      res.json({
        success: true,
        message: `Thao tác ${action} thành công`,
        data: {
          action: action,
          current_reaction: currentType,
          total_reactions: count,
        },
      });
    } catch (error) {
      console.error("Toggle comment reaction error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // Xem danh sách Reaction Bình luận
  async getCommentReactions(req, res) {
    try {
      const { comment_id } = req.params;
      const { type } = req.query;
      const user_id = req.user.user_id;

      const comment = await CommentService.getById(comment_id);
      if (!comment)
        return res.status(404).json({ message: "Bình luận không tồn tại" });

      const canView = await checkParticipation(user_id, comment.event_id);
      if (!canView)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xem danh sách này." });

      const result = await ReactionService.getCommentReactions(
        comment_id,
        type
      );

      res.json({
        success: true,
        summary: result.summary,
        data: result.reactions,
      });
    } catch (error) {
      console.error("Get comment reactions error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

export default reactionController;