import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// Đã import UserService, nên bên dưới phải dùng UserService
import UserService from "../services/UserService.js";

const JWT_SECRET = process.env.JWT_SECRET || "volunteerhub_super_secret_key";
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
      if (!email || !password || !full_name || !phone) {
        return res.status(400).json({
          success: false,
          message:
            "Vui lòng điền đầy đủ thông tin: email, password, full_name, phone",
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

      // [SỬA] User.getRoleId -> UserService.getRoleId
      const role_id = await UserService.getRoleId(role_name);
      if (!role_id) {
        return res.status(400).json({
          success: false,
          message: "Role không hợp lệ",
        });
      }

      // [SỬA] User.emailExists -> UserService.emailExists
      const emailExists = await UserService.emailExists(email);
      if (emailExists) {
        return res.status(409).json({
          success: false,
          message: "Email đã được sử dụng",
        });
      }

      // Mã hóa mật khẩu
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(password, saltRounds);

      // [SỬA] User.create -> UserService.create
      const newUserId = await UserService.create({
        email,
        password_hash,
        full_name,
        phone,
        role_id,
      });

      // [SỬA] User.findById -> UserService.findById
      const newUser = await UserService.findById(newUserId);

      // Tạo JWT token
      const token = jwt.sign(
        {
          user_id: newUser.user_id,
          email: newUser.email,
          role_name: newUser.role_name,
          status: newUser.status,
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

      // [ĐÚNG] Chỗ này bạn đã viết đúng UserService
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: "Email hoặc mật khẩu không đúng",
        });
      }

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
          status: user.status,
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

  // Refresh token (Giữ nguyên, không dùng Database)
  async refreshToken(req, res) {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        return res.status(400).json({
          success: false,
          message: "Refresh token là bắt buộc",
        });
      }

      const decoded = jwt.verify(refresh_token, JWT_SECRET);

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

  // Đăng xuất (Giữ nguyên)
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

      // [SỬA] User.findById -> UserService.findById
      const user = await UserService.findById(user_id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User không tồn tại",
        });
      }

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

  // User: Đổi mật khẩu
  async changePassword(req, res) {
    try {
      const user_id = req.user.user_id;
      const { current_password, new_password, confirm_password } = req.body;

      if (!current_password || !new_password || !confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng điền đầy đủ thông tin",
        });
      }

      if (new_password !== confirm_password) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới và xác nhận mật khẩu không khớp",
        });
      }

      if (new_password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới phải có ít nhất 6 ký tự",
        });
      }

      if (current_password === new_password) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới không được giống mật khẩu cũ",
        });
      }

      // [SỬA] User.changePassword -> UserService.changePassword
      const isChanged = await UserService.changePassword(
        user_id,
        current_password,
        new_password
      );

      if (!isChanged) {
        return res.status(400).json({
          success: false,
          message: "Không thể đổi mật khẩu",
        });
      }

      res.json({
        success: true,
        message: "Đổi mật khẩu thành công",
      });
    } catch (error) {
      console.error("Change password error:", error);

      if (error.message === "Mật khẩu hiện tại không đúng") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: "Lỗi server khi đổi mật khẩu",
      });
    }
  },
};

export default authController;
