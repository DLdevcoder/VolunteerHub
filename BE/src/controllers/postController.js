// src/controllers/postController.js
import Post from "../models/Post.js";
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";

const postController = {
  // Xem danh sách bài đăng
  async getEventPosts(req, res) {
    try {
      const { event_id } = req.params;
      const user_id = req.user.user_id;

      // Phân trang
      let page = parseInt(req.query.page);
      let limit = parseInt(req.query.limit);

      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;
      if (limit > 50) limit = 50;

      // Kiểm tra sự kiện
      const event = await Event.getEventById(event_id);
      if (!event)
        return res
          .status(404)
          .json({ success: false, message: "Sự kiện không tồn tại" });

      // Kiểm tra trạng thái sự kiện (Phải Approved mới có tường)
      if (event.approval_status !== "approved") {
        return res
          .status(403)
          .json({ success: false, message: "Kênh trao đổi chưa mở." });
      }

      // Chỉ cho phép: Manager (Chủ) hoặc Volunteer (Đã được duyệt)
      let canView = false;
      if (event.manager_id === user_id) {
        canView = true;
      } else {
        const reg = await Registration.findOne(user_id, event_id);
        if (reg && (reg.status === "approved" || reg.status === "completed")) {
          canView = true;
        }
      }

      if (!canView) {
        return res.status(403).json({
          success: false,
          message:
            "Bạn không có quyền xem nội dung này. Chỉ thành viên tham gia sự kiện mới được truy cập.",
        });
      }

      // Lấy dữ liệu (có phân trang)
      const result = await Post.getByEventId(event_id, page, limit, user_id);

      res.json({
        success: true,
        data: result.posts,
        pagination: result.pagination,
      });
    } catch (error) {
      console.error("Get posts error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // Đăng bài mới
  async createPost(req, res) {
    try {
      const { event_id } = req.params;
      const user_id = req.user.user_id;
      let { content } = req.body;

      // Validate nội dung
      if (!content || typeof content !== "string") {
        return res
          .status(400)
          .json({ success: false, message: "Nội dung không hợp lệ" });
      }

      content = content.trim();

      if (content.length === 0) {
        return res
          .status(400)
          .json({ success: false, message: "Nội dung không được để trống" });
      }

      // Chặn nội dung quá dài
      if (content.length > 2000) {
        return res.status(400).json({
          success: false,
          message: `Nội dung quá dài (${content.length}/2000 ký tự). Vui lòng viết ngắn gọn hơn.`,
        });
      }

      // (Đảm bảo user không bị khóa sau khi login)
      const currentUser = await User.findById(user_id);
      if (!currentUser || currentUser.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản của bạn đang bị khóa, không thể đăng bài.",
        });
      }

      // Kiểm tra sự kiện & quyền
      const event = await Event.getEventById(event_id);
      if (!event)
        return res
          .status(404)
          .json({ success: false, message: "Sự kiện không tồn tại" });

      if (event.approval_status !== "approved") {
        return res
          .status(403)
          .json({ success: false, message: "Kênh trao đổi chưa được mở." });
      }

      let canPost = false;
      if (event.manager_id === user_id) {
        canPost = true;
      } else {
        const reg = await Registration.findOne(user_id, event_id);
        if (reg && (reg.status === "approved" || reg.status === "completed")) {
          canPost = true;
        }
      }

      if (!canPost) {
        return res
          .status(403)
          .json({ success: false, message: "Bạn không có quyền đăng bài." });
      }

      // Tạo bài
      const postId = await Post.create({ event_id, user_id, content });
      const newPost = await Post.getById(postId);

      res.status(201).json({
        success: true,
        message: "Đăng bài thành công",
        data: { post: newPost },
      });
    } catch (error) {
      console.error("Create post error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // Xoá bài đăng
  async deletePost(req, res) {
    try {
      const { post_id } = req.params;
      const user_id = req.user.user_id;

      // Lấy thông tin bài viết
      const post = await Post.getById(post_id);

      if (!post)
        return res
          .status(404)
          .json({ success: false, message: "Bài viết không tồn tại" });

      // Nếu sự kiện bị xoá hoặc từ chối -> Đóng băng thao tác
      if (post.event_is_deleted || post.event_status === "rejected") {
        return res.status(403).json({
          success: false,
          message:
            "Hành động bị từ chối: Sự kiện này đã bị xóa hoặc bị hủy bỏ (Đóng băng dữ liệu).",
        });
      }

      // Check quyền xoá
      let canDelete = false;

      // Chính chủ (Tác giả bài viết)
      if (post.user_id === user_id) {
        canDelete = true;
      }

      // Manager được quyền xóa bài của bất kỳ ai trong sự kiện của mình để dọn dẹp
      else if (post.event_manager_id === user_id) {
        canDelete = true;
      }

      if (!canDelete) {
        return res.status(403).json({
          success: false,
          message:
            "Bạn không có quyền xóa bài viết này (Chỉ tác giả hoặc Quản lý sự kiện mới được xóa).",
        });
      }

      // Thực hiện xóa
      await Post.delete(post_id);

      res.json({ success: true, message: "Đã xóa bài viết thành công" });
    } catch (error) {
      console.error("Delete post error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

export default postController;
