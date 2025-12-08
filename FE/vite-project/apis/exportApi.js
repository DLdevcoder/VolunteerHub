// src/apis/exportApi.js
import { api } from "../api"; // Hoặc import api from "./api" tùy file gốc của bạn

const exportApi = {
  // Xuất danh sách Users
  exportUsers: async (format = "csv", filters = {}) => {
    return api.get("/export/users", {
      params: { format, ...filters },
      responseType: "blob", // <--- QUAN TRỌNG: Để tải file
    });
  },

  // Xuất danh sách Events
  exportEvents: async (format = "csv", filters = {}) => {
    return api.get("/export/events", {
      params: { format, ...filters },
      responseType: "blob",
    });
  },

  // Xuất danh sách Đăng ký
  exportRegistrations: async (format = "csv", filters = {}) => {
    return api.get("/export/registrations", {
      params: { format, ...filters },
      responseType: "blob",
    });
  },

  // Xuất báo cáo tổng hợp
  exportSummary: async (format = "csv") => {
    return api.get("/export/summary", {
      params: { format },
      responseType: "blob",
    });
  },
};

export default exportApi;
