// src/apis/eventApi.js
import { api } from "../api";

/**
 * Tất cả endpoint tương ứng với eventRoutes:
 * - GET  /events/active
 * - GET  /events/categories
 * - GET  /events/:event_id
 * - POST /events
 * - GET  /events/my/events
 * - PUT  /events/:event_id
 * - DELETE /events/:event_id
 * - GET  /events/admin/all
 * - PATCH /events/:event_id/approve
 * - PATCH /events/:event_id/reject
 */

const eventApi = {
  // ==== PUBLIC / VOLUNTEER ====

  // { page, limit, search, category_id, start_date_from, start_date_to }
  async getActiveEvents(params) {
    const response = await api.get("/events/active", { params });
    return response.data; // { success, data: { events, pagination }, message? }
  },

  async getCategories() {
    const response = await api.get("/events/categories");
    return response.data;
  },

  async getEventById(eventId) {
    const response = await api.get(`/events/${eventId}`);
    return response.data;
  },

  // Volunteer – lịch sử tham gia sự kiện của chính mình
  async getMyEventHistory() {
    const res = await api.get("/events/my/history");
    return res.data; // { success, message, data: [...] }
  },

  // ==== MANAGER ====

  // Tạo sự kiện (Manager)
  async createEvent(payload) {
    // payload: { title, description, target_participants, start_date, end_date, location, category_id }
    const response = await api.post("/events", payload);
    return response.data;
  },

  // Lấy danh sách sự kiện của Manager đang đăng nhập
  async getMyEvents(params) {
    // { page, limit, approval_status, category_id, search, sort_by, sort_order }
    const response = await api.get("/events/my/events", { params });
    return response.data;
  },

  // Cập nhật sự kiện (Manager – chủ sở hữu)
  async updateEvent(eventId, payload) {
    const response = await api.put(`/events/${eventId}`, payload);
    return response.data;
  },

  // Xóa mềm sự kiện (Manager hoặc Admin – có check quyền ở BE)
  async deleteEvent(eventId) {
    const response = await api.delete(`/events/${eventId}`);
    return response.data;
  },

  // ==== ADMIN ====

  // Lấy tất cả sự kiện (pending, rejected, deleted, v.v.)
  async getAllEventsAdmin(params) {
    // { page, limit, approval_status, category_id, manager_id, search, ... }
    const response = await api.get("/events/admin/all", { params });
    return response.data;
  },

  // Duyệt sự kiện
  async approveEvent(eventId) {
    const response = await api.patch(`/events/${eventId}/approve`);
    return response.data;
  },

  // Từ chối sự kiện
  async rejectEvent(eventId, reason) {
    const response = await api.patch(`/events/${eventId}/reject`, { reason });
    return response.data;
  },
};

export default eventApi;
