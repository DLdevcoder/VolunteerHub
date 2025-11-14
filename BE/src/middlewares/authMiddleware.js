import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "volunteerhub_secret_key_2024";

const authMiddleware = {
  // Xác thực token cơ bản
  authenticateToken: (req, res, next) => {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token là bắt buộc",
      });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Token không hợp lệ",
        });
      }
      req.user = user;
      next();
    });
  },

  // Kiểm tra role
  requireRole: (role) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa xác thực",
        });
      }

      if (req.user.role !== role) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      next();
    };
  },
};

export default authMiddleware;
