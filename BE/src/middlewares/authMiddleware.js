import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "volunteerhub_super_secret_key";

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

  // NEW: Xác thực *nếu có* token, còn không thì coi như guest
  authenticateTokenOptional: (req, res, next) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      req.user = null;
      return next();
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        // Token sai / hết hạn → coi như chưa đăng nhập
        req.user = null;
        return next();
      }
      req.user = user;
      next();
    });
  },

  // Kiểm tra role
  requireRole: (allowedRoles) => {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Chưa xác thực",
        });
      }

      if (!allowedRoles.includes(req.user.role_name)) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      next();
    };
  },

  // Kiểm tra admin
  requireAdmin: (req, res, next) => {
    if (!req.user || req.user.role_name !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Yêu cầu quyền Admin",
      });
    }
    next();
  },

  // Kiểm tra manager hoặc admin
  requireManagerOrAdmin: (req, res, next) => {
    if (!req.user || !["Admin", "Manager"].includes(req.user.role_name)) {
      return res.status(403).json({
        success: false,
        message: "Yêu cầu quyền Manager hoặc Admin",
      });
    }
    next();
  },
};

export default authMiddleware;
