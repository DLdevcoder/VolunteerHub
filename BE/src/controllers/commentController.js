import Comment from "../models/Comment.js";
import Post from "../models/Post.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
// [SỬA 1] Import Service
import UserService from "../services/UserService.js";
import NotificationService from "../services/notificationService.js";

const commentController = {
  // Xem bình luận
  async getPostComments(req, res) {
    try {
      const { post_id } = req.params;
      const user_id = req.user.user_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Lấy thông tin bài viết để biết nó thuộc Event nào
      const post = await Post.getById(post_id);
      if (!post)
        return res
          .status(404)
          .json({ success: false, message: "Bài viết không tồn tại" });

      // Lấy thông tin Event
      const event = await Event.getEventById(post.event_id);

      // Chặn Crash nếu Event bị xoá
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện chứa bài viết này không tồn tại hoặc đã bị xóa.",
        });
      }

      // Check Quyền Xem
      let canView = false;
      if (event.manager_id === user_id) {
        canView = true;
      } else {
        const reg = await Registration.findOne(user_id, event.event_id);
        if (reg && (reg.status === "approved" || reg.status === "completed")) {
          canView = true;
        }
      }

      if (!canView) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xem bình luận.",
        });
      }

      // Lấy dữ liệu
      const result = await Comment.getByPostId(post_id, page, limit);
      res.json({
        success: true,
        data: result.comments,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // Tạo bình luận
  async createComment(req, res) {
    try {
      const { post_id } = req.params;
      const user_id = req.user.user_id;
      let { content } = req.body;

      // Validate Input
      if (!content || typeof content !== "string")
        return res.status(400).json({ message: "Nội dung lỗi" });
      content = content.trim();
      if (content.length === 0)
        return res.status(400).json({ message: "Nội dung trống" });
      if (content.length > 1000)
        return res
          .status(400)
          .json({ message: "Bình luận quá dài (max 1000)" });

      // Check User Active
      // [SỬA 2] Dùng UserService
      const currentUser = await UserService.findById(user_id);
      if (!currentUser || currentUser.status !== "Active")
        return res.status(403).json({ message: "Tài khoản bị khóa" });

      // Lấy Post và Event
      const post = await Post.getById(post_id);
      if (!post)
        return res.status(404).json({ message: "Bài viết không tồn tại" });

      // Phòng thủ: Sự kiện đã bị đóng/xóa
      if (post.event_is_deleted || post.event_status === "rejected") {
        return res.status(403).json({ message: "Sự kiện này đã bị đóng." });
      }

      // Check quyền comment
      let canComment = false;
      if (post.event_manager_id === user_id) {
        canComment = true;
      } else {
        const reg = await Registration.findOne(user_id, post.event_id);
        if (reg && (reg.status === "approved" || reg.status === "completed")) {
          canComment = true;
        }
      }

      if (!canComment) {
        return res.status(403).json({
          success: false,
          message: "Chỉ thành viên tham gia sự kiện mới được bình luận.",
        });
      }

      // Tạo Comment
      const commentId = await Comment.create({ post_id, user_id, content });
      const newComment = await Comment.getById(commentId);

      // [BỔ SUNG] Gửi thông báo cho mọi người trong sự kiện (trừ người viết comment)
      try {
        await NotificationService.notifyNewComment(
          post.event_id,
          commentId,
          post_id,
          user_id, // author_id (người viết comment) để loại trừ khỏi danh sách nhận noti
          content // nội dung preview
        );
      } catch (notifyErr) {
        console.error("Notify new comment error:", notifyErr);
      }

      res.status(201).json({
        success: true,
        message: "Bình luận thành công",
        data: { comment: newComment },
      });
    } catch (error) {
      console.error("Create comment error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // Xoá bình luận
  async deleteComment(req, res) {
    try {
      const { comment_id } = req.params;
      const user_id = req.user.user_id;

      // Check User có bị khoá không
      // [SỬA 2] Dùng UserService
      const currentUser = await UserService.findById(user_id);
      if (!currentUser || currentUser.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản của bạn đang bị khóa hoặc tạm ngưng hoạt động.",
        });
      }

      // Lấy info comment
      const comment = await Comment.getById(comment_id);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Bình luận không tồn tại" });

      // Sự kiện đóng băng
      if (comment.event_is_deleted || comment.event_status === "rejected") {
        return res
          .status(403)
          .json({ message: "Sự kiện đã bị đóng, không thể xóa dữ liệu." });
      }

      // Check quyền xoá
      let canDelete = false;

      // Chính chủ (Người viết comment)
      if (comment.user_id === user_id) {
        canDelete = true;
      }
      // Chủ sự kiện (Manager được xóa comment rác trên tường nhà mình)
      else if (comment.event_manager_id === user_id) {
        canDelete = true;
      }

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa bình luận này.",
        });
      }

      // Thực hiện xóa
      await Comment.delete(comment_id);
      res.json({ success: true, message: "Đã xóa bình luận" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

export default commentController;
