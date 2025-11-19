import { fetchAllEvents } from "../models/Event.js";

// Controller lấy tất cả sự kiện
export const getAllEvents = async (req, res) => {
  try {
    const events = await fetchAllEvents(); 

    res.status(200).json({
      success: true,
      message: "Lấy danh sách sự kiện thành công!",
      data: events,
    });
  } catch (error) {
    console.error("Lỗi khi lấy Events:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
    });
  }
};
