import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "volunteerhub_secret_key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

const authController = {
  // Đăng ký tài khoản
  async register(req, res) {
    try {
      const {
        email,
        password,
        full_name,
        phone,
        role_name = "Volunteer",
      } = req.body;

      // Kiểm tra input
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

      // Kiểm tra mật khẩu
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu phải có ít nhất 6 ký tự",
        });
      }

      // Tìm role_id từ role_name
      const [roles] = await pool.execute(
        "SELECT role_id FROM Roles WHERE name = ?",
        [role_name]
      );

      if (roles.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Role không hợp lệ",
        });
      }

      const role_id = roles[0].role_id;

      // Kiểm tra email đã tồn tại
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
        "INSERT INTO Users (email, password_hash, full_name, phone, role_id) VALUES (?, ?, ?, ?, ?)",
        [email, password_hash, full_name, phone, role_id]
      );

      // Lấy thông tin user vừa tạo với role name
      const [newUsers] = await pool.execute(
        `SELECT u.user_id, u.email, u.full_name, u.phone, u.avatar_url, r.name as role_name, u.status 
                 FROM Users u 
                 JOIN Roles r ON u.role_id = r.role_id 
                 WHERE u.user_id = ?`,
        [result.insertId]
      );

      const newUser = newUsers[0];

      // Tạo JWT token
      const token = jwt.sign(
        {
          user_id: newUser.user_id,
          email: newUser.email,
          role_name: newUser.role_name,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: {
          user: newUser,
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

      // Tìm user với role name
      const [users] = await pool.execute(
        `SELECT u.user_id, u.email, u.password_hash, u.full_name, u.phone, 
                        u.avatar_url, r.name as role_name, u.status 
                 FROM Users u 
                 JOIN Roles r ON u.role_id = r.role_id 
                 WHERE u.email = ?`,
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
      if (user.status !== "Active") {
        return res.status(403).json({
          success: false,
          message: `Tài khoản đã bị ${
            user.status === "Locked" ? "khóa" : "tạm ngưng"
          }`,
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
          role_name: user.role_name,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      // Loại bỏ password_hash trước khi trả về
      const { password_hash, ...userWithoutPassword } = user;

      res.json({
        success: true,
        message: "Đăng nhập thành công",
        data: {
          user: userWithoutPassword,
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

  // Refresh token
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
      const decoded = jwt.verify(refresh_token, JWT_SECRET);

      // Tạo token mới
      const newToken = jwt.sign(
        {
          user_id: decoded.user_id,
          email: decoded.email,
          role_name: decoded.role_name,
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

  // Đăng xuất
  async logout(req, res) {
    res.json({
      success: true,
      message: "Đăng xuất thành công",
    });
  },

  // Lấy thông tin user hiện tại
  async getMe(req, res) {
    try {
      const user_id = req.user.user_id;

      const [users] = await pool.execute(
        `SELECT u.user_id, u.email, u.full_name, u.phone, 
                        u.avatar_url, r.name as role_name, u.status, u.created_at
                 FROM Users u 
                 JOIN Roles r ON u.role_id = r.role_id 
                 WHERE u.user_id = ?`,
        [user_id]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

      const user = users[0];
      res.json({
        success: true,
        data: {
          user: user,
        },
      });
    } catch (error) {
      console.error("Get me error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin user",
      });
    }
  },
};

export default authController;
