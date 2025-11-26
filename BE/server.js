import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import allRoutes from "./src/routes/index.js";
import { checkDbConnection } from "./src/config/db.js"; // Import function kiểm tra kết nối

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));


// Routes
app.use("/api", allRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: "Route không tồn tại",
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    message: "Lỗi server nội bộ",
  });
});

// Start server với kiểm tra kết nối database
app.listen(PORT, async () => {
  console.log(`🚀 Server đang chạy trên port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔗 URL: http://localhost:${PORT}/api`);

  // Kiểm tra kết nối database khi server khởi động
  await checkDbConnection();
});
