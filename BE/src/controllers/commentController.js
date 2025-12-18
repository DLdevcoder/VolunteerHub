import CommentService from "../services/commentService.js";
import UserService from "../services/UserService.js";
import NotificationService from "../services/notificationService.js";
import PostService from "../services/postService.js";
import EventService from "../services/eventService.js";
import RegistrationService from "../services/registrationService.js";

const commentController = {
  // =================================================================
  // 1. XEM BÌNH LUẬN
  // =================================================================
  async getPostComments(req, res) {
    try {
      const { post_id } = req.params;
      const user_id = req.user.user_id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Lấy thông tin bài viết
      const post = await PostService.getById(post_id);

      if (!post)
        return res
          .status(404)
          .json({ success: false, message: "Bài viết không tồn tại" });

      // Lấy thông tin sự kiện
      const event = await EventService.getEventById(post.event_id);

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
        const reg = await RegistrationService.findOne(user_id, event.event_id);
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

      // Lấy danh sách comment
      const result = await CommentService.getByPostId(
        post_id,
        page,
        limit,
        user_id
      );

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

  // =================================================================
  // 2. TẠO BÌNH LUẬN
  // =================================================================
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
      const currentUser = await UserService.findById(user_id);
      if (!currentUser || currentUser.status !== "Active")
        return res.status(403).json({ message: "Tài khoản bị khóa" });

      // Lấy thông tin bài viết
      const post = await PostService.getById(post_id);

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
        const reg = await RegistrationService.findOne(user_id, post.event_id);
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
      const commentId = await CommentService.create({
        post_id,
        user_id,
        content,
      });
      const newComment = await CommentService.getById(commentId);

      // Gửi thông báo
      try {
        if (post.user_id !== user_id) {
          await NotificationService.notifyNewComment(
            post.event_id,
            commentId,
            post_id,
            user_id,
            content
          );
        }
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

  // =================================================================
  // 3. XÓA BÌNH LUẬN
  // =================================================================
  async deleteComment(req, res) {
    try {
      const { comment_id } = req.params;
      const user_id = req.user.user_id;

      const currentUser = await UserService.findById(user_id);
      if (!currentUser || currentUser.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản của bạn đang bị khóa hoặc tạm ngưng hoạt động.",
        });
      }

      // Lấy info comment
      const comment = await CommentService.getById(comment_id);
      if (!comment)
        return res
          .status(404)
          .json({ success: false, message: "Bình luận không tồn tại" });

      if (comment.event_is_deleted || comment.event_status === "rejected") {
        return res
          .status(403)
          .json({ message: "Sự kiện đã bị đóng, không thể xóa dữ liệu." });
      }

      // Check quyền xoá
      let canDelete = false;
      if (comment.user_id === user_id) {
        canDelete = true;
      } else if (comment.event_manager_id === user_id) {
        canDelete = true;
      }

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền xóa bình luận này.",
        });
      }

      await CommentService.delete(comment_id);
      res.json({ success: true, message: "Đã xóa bình luận" });
    } catch (error) {
      console.error("Delete comment error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

export default commentController;