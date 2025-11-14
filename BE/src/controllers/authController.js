import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js"; // Đường dẫn đến file db.js của bạn

const JWT_SECRET = process.env.JWT_SECRET || "volunteerhub_secret_key_2024";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "volunteerhub_refresh_secret_2024";

const authController = {
  // Đăng ký tài khoản
  async register(req, res) {
    try {
      const { email, password, full_name, role = "user" } = req.body;

      // Kiểm tra input cơ bản
      if (!email || !password || !full_name) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin: email, password, full_name",
        });
      }

      // Kiểm tra email hợp lệ
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: "Email không hợp lệ",
        });
      }

      // Kiểm tra mật khẩu (ít nhất 6 ký tự)
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu phải có ít nhất 6 ký tự",
        });
      }

      // Kiểm tra email đã tồn tại chưa
      const [existingUsers] = await pool.execute(
        "SELECT user_id FROM Users WHERE email = ?",
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }

      // Mã hóa mật khẩu
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // Tạo user mới
      const [result] = await pool.execute(
        "INSERT INTO Users (email, password_hash, full_name, role) VALUES (?, ?, ?, ?)",
        [email, password_hash, full_name, role]
      );

      // Tạo JWT token
      const token = jwt.sign(
        {
          user_id: result.insertId,
          email: email,
          role: role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
          user_id: result.insertId,
          email: email,
          full_name: full_name,
          role: role,
          token: token,
        },
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng ký",
      });
    }
  },

  // Đăng nhập
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Kiểm tra input
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp email và password",
        });
      }

      // Tìm user theo email
      const [users] = await pool.execute(
        `SELECT user_id, email, password_hash, full_name, role, account_status 
                 FROM Users WHERE email = ?`,
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

      const user = users[0];

      // Kiểm tra tài khoản có bị khóa không
      if (user.account_status === "locked") {
        return res.status(403).json({
          success: false,
          message: "Tài khoản đã bị khóa",
        });
      }

      // Kiểm tra mật khẩu
      const isPasswordValid = await bcrypt.compare(
        password,
        user.password_hash
      );
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

      // Tạo JWT token
      const token = jwt.sign(
        {
          user_id: user.user_id,
          email: user.email,
          role: user.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          user_id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role,
          token: token,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi đăng nhập",
      });
    }
  },

  // Refresh token (tùy chọn)
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: "Refresh token là bắt buộc",
        });
      }

      // Xác thực refresh token
      const decoded = jwt.verify(refresh_token, REFRESH_TOKEN_SECRET);

      // Tạo token mới
      const newToken = jwt.sign(
        {
          user_id: decoded.user_id,
          email: decoded.email,
          role: decoded.role,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.json({
        success: true,
        message: "Refresh token thành công",
        data: {
          token: newToken,
        },
      });
    } catch (error) {
      console.error("Refresh token error:", error);
      res.status(401).json({
        success: false,
        message: "Refresh token không hợp lệ",
      });
    }
  },

  // Đăng xuất (tùy chọn - trên client sẽ xóa token)
  async logout(req, res) {
    res.json({
      success: true,
      message: "Đăng xuất thành công",
    });
  },
};

export default authController;
