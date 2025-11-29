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
  getActiveEvents(params) {
    // { page, limit, search, category_id, start_date_from, start_date_to }
    return api.get("/events/active", { params });
  },

  getCategories() {
    return api.get("/events/categories");
  },

  getEventById(eventId) {
    return api.get(`/events/${eventId}`);
  },

  // ==== MANAGER ====

  // Tạo sự kiện (Manager)
  createEvent(payload) {
    // payload: { title, description, target_participants, start_date, end_date, location, category_id }
    return api.post("/events", payload);
  },

  // Lấy danh sách sự kiện của Manager đang đăng nhập
  getMyEvents(params) {
    // { page, limit, approval_status, category_id, search, sort_by, sort_order }
    return api.get("/events/my/events", { params });
  },

  // Cập nhật sự kiện (Manager – chủ sở hữu)
  updateEvent(eventId, payload) {
    return api.put(`/events/${eventId}`, payload);
  },

  // Xóa mềm sự kiện (Manager hoặc Admin – có check quyền ở BE)
  deleteEvent(eventId) {
    return api.delete(`/events/${eventId}`);
  },

  // ==== ADMIN ====

  // Lấy tất cả sự kiện (pending, rejected, deleted, v.v.)
  getAllEventsAdmin(params) {
    // { page, limit, approval_status, category_id, manager_id, search, ... }
    return api.get("/events/admin/all", { params });
  },

  // Duyệt sự kiện
  approveEvent(eventId) {
    return api.patch(`/events/${eventId}/approve`);
  },

  // Từ chối sự kiện
  rejectEvent(eventId, reason) {
    return api.patch(`/events/${eventId}/reject`, { reason });
  },
};

export default eventApi;
