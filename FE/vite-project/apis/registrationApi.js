// src/apis/registrationApi.js
import { api } from "../api";

/**
 * Mapping với registrationRoutes:
 *
 * POST   /registrations/events/:event_id          -> registerForEvent
 * DELETE /registrations/events/:event_id          -> cancelRegistration
 * GET    /registrations/events/:event_id          -> getEventRegistrations
 * PATCH  /registrations/:registration_id/approve  -> approveRegistration
 * PATCH  /registrations/:registration_id/reject   -> rejectRegistration
 * PATCH  /registrations/:registration_id/complete -> completeRegistration
 */

const registrationApi = {
  // ====== VOLUNTEER ======

  // Đăng ký tham gia sự kiện
  registerForEvent(eventId) {
    return api.post(`/registrations/events/${eventId}`);
  },

  // Hủy đăng ký khỏi sự kiện
  cancelRegistration(eventId) {
    return api.delete(`/registrations/events/${eventId}`);
  },

  // ====== MANAGER ======

  // Lấy danh sách đăng ký của một event (Manager – chủ sự kiện)
  getEventRegistrations(eventId) {
    return api.get(`/registrations/events/${eventId}`);
  },

  // Duyệt một đơn đăng ký
  approveRegistration(registrationId) {
    return api.patch(`/registrations/${registrationId}/approve`);
  },

  // Từ chối một đơn đăng ký, cần gửi reason
  rejectRegistration(registrationId, reason) {
    return api.patch(`/registrations/${registrationId}/reject`, { reason });
  },

  // Đánh dấu hoàn thành tham gia sự kiện
  completeRegistration(registrationId) {
    return api.patch(`/registrations/${registrationId}/complete`);
  },
};

export default registrationApi;
