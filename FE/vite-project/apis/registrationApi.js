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
  async registerForEvent(eventId) {
    const response = await api.post(`/registrations/events/${eventId}`);
    // { success, message, data? }
    return response.data;
  },

  // Hủy đăng ký khỏi sự kiện
  async cancelRegistration(eventId) {
    const response = await api.delete(`/registrations/events/${eventId}`);
    return response.data;
  },

  // ====== MANAGER ======

  // Lấy danh sách đăng ký của một event (Manager – chủ sự kiện)
  async getEventRegistrations(eventId) {
    const response = await api.get(`/registrations/events/${eventId}`);
    return response.data; // { success, message, data: [...] }
  },

  // Duyệt một đơn đăng ký
  async approveRegistration(registrationId) {
    const response = await api.patch(
      `/registrations/${registrationId}/approve`
    );
    return response.data;
  },

  // Từ chối một đơn đăng ký, cần gửi reason
  async rejectRegistration(registrationId, reason) {
    const response = await api.patch(
      `/registrations/${registrationId}/reject`,
      {
        reason,
      }
    );
    return response.data;
  },

  // Đánh dấu hoàn thành tham gia sự kiện
  async completeRegistration(registrationId) {
    const response = await api.patch(
      `/registrations/${registrationId}/complete`
    );
    return response.data;
  },
};

export default registrationApi;
