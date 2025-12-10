import Event from "../models/Event.js";
import Notification from "../models/Notification.js";
// [SỬA 1] Import UserService thay vì User Model
import UserService from "../services/UserService.js";
import Registration from "../models/Registration.js";

// Hàm helper: Format ngày giữ nguyên giờ nhập vào
const formatDateAsIs = (dateInput) => {
  const date = new Date(dateInput);
  const pad = (num) => num.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
    date.getSeconds()
  )}`;
};

const eventController = {
  // Tạo sự kiện
  async createEvent(req, res) {
    try {
      let {
        title,
        description,
        target_participants,
        start_date,
        end_date,
        location,
        category_id,
      } = req.body;

      const manager_id = req.user.user_id;

      title = title ? title.trim() : "";
      description = description ? description.trim() : "";
      location = location ? location.trim() : "";

      if (!title || !description || !start_date || !end_date || !location) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng cung cấp đầy đủ thông tin: title, description, start_date, end_date, location",
        });
      }

      if (target_participants !== undefined && target_participants !== null) {
        const participants = Number(target_participants);
        if (isNaN(participants))
          return res
            .status(400)
            .json({ success: false, message: "Số lượng phải là số" });
        if (participants <= 0)
          return res
            .status(400)
            .json({ success: false, message: "Số lượng phải lớn hơn 0" });
        if (participants > 5000)
          return res
            .status(400)
            .json({ success: false, message: "Số lượng quá lớn (max 5000)" });
      }

      const startDateObj = new Date(start_date);
      const endDateObj = new Date(end_date);
      const now = new Date();

      if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Định dạng ngày tháng không hợp lệ",
        });
      }
      if (startDateObj >= endDateObj) {
        return res.status(400).json({
          success: false,
          message: "Ngày kết thúc phải sau ngày bắt đầu",
        });
      }
      if (startDateObj < now) {
        return res.status(400).json({
          success: false,
          message: "Ngày bắt đầu phải trong tương lai",
        });
      }
      if (endDateObj.getTime() - startDateObj.getTime() < 15 * 60 * 1000) {
        return res.status(400).json({
          success: false,
          message: "Thời lượng sự kiện quá ngắn (tối thiểu 15 phút)",
        });
      }

      const formattedStartDate = formatDateAsIs(start_date);
      const formattedEndDate = formatDateAsIs(end_date);

      const isDuplicate = await Event.checkDuplicate(
        title,
        formattedStartDate,
        location
      );
      if (isDuplicate) {
        return res.status(409).json({
          success: false,
          message: "Sự kiện bị trùng lặp (Tên, Giờ, Địa điểm)",
        });
      }

      const eventId = await Event.createEvent({
        title,
        description,
        target_participants: target_participants || 0,
        start_date: formattedStartDate,
        end_date: formattedEndDate,
        location,
        manager_id,
        category_id: category_id || null,
      });

      const newEvent = await Event.getEventById(eventId);

      // 🔔 Gửi thông báo cho tất cả Admin: có sự kiện mới chờ duyệt
      try {
        // [SỬA 2] Dùng UserService.getAdmins()
        const admins = await UserService.getAdmins();
        console.log("Admins from getAdmins():", admins);

        if (!admins || admins.length === 0) {
          console.log(
            "No admins found => no event_pending_approval notifications."
          );
        } else {
          for (const admin of admins) {
            console.log(
              `Creating event_pending_approval notification for admin_id = ${admin.user_id}`
            );

            await Notification.createAndPush({
              user_id: admin.user_id,
              type: "event_pending_approval",
              payload: {
                event_id: eventId,
                event_title: newEvent.title,
                manager_id,
                manager_name: newEvent.manager_name,
                message: `Sự kiện "${newEvent.title}" vừa được tạo bởi ${newEvent.manager_name} và đang chờ duyệt.`,
                url: `/admin/events/${eventId}`,
              },
            });
          }

          console.log(
            `Created event_pending_approval notifications for ${admins.length} admin(s)`
          );
        }
      } catch (notifyErr) {
        console.error(
          "Send event_pending_approval notification failed:",
          notifyErr
        );
      }

      res.status(201).json({
        success: true,
        message: "Tạo sự kiện thành công",
        data: { event: newEvent },
      });
    } catch (error) {
      console.error("Create event error:", error);

      if (error.code === "ER_NO_REFERENCED_ROW_2") {
        return res
          .status(400)
          .json({ success: false, message: "Danh mục không tồn tại" });
      }
      if (error.code === "ER_TRUNCATED_WRONG_VALUE") {
        return res.status(400).json({
          success: false,
          message: "Lỗi định dạng ngày tháng với Database",
        });
      }
      if (error.code === "ER_DATA_TOO_LONG") {
        return res
          .status(400)
          .json({ success: false, message: "Dữ liệu nhập vào quá dài" });
      }

      res.status(500).json({
        success: false,
        message: "Lỗi máy chủ nội bộ khi tạo sự kiện",
      });
    }
  },

  // Lấy danh mục sự kiện
  async getCategories(req, res) {
    try {
      const categories = await Event.getAllCategories();

      res.json({
        success: true,
        message: "Lấy danh sách danh mục thành công",
        data: categories,
      });
    } catch (error) {
      console.error("Get categories error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách danh mục",
      });
    }
  },

  // Lấy danh sách sự kiện (có lọc và phân trang) (hỗ trợ lấy cả sự kiện đã xóa mềm)
  async getAllEvents(req, res) {
    try {
      let page = parseInt(req.query.page);
      // Xử lý limit: Nếu là 'all' thì giữ nguyên, nếu là số thì parse
      let limitInput = req.query.limit;
      let limit;
      if (limitInput === "all") {
        limit = "all";
      } else {
        limit = parseInt(limitInput);
        if (isNaN(limit) || limit < 1) limit = 10;
        if (limit > 100) limit = 100;
      }

      if (isNaN(page) || page < 1) page = 1;
      const allowedSorts = [
        "created_at",
        "start_date",
        "title",
        "current_participants",
      ];
      let sort_by = req.query.sort_by;
      let sort_order = req.query.sort_order;

      if (!allowedSorts.includes(sort_by)) sort_by = "created_at";
      if (sort_order !== "ASC" && sort_order !== "DESC") sort_order = "DESC";

      const { start_date_from, start_date_to } = req.query;
      const isValidDate = (d) => !isNaN(new Date(d).getTime());

      if (start_date_from && !isValidDate(start_date_from)) {
        return res
          .status(400)
          .json({ success: false, message: "Ngày bắt đầu không hợp lệ" });
      }
      if (start_date_to && !isValidDate(start_date_to)) {
        return res
          .status(400)
          .json({ success: false, message: "Ngày kết thúc không hợp lệ" });
      }
      if (
        start_date_from &&
        start_date_to &&
        new Date(start_date_from) > new Date(start_date_to)
      ) {
        return res.status(400).json({
          success: false,
          message: "Ngày bắt đầu phải nhỏ hơn ngày kết thúc",
        });
      }

      let is_deleted = req.query.is_deleted;
      const filters = {
        page,
        limit,
        approval_status: req.query.approval_status,
        category_id: req.query.category_id,
        manager_id: req.query.manager_id,
        search: req.query.search
          ? req.query.search.trim().substring(0, 100)
          : undefined, // Cắt ngắn search
        start_date_from,
        start_date_to,
        sort_by,
        sort_order,
        is_deleted,
      };

      const result = await Event.getAllEvents(filters);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("Get all events error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách sự kiện",
      });
    }
  },

  // Lấy danh sách sự kiện đang hoạt động (đã duyệt, chưa kết thúc)
  async getActiveEvents(req, res) {
    try {
      const userId = req.user?.user_id;
      const userRole = req.user?.role_name;

      // Chỉ Volunteer mới cần JOIN Registrations
      const includeUserRegistration = userId && userRole === "Volunteer";

      let page = parseInt(req.query.page, 10);
      let limit = parseInt(req.query.limit, 10);

      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;
      if (limit > 100) limit = 100;

      let category_id = req.query.category_id;
      if (category_id && isNaN(Number(category_id))) {
        category_id = undefined;
      }

      let search = req.query.search;
      if (search) {
        search = search.trim();
        if (search.length > 100) {
          search = search.substring(0, 100);
        }
      }

      let { start_date_from, start_date_to } = req.query;

      const isValidDate = (d) => !isNaN(new Date(d).getTime());

      if (start_date_from && !isValidDate(start_date_from)) {
        return res.status(400).json({
          success: false,
          message: "Ngày bắt đầu (start_date_from) không hợp lệ",
        });
      }

      if (start_date_to && !isValidDate(start_date_to)) {
        return res.status(400).json({
          success: false,
          message: "Ngày kết thúc (start_date_to) không hợp lệ",
        });
      }

      if (start_date_from && start_date_to) {
        if (new Date(start_date_from) > new Date(start_date_to)) {
          return res.status(400).json({
            success: false,
            message:
              "Khoảng thời gian không hợp lệ (Ngày bắt đầu phải nhỏ hơn ngày kết thúc)",
          });
        }
      }

      const filters = {
        page,
        limit,
        category_id,
        search,
        start_date_from,
        start_date_to,
      };

      const result = await Event.getActiveEvents(
        filters,
        includeUserRegistration ? userId : null
      );

      return res.json({
        success: true,
        message: "Lấy danh sách sự kiện thành công",
        data: result,
      });
    } catch (error) {
      console.error("Get active events error:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi máy chủ nội bộ khi tải danh sách sự kiện",
      });
    }
  },

  // Lấy chi tiết sự kiện theo ID (không phân biệt trạng thái, trừ đã xóa mềm)
  async getEventById(req, res) {
    try {
      const { event_id } = req.params;

      const event = await Event.getEventById(event_id);

      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy sự kiện",
        });
      }

      res.json({
        success: true,
        data: {
          event,
        },
      });
    } catch (error) {
      console.error("Get event by id error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin sự kiện",
      });
    }
  },

  // Lấy danh sách sự kiện của Manager đang đăng nhập
  async getMyEvents(req, res) {
    try {
      // Kiểm tra User tồn tại (Tránh crash nếu quên middleware) ---
      if (!req.user || !req.user.user_id) {
        return res.status(401).json({
          success: false,
          message: "Không xác định được người dùng. Vui lòng đăng nhập lại.",
        });
      }

      const manager_id = req.user.user_id;

      // Giới hạn limit (Chống DoS)
      let page = parseInt(req.query.page);
      let limit = parseInt(req.query.limit);

      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(limit) || limit < 1) limit = 10;
      if (limit > 100) limit = 100;

      // Sort Order chỉ được phép là ASC hoặc DESC
      let sort_order = req.query.sort_order;
      if (sort_order) {
        sort_order = sort_order.toUpperCase();
        if (sort_order !== "ASC" && sort_order !== "DESC") {
          sort_order = "DESC";
        }
      }

      let category_id = req.query.category_id;
      if (category_id && isNaN(Number(category_id))) {
        category_id = undefined;
      }

      const filters = {
        page,
        limit,
        manager_id: manager_id,

        approval_status: req.query.approval_status,
        category_id: category_id,
        search: req.query.search ? req.query.search.trim() : undefined,

        sort_by: req.query.sort_by,
        sort_order: sort_order,
      };

      const result = await Event.getAllEvents(filters);

      res.json({
        success: true,
        message: "Lấy danh sách sự kiện của bạn thành công",
        data: result,
      });
    } catch (error) {
      console.error("Get my events error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách sự kiện của bạn",
      });
    }
  },

  // Cập nhật thông tin sự kiện
  async updateEvent(req, res) {
    try {
      const { event_id } = req.params;
      let {
        title,
        description,
        target_participants,
        start_date,
        end_date,
        location,
        category_id,
      } = req.body;

      console.log("[updateEvent] event_id =", event_id);
      console.log("[updateEvent] RAW BODY =", req.body);

      if (title) title = title.trim();
      if (description) description = description.trim();
      if (location) location = location.trim();

      if (start_date) start_date = formatDateAsIs(start_date);
      if (end_date) end_date = formatDateAsIs(end_date);

      const currentEvent = req.event; // set by eventPermission
      if (!currentEvent) {
        return res.status(500).json({
          success: false,
          message:
            "Lỗi hệ thống: Không tìm thấy thông tin sự kiện từ Middleware",
        });
      }

      console.log("[updateEvent] currentEvent =", currentEvent);

      const now = new Date();
      const eventStart = new Date(currentEvent.start_date);
      const isRunning = eventStart <= now;
      const hasParticipants = currentEvent.current_participants > 0;
      const isRestrictedMode = isRunning || hasParticipants;

      const dataToUpdate = {
        title,
        description,
        target_participants,
        start_date,
        end_date,
        location,
        category_id,
      };

      // Xoá field undefined
      Object.keys(dataToUpdate).forEach((k) => {
        if (dataToUpdate[k] === undefined) delete dataToUpdate[k];
      });

      let message = "Cập nhật sự kiện thành công";

      // ---------- Trường hợp đang chạy / đã có người tham gia ----------
      if (isRestrictedMode) {
        if (start_date || end_date) {
          const reason = isRunning
            ? "sự kiện đang diễn ra"
            : "đã có người đăng ký";
          return res.status(400).json({
            success: false,
            message: `Không thể thay đổi thời gian vì ${reason}. Chỉ được sửa thông tin mô tả/địa điểm.`,
          });
        }

        // Vẫn cho phép đổi title/description/location/target_participants/category_id
        message =
          "Cập nhật thông tin nóng thành công (Trạng thái sự kiện được giữ nguyên).";
      } else {
        // ---------- Sự kiện chưa chạy, cho phép đổi thời gian ----------
        if (
          start_date &&
          end_date &&
          new Date(start_date) > new Date(end_date)
        ) {
          return res.status(400).json({
            success: false,
            message: "Ngày bắt đầu phải trước ngày kết thúc",
          });
        }
        if (start_date && !end_date) {
          if (new Date(start_date) > new Date(currentEvent.end_date)) {
            return res.status(400).json({
              success: false,
              message:
                "Ngày bắt đầu mới không được lớn hơn ngày kết thúc hiện tại",
            });
          }
        }
        if (end_date && !start_date) {
          if (new Date(currentEvent.start_date) > new Date(end_date)) {
            return res.status(400).json({
              success: false,
              message:
                "Ngày kết thúc mới không được nhỏ hơn ngày bắt đầu hiện tại",
            });
          }
        }

        // Nếu đang approved thì reset về pending để duyệt lại
        if (currentEvent.approval_status === "approved") {
          dataToUpdate.approval_status = "pending";
          dataToUpdate.approved_by = null;
          dataToUpdate.approval_date = null;
          message =
            "Cập nhật thành công. Sự kiện đã được chuyển về trạng thái chờ duyệt lại.";
        }
      }

      // Nếu bị rejected -> reset về pending
      if (currentEvent.approval_status === "rejected") {
        dataToUpdate.approval_status = "pending";
        dataToUpdate.approved_by = null;
        dataToUpdate.approval_date = null;
        message = "Cập nhật thành công. Sự kiện đã được gửi lại để duyệt.";
      }

      console.log("[updateEvent] DATA TO UPDATE =", dataToUpdate);

      const updated = await Event.updateEvent(event_id, dataToUpdate);

      if (!updated) {
        return res.status(400).json({
          success: false,
          message: "Không có thông tin nào thay đổi hoặc lỗi cập nhật",
        });
      }

      const updatedEvent = await Event.getEventById(event_id);
      console.log("[updateEvent] UPDATED EVENT =", updatedEvent);

      // 🔔 1) Nếu từ approved/rejected → pending => gửi lại thông báo cho Admin
      try {
        const prevStatus = currentEvent.approval_status;
        const newStatus = updatedEvent.approval_status;

        if (
          (prevStatus === "approved" || prevStatus === "rejected") &&
          newStatus === "pending"
        ) {
          // [SỬA 2] Dùng UserService.getAdmins()
          const admins = await UserService.getAdmins();
          if (admins && admins.length) {
            for (const admin of admins) {
              await Notification.createAndPush({
                user_id: admin.user_id,
                type: "event_pending_approval",
                payload: {
                  event_id: updatedEvent.event_id,
                  event_title: updatedEvent.title,
                  manager_id: updatedEvent.manager_id,
                  manager_name: updatedEvent.manager_name,
                  message: `Sự kiện "${updatedEvent.title}" đã được chỉnh sửa và gửi lại để duyệt.`,
                  url: `/admin/events/${updatedEvent.event_id}`,
                },
              });
            }
          }
        }
      } catch (notifyErr) {
        console.error(
          "Notify admins (event re-submit pending for approval) failed:",
          notifyErr
        );
      }

      // 🔔 2) Nếu sự kiện đang chạy / đã có người tham gia & đổi thông tin quan trọng -> báo TNV
      try {
        const wasRestricted =
          isRestrictedMode || currentEvent.current_participants > 0;
        if (wasRestricted) {
          const importantFields = [
            "title",
            "description",
            "location",
            "target_participants",
            "category_id",
          ];
          const changedFields = {};
          let hasImportantChange = false;

          for (const field of importantFields) {
            if (currentEvent[field] !== updatedEvent[field]) {
              changedFields[field] = {
                old: currentEvent[field],
                new: updatedEvent[field],
              };
              hasImportantChange = true;
            }
          }

          if (hasImportantChange) {
            const regs = await Registration.getByEventId(event_id);
            if (regs && regs.length) {
              const toNotify = regs.filter((r) =>
                ["approved", "completed", "pending"].includes(r.status)
              );

              for (const reg of toNotify) {
                try {
                  await Notification.createAndPush({
                    user_id: reg.user_id,
                    type: "event_updated_urgent",
                    payload: {
                      event_id: updatedEvent.event_id,
                      event_title: updatedEvent.title,
                      registration_id: reg.registration_id,
                      changed_fields: changedFields,
                      message: `Thông tin sự kiện "${updatedEvent.title}" đã được cập nhật. Vui lòng kiểm tra lại chi tiết trước khi tham gia.`,
                      url: `/events/${updatedEvent.event_id}`,
                    },
                  });
                } catch (notifyErr) {
                  console.error(
                    `Notify volunteer (event_updated_urgent) failed for registration_id=${reg.registration_id}:`,
                    notifyErr
                  );
                }
              }
            }
          }
        }
      } catch (notifyErr) {
        console.error(
          "Event update: notify volunteers (event_updated_urgent) failed:",
          notifyErr
        );
      }

      return res.json({
        success: true,
        message,
        data: { event: updatedEvent },
      });
    } catch (error) {
      console.error("Update event error:", error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  // Xóa sự kiện (soft delete)
  async deleteEvent(req, res) {
    try {
      const { event_id } = req.params;
      const role_name = req.user.role_name;

      // Lấy thông tin sự kiện hiện tại
      const currentEvent = await Event.getEventById(event_id);

      // Sự kiện đã bị xoá rồi
      if (!currentEvent) {
        return res
          .status(404)
          .json({ success: false, message: "Sự kiện không tồn tại" });
      }

      // Nếu không phải Admin -> áp dụng các giới hạn hiện tại
      if (role_name !== "Admin") {
        // Nếu là manager -> không thể xoá sự kiện đang chạy hoặc đã kết thúc
        const now = new Date();
        if (new Date(currentEvent.start_date) <= now) {
          return res.status(400).json({
            success: false,
            message: "Không thể xóa sự kiện đã bắt đầu hoặc đã kết thúc.",
          });
        }
      }

      // 🔹 Lấy danh sách đăng ký trước khi xóa (cả pending / approved / completed)
      let registrations = [];
      try {
        registrations = await Registration.getByEventId(event_id);
      } catch (listErr) {
        console.error(
          "Load registrations before delete failed (still continue delete):",
          listErr
        );
      }

      // Xóa mềm sự kiện (an toàn, có thể khôi phục)
      const deleted = await Event.softDeleteEvent(event_id);

      if (!deleted) {
        return res.status(400).json({
          success: false,
          message: "Xóa sự kiện thất bại",
        });
      }

      // 🔔 Gửi thông báo cho TNV đã đăng ký (kể cả pending chưa được duyệt)
      try {
        if (registrations && registrations.length) {
          const affectedStatuses = [
            "pending",
            "approved",
            "completed",
            "rejected",
          ];
          const toNotify = registrations.filter((r) =>
            affectedStatuses.includes(r.status)
          );

          for (const reg of toNotify) {
            try {
              await Notification.createAndPush({
                user_id: reg.user_id,
                type: "event_cancelled", // đã có trong ENUM Notifications.type
                payload: {
                  event_id,
                  event_title: currentEvent.title,
                  registration_id: reg.registration_id,
                  previous_status: reg.status,
                  message: `Sự kiện "${currentEvent.title}" đã bị hủy bởi ban tổ chức.`,
                  url: `/events/${event_id}`, // FE có thể điều hướng tới trang chi tiết (hoặc history)
                },
              });
            } catch (notifyErr) {
              console.error(
                `Notify volunteer (event_cancelled) failed for registration_id=${reg.registration_id}:`,
                notifyErr
              );
            }
          }
        }
      } catch (outerNotifyErr) {
        console.error(
          "Event delete: notify volunteers failed:",
          outerNotifyErr
        );
        // Không throw nữa để không ảnh hưởng tới kết quả xóa
      }

      res.json({
        success: true,
        message: "Xóa sự kiện thành công",
      });
    } catch (error) {
      console.error("Delete event error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa sự kiện",
      });
    }
  },

  // Admin duyệt sự kiện
  async approveEvent(req, res) {
    try {
      const { event_id } = req.params;
      const admin_id = req.user.user_id;

      // Duyệt sự kiện (stored procedure chỉ cập nhật trạng thái, notification handle ở đây)
      const approved = await Event.approveEvent(event_id, admin_id);

      if (!approved) {
        return res.status(400).json({
          success: false,
          message: "Duyệt sự kiện thất bại",
        });
      }

      // Lấy thông tin sự kiện sau khi duyệt
      const approvedEvent = await Event.getEventById(event_id);

      // 🔔 Gửi thông báo cho Manager: sự kiện đã được duyệt
      try {
        if (approvedEvent && approvedEvent.manager_id) {
          await Notification.createAndPush({
            user_id: approvedEvent.manager_id,
            type: "event_approved",
            payload: {
              event_id: approvedEvent.event_id,
              event_title: approvedEvent.title,
              approved_by: admin_id,
              approval_date: approvedEvent.approval_date,
              message: `Sự kiện "${approvedEvent.title}" đã được duyệt.`,
              url: `/manager/events/${approvedEvent.event_id}`,
            },
          });
        }
      } catch (notifyErr) {
        console.error("Notify manager (event_approved) failed:", notifyErr);
      }

      res.json({
        success: true,
        message: "Duyệt sự kiện thành công",
        data: {
          event: approvedEvent,
        },
      });
    } catch (error) {
      console.error("Approve event error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi duyệt sự kiện",
      });
    }
  },

  // Admin từ chối sự kiện
  async rejectEvent(req, res) {
    try {
      const { event_id } = req.params;
      const admin_id = req.user.user_id;
      const { reason } = req.body;

      if (!reason || reason.length < 5) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng nhập lý do từ chối (tối thiểu 5 ký tự).",
        });
      }

      // Từ chối sự kiện (stored procedure chỉ update, notification handle ở đây)
      const rejected = await Event.rejectEvent(event_id, admin_id, reason);

      if (!rejected) {
        return res.status(400).json({
          success: false,
          message: "Từ chối sự kiện thất bại",
        });
      }

      // Lấy thông tin sự kiện sau khi từ chối
      const rejectedEvent = await Event.getEventById(event_id);

      // 🔔 Gửi thông báo cho Manager: sự kiện đã bị từ chối
      try {
        if (rejectedEvent && rejectedEvent.manager_id) {
          await Notification.createAndPush({
            user_id: rejectedEvent.manager_id,
            type: "event_rejected",
            payload: {
              event_id: rejectedEvent.event_id,
              event_title: rejectedEvent.title,
              rejected_by: admin_id,
              reason,
              message: `Sự kiện "${rejectedEvent.title}" đã bị từ chối. Lý do: ${reason}`,
              url: `/manager/events/${rejectedEvent.event_id}`,
            },
          });
        }
      } catch (notifyErr) {
        console.error("Notify manager (event_rejected) failed:", notifyErr);
      }

      res.json({
        success: true,
        message: "Từ chối sự kiện thành công",
        data: {
          event: rejectedEvent,
        },
      });
    } catch (error) {
      console.error("Reject event error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi từ chối sự kiện",
      });
    }
  },

  //[VOLUNTEER] Lấy lịch sử tham gia sự kiện của bản thân
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
};

export default eventController;
