// src/controllers/registrationController.js
import Registration from "../models/Registration.js";
import Event from "../models/Event.js";
import User from "../models/User.js"

const registrationController = {

// Đăng ký sự kiện
  async registerEvent(req, res) {
    try {
      const { event_id } = req.params;
      const user_id = req.user.user_id;

      // Tài khoản bị khoá hoặc ngưng hoạt động
      const currentUser = await User.findById(user_id);
      if (!currentUser || currentUser.status !== 'Active') {
          return res.status(403).json({ 
              success: false, 
              message: "Tài khoản của bạn đang bị khóa hoặc tạm ngưng hoạt động." 
          });
      }

      // Kiểm tra sự kiện
      const event = await Event.getEventById(event_id);
      
      if (!event) {
        return res.status(404).json({ success: false, message: "Sự kiện không tồn tại" });
      }

      if (event.approval_status !== 'approved') {
        return res.status(400).json({ success: false, message: "Sự kiện chưa được duyệt hoặc đã bị hủy" });
      }

      const now = new Date();
      // Chặn đăng ký nếu sự kiện đã bắt đầu
      if (new Date(event.start_date) <= now) {
        return res.status(400).json({ 
            success: false, 
            message: "Sự kiện đã bắt đầu hoặc kết thúc, không thể đăng ký thêm." 
        });
      }

      // Đủ số lượng người tham gia
      if (event.target_participants > 0 && event.current_participants >= event.target_participants) {
         return res.status(409).json({ 
             success: false, 
             message: "Rất tiếc, sự kiện đã đủ số lượng người tham gia." 
         });
      }

      const existingReg = await Registration.findOne(user_id, event_id);
      
      if (existingReg) {
        // Đang tham gia
        if (['pending', 'approved', 'completed'].includes(existingReg.status)) {
            return res.status(409).json({ success: false, message: "Bạn đã đăng ký sự kiện này rồi" });
        }
        
        // Bị Manager từ chối
        if (existingReg.status === 'rejected') {
            return res.status(403).json({
                success: false,
                message: "Đăng ký của bạn đã bị Quản lý từ chối trước đó. Không thể đăng ký lại."
            });
        }

        // Đăng ký lại
        if (existingReg.status === 'cancelled') {
            await Registration.reRegister(user_id, event_id);
            return res.status(200).json({
                success: true,
                message: "Đăng ký lại thành công! Vui lòng chờ duyệt."
            });
        }
      }

      // Đăng ký mới
      await Registration.create(user_id, event_id);

      res.status(201).json({
        success: true,
        message: "Đăng ký tham gia thành công! Vui lòng chờ Quản lý sự kiện duyệt."
      });

    } catch (error) {
      console.error("Register event error:", error);
      res.status(500).json({ success: false, message: "Lỗi server khi đăng ký" });
    }
  },

    // Huỷ đăng ký
    async cancelRegistration(req, res) {
        try {
            const { event_id } = req.params;
            const user_id = req.user.user_id;

            // Kiểm tra trạng thái đăng ký
            const existingReg = await Registration.findOne(user_id, event_id);

            if (!existingReg) {
                return res.status(400).json({ success: false, message: "Bạn chưa đăng ký sự kiện này." });
            }

            // Đã hoàn thành thì không được hủy
            if (existingReg.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: "Sự kiện đã hoàn thành, không thể hủy đăng ký."
                });
            }

            // Nếu đã hủy hoặc bị từ chối trước đó
            if (['cancelled', 'rejected'].includes(existingReg.status)) {
                return res.status(400).json({
                    success: false,
                    message: "Đăng ký này đã bị hủy hoặc từ chối trước đó."
                });
            }

            const event = await Event.getEventById(event_id);

            // Sự kiện bị xóa mềm
            if (!event) {
                return res.status(404).json({
                    success: false,
                    message: "Sự kiện không tồn tại hoặc đã bị hủy bỏ bởi ban tổ chức."
                });
            }

            const now = new Date();
            const eventStart = new Date(event.start_date);
            const oneDay = 24 * 60 * 60 * 1000; // 24 giờ tính bằng ms

            // Sự kiện đã bắt đầu hoặc kết thúc -> Không cho hủy
            if (eventStart <= now) {
                return res.status(400).json({
                    success: false,
                    message: "Sự kiện đang diễn ra hoặc đã kết thúc, không thể hủy đăng ký."
                });
            }

            // Quy định hủy trước 24h
            if (eventStart.getTime() - now.getTime() < oneDay) {
                return res.status(400).json({
                    success: false,
                    message: "Không thể hủy đăng ký sát giờ (cần hủy trước ít nhất 24h)."
                });
            }

            // Thực hiện huỷ
            const cancelled = await Registration.cancel(user_id, event_id);
            if (cancelled) {
                res.json({ success: true, message: "Hủy đăng ký thành công" });
            } else {
                res.status(400).json({ success: false, message: "Hủy thất bại" });
            }
        } catch (error) {
            console.error("Cancel registration error:", error);
            res.status(500).json({ success: false, message: "Lỗi server khi hủy đăng ký" });
        }
    },
};

export default registrationController;