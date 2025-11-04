import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// kiểm tra kết nối
export const checkDbConnection = async () => {
  try {
    await pool.query("SELECT 1");
    console.log("Kết nối Database MySQL thành công!");
  } catch (error) {
    console.error("Không thể kết nối đến Database:", error);
  }
};

export default pool;
