import db from "../config/db.js";

// Lấy tất cả sự kiện
export const fetchAllEvents = async () => {
  const [rows] = await db.query("SELECT * FROM Events");
  return rows;
};
