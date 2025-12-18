import EventService from "../services/eventService.js";

const eventPermission = {
  // =================================================================
  // 1. KIỂM TRA QUYỀN SỞ HỮU (Dành cho Manager)
  // =================================================================
  checkEventOwnership: async (req, res, next) => {
    try {
      const { event_id } = req.params;
      const user_id = req.user.user_id;
      const role_name = req.user.role_name;

      // Admin có quyền xóa bất kỳ sự kiện nào
      if (role_name === "Admin") {
        return next();
      }

      const eventExists = await EventService.eventExists(event_id);
      if (!eventExists) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

      const isOwner = await EventService.isEventOwner(event_id, user_id);
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

  // =================================================================
  // 2. KIỂM TRA SỰ KIỆN TỒN TẠI (Public)
  // =================================================================
  checkEventExists: async (req, res, next) => {
    try {
      const { event_id } = req.params;

      const event = await EventService.getEventById(event_id);

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

  // =================================================================
  // 3. KIỂM TRA ĐÃ DUYỆT (Cho Volunteer đăng ký)
  // =================================================================
  checkEventApproved: async (req, res, next) => {
    try {
      const { event_id } = req.params;

      const event = await EventService.getEventById(event_id);

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

  // =================================================================
  // 4. KIỂM TRA SỰ KIỆN CHƯA BẮT ĐẦU (Cho phép sửa/hủy)
  // =================================================================
  checkEventNotStarted: async (req, res, next) => {
    try {
      const { event_id } = req.params;

      const event = await EventService.getEventById(event_id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

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

  // =================================================================
  // 5. CHECK CHƯA DUYỆT (Dùng cho Admin khi muốn Duyệt)
  // =================================================================
  checkEventNotApproved: async (req, res, next) => {
    try {
      const { event_id } = req.params;
      let event = req.event;

      if (!event) {
        event = await EventService.getEventById(event_id);
      }

      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Sự kiện không tồn tại" });
      }

      if (event.approval_status === "approved") {
        return res.status(400).json({
          success: false,
          message: "Sự kiện này đã được duyệt rồi, không thể thao tác lại.",
        });
      }

      req.event = event;
      next();
    } catch (error) {
      console.error("Check status error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // =================================================================
  // 6. CHECK CHƯA TỪ CHỐI (Dùng cho Admin khi muốn Từ chối)
  // =================================================================
  checkEventNotRejected: async (req, res, next) => {
    try {
      const { event_id } = req.params;

      const event = req.event || (await EventService.getEventById(event_id));

      if (!event)
        return res
          .status(404)
          .json({ success: false, message: "Sự kiện không tồn tại" });

      if (event.approval_status === "rejected") {
        return res.status(400).json({
          success: false,
          message: "Sự kiện này đã bị từ chối trước đó rồi.",
        });
      }

      req.event = event;
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },
};

export default eventPermission;