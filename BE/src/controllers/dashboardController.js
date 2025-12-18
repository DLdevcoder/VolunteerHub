import DashboardService from "../services/dashboardService.js";

const dashboardController = {
  // ==================== MAIN DASHBOARD ENDPOINT ====================
  // API chung để lấy dashboard dựa trên Role của user
  async getDashboard(req, res) {
    try {
      const user_id = req.user.user_id;
      const user_role = req.user.role_name;

      let dashboardData;

      switch (user_role) {
        case "Volunteer":
          dashboardData = await DashboardService.getVolunteerDashboard(user_id);
          break;
        case "Manager":
          dashboardData = await DashboardService.getManagerDashboard(user_id);
          break;
        case "Admin":
          dashboardData = await DashboardService.getAdminDashboard();
          break;
        default:
          return res.status(403).json({
            success: false,
            message: "Role không được hỗ trợ",
          });
      }

      res.json({
        success: true,
        data: {
          ...dashboardData,
          user_role: user_role,
        },
      });
    } catch (error) {
      console.error("Get dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy dashboard",
      });
    }
  },

  // ==================== DETAILED ANALYTICS (ADMIN/MANAGER) ====================

  // Dashboard tổng quan (Stats cards)
  async getOverview(req, res) {
    try {
      const overviewStats = await DashboardService.getOverviewStats();

      res.json({
        success: true,
        data: overviewStats,
      });
    } catch (error) {
      console.error("Get overview error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê tổng quan",
      });
    }
  },

  // Thống kê events theo thời gian (Line chart)
  async getEventTimeSeries(req, res) {
    try {
      const { time_range = "7d" } = req.query;
      const validRanges = ["7d", "30d", "12m"];

      if (!validRanges.includes(time_range)) {
        return res.status(400).json({
          success: false,
          message: "Time range không hợp lệ. Chọn: 7d, 30d, 12m",
        });
      }

      const timeSeries = await DashboardService.getEventTimeSeries(time_range);

      res.json({
        success: true,
        data: {
          time_range,
          events: timeSeries,
        },
      });
    } catch (error) {
      console.error("Get event time series error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê events",
      });
    }
  },

  // Top events có engagement cao (Table/List)
  async getTopEngagedEvents(req, res) {
    try {
      const { limit = 10 } = req.query;

      const topEvents = await DashboardService.getTopEngagedEvents(
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          events: topEvents,
        },
      });
    } catch (error) {
      console.error("Get top engaged events error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy top events",
      });
    }
  },

  // Thống kê events theo category (Pie/Donut chart)
  async getEventCategoryStats(req, res) {
    try {
      const categoryStats = await DashboardService.getEventCategoryStats();

      res.json({
        success: true,
        data: {
          categories: categoryStats,
        },
      });
    } catch (error) {
      console.error("Get event category stats error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thống kê danh mục",
      });
    }
  },

  // Top users tích cực
  async getTopActiveUsers(req, res) {
    try {
      const { limit = 10 } = req.query;

      const activeUsers = await DashboardService.getTopActiveUsers(
        parseInt(limit)
      );

      res.json({
        success: true,
        data: {
          users: activeUsers,
        },
      });
    } catch (error) {
      console.error("Get top active users error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy top users",
      });
    }
  },

  // Xu hướng đăng ký (Bar/Line chart)
  async getRegistrationTrends(req, res) {
    try {
      const { time_range = "7d" } = req.query;
      const validRanges = ["7d", "30d"];

      if (!validRanges.includes(time_range)) {
        return res.status(400).json({
          success: false,
          message: "Time range không hợp lệ. Chọn: 7d, 30d",
        });
      }

      const trends = await DashboardService.getRegistrationTrends(time_range);

      res.json({
        success: true,
        data: {
          time_range,
          trends: trends,
        },
      });
    } catch (error) {
      console.error("Get registration trends error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy xu hướng đăng ký",
      });
    }
  },

  // System health (Server status)
  async getSystemHealth(req, res) {
    try {
      const systemHealth = await DashboardService.getSystemHealth();

      res.json({
        success: true,
        data: systemHealth,
      });
    } catch (error) {
      console.error("Get system health error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy thông tin hệ thống",
      });
    }
  },

  // Dashboard tổng hợp (all in one - Dành cho Admin View cũ nếu cần)
  async getFullDashboard(req, res) {
    try {
      const {
        time_range = "7d",
        events_limit = 10,
        users_limit = 10,
      } = req.query;

      const [
        overviewStats,
        eventTimeSeries,
        topEvents,
        categoryStats,
        topUsers,
        registrationTrends,
        systemHealth,
      ] = await Promise.all([
        DashboardService.getOverviewStats(),
        DashboardService.getEventTimeSeries(time_range),
        DashboardService.getTopEngagedEvents(parseInt(events_limit)),
        DashboardService.getEventCategoryStats(),
        DashboardService.getTopActiveUsers(parseInt(users_limit)),
        DashboardService.getRegistrationTrends(time_range),
        DashboardService.getSystemHealth(),
      ]);

      res.json({
        success: true,
        data: {
          overview: overviewStats,
          event_time_series: eventTimeSeries,
          top_engaged_events: topEvents,
          category_stats: categoryStats,
          top_active_users: topUsers,
          registration_trends: registrationTrends,
          system_health: systemHealth,
          last_updated: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Get full dashboard error:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy dashboard tổng hợp",
      });
    }
  },
};

export default dashboardController;