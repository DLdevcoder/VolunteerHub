import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import allRoutes from "./src/routes/index.js";
import { checkDbConnection } from "./src/config/db.js";

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ limit: "20mb", extended: true }));

app.use(express.static(path.join(__dirname, "src", "public")));

app.get("/sw.js", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "public", "sw.js"), {
    headers: {
      "Content-Type": "application/javascript",
    },
  });
});

// Routes
app.use("/api", allRoutes);

// Route cho test page
app.get("/test-push", (req, res) => {
  res.sendFile(path.join(__dirname, "src", "public", "test-push.html"));
});

// Health check route
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    port: PORT,
    environment: process.env.NODE_ENV || "development",
  });
});

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
    ...(process.env.NODE_ENV === "development" && { error: error.message }),
  });
});

app.listen(PORT, async () => {
  console.log(`Server đang chạy trên port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`API URL: http://localhost:${PORT}/api`);
  console.log(`Test Push: http://localhost:${PORT}/test-push`);
  console.log(`Service Worker: http://localhost:${PORT}/sw.js`);
  console.log(`Health Check: http://localhost:${PORT}/api/health`);

  try {
    await checkDbConnection();
  } catch (error) {
    console.error("Database connection failed:", error.message);
  }
});
