import Event from "../models/Event.js";

const eventPermission = {
  // Kiểm tra quyền sở hữu sự kiện (Manager tạo sự kiện)
  // Admin xóa không cần check ownership, Manager phải là chủ sở hữu
  checkEventOwnership: async (req, res, next) => {
    try {
      const { event_id } = req.params;
      const user_id = req.user.user_id;
      const role_name = req.user.role_name;

      // Admin có quyền xóa bất kỳ sự kiện nào (không cần check ownership)
      if (role_name === "Admin") {
        return next();
      }

      // Kiểm tra sự kiện có tồn tại không
      const eventExists = await Event.eventExists(event_id);
      if (!eventExists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

      // Manager phải là chủ sở hữu mới được thao tác
      const isOwner = await Event.isEventOwner(event_id, user_id);
      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thao tác với sự kiện này",
        });
      }

      next();
    } catch (error) {
      console.error("Check event ownership error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra quyền",
      });
    }
  },

  // Kiểm tra sự kiện có tồn tại không (dùng cho các route public)
  checkEventExists: async (req, res, next) => {
    try {
      const { event_id } = req.params;

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

      // Lưu thông tin event vào req để tái sử dụng
      req.event = event;
      next();
    } catch (error) {
      console.error("Check event exists error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra sự kiện",
      });
    }
  },

  // Kiểm tra sự kiện đã được duyệt chưa (cho volunteer đăng ký)
  checkEventApproved: async (req, res, next) => {
    try {
      const { event_id } = req.params;

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

      if (event.approval_status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Sự kiện chưa được duyệt hoặc đã bị từ chối",
        });
      }

      // Lưu thông tin event vào req
      req.event = event;
      next();
    } catch (error) {
      console.error("Check event approved error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra trạng thái sự kiện",
      });
    }
  },

  // Kiểm tra sự kiện chưa bắt đầu (cho phép chỉnh sửa/hủy)
  checkEventNotStarted: async (req, res, next) => {
    try {
      const { event_id } = req.params;

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }
      // Lưu event vào req để tái sử dụng trong controller (tránh query lại DB)
      req.event = event;
      next();
    } catch (error) {
      console.error("Check event not started error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra thời gian sự kiện",
      });
    }
  },

  // Kiểm tra sự kiện đang chờ duyệt (cho Admin duyệt/từ chối)
  checkEventPending: async (req, res, next) => {
    try {
      const { event_id } = req.params;

      const event = await Event.getEventById(event_id);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

      if (event.approval_status !== "pending") {
        return res.status(400).json({
          success: false,
          message: `Sự kiện đã được ${
            event.approval_status === "approved" ? "duyệt" : "từ chối"
          } trước đó`,
        });
      }

      req.event = event;
      next();
    } catch (error) {
      console.error("Check event pending error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi kiểm tra trạng thái sự kiện",
      });
    }
  },
};

export default eventPermission;