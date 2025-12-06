// Import từ file cấu hình gốc ở thư mục cha (src/api.js)
import { api } from "../api";

const dashboardApi = {
  // Lấy dashboard chính
  getDashboard: async () => {
    const response = await api.get("/dashboard");
    return response.data;
  },

  // Lấy tổng quan Admin
  getOverview: async () => {
    const response = await api.get("/dashboard/admin/overview");
    return response.data;
  },

  // Lấy sức khỏe hệ thống
  getSystemHealth: async () => {
    const response = await api.get("/dashboard/admin/system-health");
    return response.data;
  },
};

export default dashboardApi;
