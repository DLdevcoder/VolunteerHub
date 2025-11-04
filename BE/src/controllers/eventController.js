import db from "../config/db.js";

export const getAllEvents = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM Events");

    res.status(200).json({
      success: true,
      message: "Lấy danh sách sự kiện thành công!",
      data: rows,
    });
  } catch (error) {
    console.error("Lỗi khi truy vấn Events:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ",
    });
  }
};
