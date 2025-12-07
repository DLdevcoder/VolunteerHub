// src/controllers/registrationController.js
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";

const registrationController = {
  // =========================================================
  // VOLUNTEER – Đăng ký sự kiện
  // =========================================================
  async registerEvent(req, res) {
    try {
      const { event_id } = req.params;
      const user_id = req.user.user_id;

      // 1. Kiểm tra User
      const currentUser = await User.findById(user_id);

      if (!currentUser || currentUser.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản của bạn đang bị khóa hoặc tạm ngưng hoạt động.",
        });
      }

      // 2. Kiểm tra Sự kiện
      const event = await Event.getEventById(event_id);

      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Sự kiện không tồn tại" });
      }

      if (event.approval_status !== "approved") {
        return res.status(400).json({
          success: false,
          message: "Sự kiện chưa được duyệt hoặc đã bị hủy",
        });
      }

      // 3. Chặn nếu sự kiện đã bắt đầu
      const now = new Date();
      if (new Date(event.start_date) <= now) {
        return res.status(400).json({
          success: false,
          message: "Sự kiện đã bắt đầu hoặc kết thúc, không thể đăng ký thêm.",
        });
      }

      // 4. Check full slot (pending + approved <= 120% target)
      if (event.target_participants > 0) {
        const totalRequests = await Registration.countRequests(event_id);
        const maxAllow = Math.ceil(event.target_participants * 1.2);

        if (totalRequests >= maxAllow) {
          return res.status(409).json({
            success: false,
            message:
              "Sự kiện đã nhận đủ số lượng hồ sơ đăng ký. Vui lòng quay lại sau nếu có người hủy.",
          });
        }
      }

      // 5. Kiểm tra lịch sử đăng ký
      const existingReg = await Registration.findOne(user_id, event_id);

      // --- ĐÃ CÓ ĐĂNG KÝ TRƯỚC ĐÓ ---
      if (existingReg) {
        if (["pending", "approved", "completed"].includes(existingReg.status)) {
          return res.status(409).json({
            success: false,
            message:
              "Bạn đã đăng ký sự kiện này rồi (Trạng thái: " +
              existingReg.status +
              ")",
          });
        }

        // Đã hủy hoặc bị từ chối -> cho đăng ký lại
        if (["cancelled", "rejected"].includes(existingReg.status)) {
          await Registration.reRegister(user_id, event_id);

          // 🔔 Gửi notification cho Manager khi re-register
          try {
            await Notification.createAndPush({
              user_id: event.manager_id,
              type: "new_registration",
              payload: {
                event_id,
                event_title: event.title,
                registration_id: existingReg.registration_id,
                user_id,
                user_name: currentUser.full_name,
                message: `Có đăng ký lại từ ${currentUser.full_name} cho sự kiện "${event.title}"`,
                // Manager click -> tới tab Participants của event đó
                url: `/manager/events/${event_id}?tab=participants`,
              },
            });
          } catch (notifyErr) {
            console.error("Notify manager (re-register) failed:", notifyErr);
          }

          return res.status(200).json({
            success: true,
            message: "Gửi lại hồ sơ thành công! Vui lòng chờ duyệt.",
          });
        }
      }

      // --- 6. Đăng ký mới ---
      const newRegistrationId = await Registration.create(user_id, event_id);

      // 🔔 Gửi notification cho Manager khi đăng ký mới
      try {
        await Notification.createAndPush({
          user_id: event.manager_id, // Manager nhận
          type: "new_registration",
          payload: {
            event_id,
            event_title: event.title,
            registration_id: newRegistrationId,
            user_id,
            user_name: currentUser.full_name,
            message: `Có đăng ký mới từ ${currentUser.full_name} cho sự kiện "${event.title}"`,
            url: `/manager/events/${event_id}?tab=participants`,
          },
        });
      } catch (notifyErr) {
        console.error("Notify manager (new registration) failed:", notifyErr);
      }

      return res.status(201).json({
        success: true,
        message: "Đã gửi yêu cầu đăng ký! Vui lòng chờ Quản lý sự kiện duyệt.",
      });
    } catch (error) {
      console.error("Register event error:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server khi đăng ký" });
    }
  },

  // =========================================================
  // VOLUNTEER – Huỷ đăng ký
  // =========================================================
  async cancelRegistration(req, res) {
    try {
      const { event_id } = req.params;
      const user_id = req.user.user_id;

      // Kiểm tra trạng thái đăng ký
      const existingReg = await Registration.findOne(user_id, event_id);

      if (!existingReg) {
        return res
          .status(400)
          .json({ success: false, message: "Bạn chưa đăng ký sự kiện này." });
      }

      // Đã hoàn thành thì không được hủy
      if (existingReg.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Bạn đã hoàn thành sự kiện này, không thể hủy đăng ký.",
        });
      }

      // Nếu đã hủy hoặc bị từ chối trước đó
      if (["cancelled", "rejected"].includes(existingReg.status)) {
        return res.status(400).json({
          success: false,
          message: "Đăng ký này đã bị hủy hoặc từ chối trước đó.",
        });
      }

      const event = await Event.getEventById(event_id);

      // Sự kiện bị xóa mềm
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện không tồn tại hoặc đã bị hủy bỏ bởi ban tổ chức.",
        });
      }

      const now = new Date();
      const eventStart = new Date(event.start_date);
      const oneDay = 24 * 60 * 60 * 1000; // 24 giờ tính bằng ms

      // Sự kiện đã bắt đầu hoặc kết thúc -> Không cho hủy
      if (eventStart <= now) {
        return res.status(400).json({
          success: false,
          message:
            "Sự kiện đang diễn ra hoặc đã kết thúc, không thể hủy đăng ký.",
        });
      }

      // Quy định hủy trước 24h
      if (eventStart.getTime() - now.getTime() < oneDay) {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy đăng ký sát giờ (cần hủy trước ít nhất 24h).",
        });
      }

      // Thực hiện huỷ
      const cancelled = await Registration.cancel(user_id, event_id);
      if (!cancelled) {
        return res
          .status(400)
          .json({ success: false, message: "Hủy đăng ký thất bại" });
      }

      // (Tuỳ chọn) Thông báo cho Manager biết TNV hủy đăng ký
      try {
        const currentUser = await User.findById(user_id);
        await Notification.createAndPush({
          user_id: event.manager_id,
          type: "registration_cancelled",
          payload: {
            event_id,
            event_title: event.title,
            user_id,
            user_name: currentUser?.full_name,
            message: `${currentUser?.full_name || "Một tình nguyện viên"} đã hủy đăng ký khỏi sự kiện "${event.title}".`,
            url: `/manager/events/${event_id}?tab=participants`,
          },
        });
      } catch (notifyErr) {
        console.error(
          "Notify manager (cancel registration) failed:",
          notifyErr
        );
      }

      res.json({ success: true, message: "Hủy đăng ký thành công" });
    } catch (error) {
      console.error("Cancel registration error:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server khi hủy đăng ký" });
    }
  },

  // =========================================================
  // MANAGER – Lấy danh sách đăng ký của 1 sự kiện
  // =========================================================
  async getEventRegistrations(req, res) {
    try {
      const { event_id } = req.params;
      const manager_id = req.user.user_id;

      // Kiểm tra sự kiện tồn tại
      const event = await Event.getEventById(event_id);

      if (!event) {
        return res
          .status(404)
          .json({ success: false, message: "Sự kiện không tồn tại" });
      }

      // Chủ sở hữu
      if (event.manager_id !== manager_id) {
        return res.status(403).json({
          success: false,
          message:
            "Bạn không có quyền xem danh sách người tham gia của sự kiện này.",
        });
      }

      // Lấy danh sách
      const list = await Registration.getByEventId(event_id);

      res.json({
        success: true,
        message: "Lấy danh sách đăng ký thành công",
        data: list,
      });
    } catch (error) {
      console.error("Get registrations error:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server khi lấy danh sách" });
    }
  },

  // =========================================================
  // MANAGER – Duyệt đăng ký
  // =========================================================
  async approveRegistration(req, res) {
    try {
      const { registration_id } = req.params;
      const manager_id = req.user.user_id;

      // Lấy thông tin đăng ký
      const reg = await Registration.getDetailById(registration_id);
      if (!reg) {
        return res
          .status(404)
          .json({ success: false, message: "Đơn đăng ký không tồn tại" });
      }

      // Check quyền sở hữu (Chỉ chủ sự kiện mới được duyệt)
      if (reg.manager_id !== manager_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền quản lý sự kiện này",
        });
      }

      // Sự kiện bị xoá mềm
      if (reg.event_is_deleted) {
        return res.status(404).json({
          success: false,
          message: "Sự kiện này đã bị xóa, không thể thực hiện duyệt.",
        });
      }

      // Check hết chỗ
      if (
        reg.target_participants > 0 &&
        reg.current_participants >= reg.target_participants
      ) {
        return res.status(409).json({
          success: false,
          message: `Sự kiện đã đủ số lượng (${reg.current_participants}/${reg.target_participants}). Không thể duyệt thêm.`,
        });
      }

      // Check trạng thái
      if (reg.status === "approved") {
        return res
          .status(400)
          .json({ success: false, message: "Đơn này đã được duyệt rồi" });
      }
      if (reg.status === "completed") {
        return res.status(400).json({
          success: false,
          message:
            "Tình nguyện viên này đã hoàn thành sự kiện, không thể thay đổi trạng thái.",
        });
      }

      const now = new Date();
      if (new Date(reg.end_date) <= now) {
        return res.status(400).json({
          success: false,
          message: "Sự kiện đã kết thúc, không thể duyệt thêm người tham gia.",
        });
      }

      // Check user có đang hoạt động không
      if (reg.user_status !== "Active") {
        return res.status(400).json({
          success: false,
          message:
            "Tài khoản của tình nguyện viên này đang bị Khóa hoặc Tạm ngưng.",
        });
      }

      // Thực hiện duyệt
      await Registration.approve(registration_id);

      // 🔔 Gửi thông báo cho TNV: đã được duyệt
      try {
        await Notification.createAndPush({
          user_id: reg.user_id,
          type: "registration_approved",
          payload: {
            event_id: reg.event_id,
            event_title: reg.event_title,
            registration_id,
            message: `Đăng ký của bạn cho sự kiện "${reg.event_title}" đã được duyệt.`,
            url: `/events/${reg.event_id}`,
          },
        });
      } catch (notifyErr) {
        console.error("Notify volunteer (approved) failed:", notifyErr);
      }

      res.json({ success: true, message: "Đã duyệt đăng ký thành công" });
    } catch (error) {
      console.error("Approve reg error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // =========================================================
  // MANAGER – Từ chối đăng ký
  // =========================================================
  async rejectRegistration(req, res) {
    try {
      const { registration_id } = req.params;
      const manager_id = req.user.user_id;
      let { reason } = req.body;

      // Cắt khoảng trắng thừa
      if (reason) reason = reason.trim();

      // Validate Input
      if (!reason || reason.trim().length < 5) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự)",
        });
      }

      // Lấy thông tin & Check quyền
      const reg = await Registration.getDetailById(registration_id);
      if (!reg) {
        return res
          .status(404)
          .json({ success: false, message: "Đơn đăng ký không tồn tại" });
      }
      if (reg.manager_id !== manager_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền quản lý sự kiện này",
        });
      }

      // Check trạng thái
      if (reg.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Tình nguyện viên đã hoàn thành sự kiện, không thể từ chối",
        });
      }

      // Đã huỷ -> Cấm
      if (reg.status === "cancelled") {
        return res.status(400).json({
          success: false,
          message: "Người dùng đã tự hủy đăng ký trước đó.",
        });
      }

      // Đã từ chối rồi -> Cấm
      if (reg.status === "rejected") {
        return res.status(400).json({
          success: false,
          message: "Đơn đăng ký này đã bị từ chối rồi.",
        });
      }

      // Thực hiện từ chối
      await Registration.reject(registration_id, reason);

      // 🔔 Gửi thông báo cho TNV: bị từ chối
      try {
        await Notification.createAndPush({
          user_id: reg.user_id,
          type: "registration_rejected",
          payload: {
            event_id: reg.event_id,
            event_title: reg.event_title,
            registration_id,
            reason,
            message: `Đăng ký của bạn cho sự kiện "${reg.event_title}" đã bị từ chối.`,
            url: `/events/${reg.event_id}`,
          },
        });
      } catch (notifyErr) {
        console.error("Notify volunteer (rejected) failed:", notifyErr);
      }

      res.json({ success: true, message: "Từ chối đăng ký thành công" });
    } catch (error) {
      console.error("Reject reg error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // =========================================================
  // MANAGER – Đánh dấu hoàn thành
  // =========================================================
  async completeRegistration(req, res) {
    try {
      const { registration_id } = req.params;
      const manager_id = req.user.user_id;

      // Lấy thông tin & Check quyền
      const reg = await Registration.getDetailById(registration_id);
      if (!reg) {
        return res
          .status(404)
          .json({ success: false, message: "Đơn đăng ký không tồn tại" });
      }
      if (reg.manager_id !== manager_id) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền quản lý sự kiện này",
        });
      }

      if (reg.status === "completed") {
        return res.status(400).json({
          success: false,
          message: "Tình nguyện viên này đã được xác nhận hoàn thành rồi.",
        });
      }
      // Chỉ đánh dấu hoàn thành khi sự kiện đã được duyệt
      if (reg.status !== "approved") {
        return res.status(400).json({
          success: false,
          message:
            "Chỉ có thể đánh dấu hoàn thành cho tình nguyện viên đã được duyệt (approved)",
        });
      }

      // Chỉ hoàn thành khi sự kiện đã bắt đầu
      const now = new Date();
      const eventStart = new Date(reg.start_date);

      if (now < eventStart) {
        return res.status(400).json({
          success: false,
          message: "Sự kiện chưa diễn ra, không thể đánh dấu hoàn thành sớm.",
        });
      }

      // Thực hiện
      await Registration.complete(registration_id, manager_id);

      // 🔔 Thông báo cho TNV: hoàn thành
      try {
        await Notification.createAndPush({
          user_id: reg.user_id,
          type: "registration_completed",
          payload: {
            event_id: reg.event_id,
            event_title: reg.event_title,
            registration_id,
            message: `Bạn đã được xác nhận hoàn thành sự kiện "${reg.event_title}". Cảm ơn bạn đã tham gia!`,
            url: `/events/${reg.event_id}`,
          },
        });
      } catch (notifyErr) {
        console.error("Notify volunteer (completed) failed:", notifyErr);
      }

      res.json({
        success: true,
        message: "Xác nhận hoàn thành công việc cho tình nguyện viên",
      });
    } catch (error) {
      console.error("Complete reg error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // =========================================================
  // VOLUNTEER – Lấy lịch sử tham gia
  // =========================================================
  async getMyEventHistory(req, res) {
    try {
      const userId = req.user.user_id;

      // Lấy danh sách tất cả sự kiện đã đăng ký
      const history = await Event.getEventHistoryByUserId(userId);

      res.json({
        success: true,
        message: "Lấy lịch sử tham gia thành công",
        data: history,
      });
    } catch (error) {
      console.error("Get my event history error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy lịch sử tham gia",
        error: error.message,
      });
    }
  },

  // =========================================================
  // VOLUNTEER – Lấy trạng thái đăng ký của bản thân cho 1 event
  // (dùng cho FE: ẩn/hiện tab Posts, đổi text nút Đăng ký / Hủy)
  // GET /api/registrations/events/:event_id/my-status
  // =========================================================
  async getMyRegistrationStatus(req, res) {
    try {
      const { event_id } = req.params;
      const user_id = req.user.user_id;

      const reg = await Registration.findOne(user_id, event_id);

      if (!reg) {
        return res.json({
          success: true,
          data: {
            hasRegistration: false,
            status: null,
            canAccessPosts: false,
          },
        });
      }

      const status = reg.status;
      const canAccessPosts = ["approved", "completed"].includes(status);

      return res.json({
        success: true,
        data: {
          hasRegistration: true,
          status,
          canAccessPosts,
        },
      });
    } catch (error) {
      console.error("Get my registration status error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy trạng thái đăng ký",
      });
    }
  },
};

export default registrationController;
