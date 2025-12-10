import Reaction from "../models/Reaction.js";
import Post from "../models/Post.js";
import Comment from "../models/Comment.js";
import Event from "../models/Event.js";
import Registration from "../models/Registration.js";
import UserService from "../services/UserService.js";
import NotificationService from "../services/notificationService.js";

// Kiểm tra quyền tham gia (Giữ nguyên logic)
const checkParticipation = async (user_id, event_id) => {
  const event = await Event.getEventById(event_id);
  if (!event) return false;
  if (event.approval_status !== "approved") return false;

  // - Manager (Chủ sự kiện)
  if (event.manager_id === user_id) return true;

  // - Volunteer (Đã tham gia và được duyệt/hoàn thành)
  const reg = await Registration.findOne(user_id, event_id);
  if (reg && (reg.status === "approved" || reg.status === "completed")) {
    return true;
  }

  return false;
};

const reactionController = {
  // ============================================================
  // XỬ LÝ BÀI VIẾT (POST)
  // ============================================================

  // Thả/Gỡ/Đổi Reaction Bài viết (Toggle Logic)
  async togglePostReaction(req, res) {
    try {
      const { post_id } = req.params;
      const user_id = req.user.user_id;

      // [FIX] Xử lý input linh hoạt hơn
      let { type } = req.body;

      // Log để debug xem FE gửi gì lên
      console.log(
        `[Reaction] User ${user_id} toggle post ${post_id} with type:`,
        type
      );

      // 1. Chuyển về chữ thường & cắt khoảng trắng
      if (type) type = type.toString().toLowerCase().trim();

      // 2. Validate
      const validTypes = ["like", "love", "haha", "sad", "angry"];
      if (!type || !validTypes.includes(type)) {
        console.warn(`[Reaction] Invalid type '${type}', defaulting to 'like'`);
        type = "like";
      }

      const currentUser = await UserService.findById(user_id);
      if (!currentUser || currentUser.status !== "Active") {
        return res.status(403).json({ message: "Tài khoản bị khóa" });
      }

      // Check Post & Sự kiện đóng băng
      const post = await Post.getById(post_id);
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

      // Xử lý Logic 3 Trạng thái (Add/Remove/Change)
      const existing = await Reaction.checkPostReaction(user_id, post_id);
      let action = "";
      let currentType = type;

      if (existing) {
        // Bấm lại đúng loại cũ -> Gỡ bỏ (Unlike)
        // Lưu ý: existing.reaction_type trong DB có thể trả về chữ thường/hoa tùy DB, nên lowercased check
        if (existing.reaction_type.toLowerCase() === type) {
          await Reaction.removePostReaction(user_id, post_id);
          action = "removed";
          currentType = null;
        }
        // Bấm loại khác -> Đổi (Change)
        else {
          await Reaction.removePostReaction(user_id, post_id);
          await Reaction.addPostReaction(user_id, post_id, type);
          action = "changed";
        }
      } else {
        // Chưa thả gì -> Thêm mới (Add)
        await Reaction.addPostReaction(user_id, post_id, type);
        action = "added";

        // Gửi thông báo
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

      // Lấy số lượng mới nhất để update UI
      const count = await Reaction.countPostReactions(post_id);

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

      const post = await Post.getById(post_id);
      if (!post)
        return res.status(404).json({ message: "Bài viết không tồn tại" });

      const canView = await checkParticipation(user_id, post.event_id);
      if (!canView)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xem danh sách này." });

      const result = await Reaction.getPostReactions(post_id, type);

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

      // [FIX] Xử lý input
      let { type } = req.body;
      if (type) type = type.toString().toLowerCase().trim();

      const validTypes = ["like", "love", "haha", "sad", "angry"];
      if (!type || !validTypes.includes(type)) {
        type = "like";
      }

      const currentUser = await UserService.findById(user_id);
      if (!currentUser || currentUser.status !== "Active")
        return res.status(403).json({ message: "Tài khoản bị khóa" });

      const comment = await Comment.getById(comment_id);
      if (!comment)
        return res.status(404).json({ message: "Bình luận không tồn tại" });

      if (comment.event_is_deleted || comment.event_status === "rejected") {
        return res.status(403).json({ message: "Sự kiện đã bị đóng." });
      }

      const canInteract = await checkParticipation(user_id, comment.event_id);
      if (!canInteract)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền tương tác." });

      const existing = await Reaction.checkCommentReaction(user_id, comment_id);
      let action = "";
      let currentType = type;

      if (existing) {
        if (existing.reaction_type.toLowerCase() === type) {
          await Reaction.removeCommentReaction(user_id, comment_id);
          action = "removed";
          currentType = null;
        } else {
          await Reaction.removeCommentReaction(user_id, comment_id);
          await Reaction.addCommentReaction(user_id, comment_id, type);
          action = "changed";
        }
      } else {
        await Reaction.addCommentReaction(user_id, comment_id, type);
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

      const count = await Reaction.countCommentReactions(comment_id);

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

      const comment = await Comment.getById(comment_id);
      if (!comment)
        return res.status(404).json({ message: "Bình luận không tồn tại" });

      const canView = await checkParticipation(user_id, comment.event_id);
      if (!canView)
        return res
          .status(403)
          .json({ message: "Bạn không có quyền xem danh sách này." });

      const result = await Reaction.getCommentReactions(comment_id, type);

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
