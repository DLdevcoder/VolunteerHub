import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "mysql", // Đây là nơi định nghĩa loại CSDL
    logging: false, // Tắt log câu lệnh SQL dài dòng (tùy chọn)
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    define: {
      timestamps: false, // Tắt mặc định createdAt/updatedAt nếu bảng tự quản lý
    },
  }
);

export const checkDbConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Kết nối Database thành công (qua ORM)!");
  } catch (error) {
    console.error("Không thể kết nối đến Database:", error);
  }
};

export default sequelize;
