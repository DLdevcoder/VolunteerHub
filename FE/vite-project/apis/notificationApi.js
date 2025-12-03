// src/apis/notificationApi.js
import { api } from "../api";

/**
 * Mapping với notificationRoutes:
 *
 * (Tất cả đều đã đi qua authenticateToken ở BE)
 *
 * ==== USER ====
 *  GET    /notifications/my-notifications
 *  GET    /notifications/unread-count
 *  GET    /notifications/recent
 *  PUT    /notifications/mark-all-read
 *  PUT    /notifications/:notification_id/read
 *  DELETE /notifications/:notification_id
 *  POST   /notifications/test-push
 *
 * ==== SYSTEM / ADMIN / MANAGER ====
 *  POST   /notifications/event-approval
 *  POST   /notifications/new-registration
 *  POST   /notifications/registration-status
 *  POST   /notifications/event-reminder
 *  POST   /notifications/event-starting-soon
 *  POST   /notifications/event-cancelled
 *  POST   /notifications/event-updated-urgent
 *  POST   /notifications/new-content
 *  POST   /notifications/new-reaction
 *  POST   /notifications/account-locked
 *  POST   /notifications/manager-locked
 *  POST   /notifications/           (createNotification)
 *  POST   /notifications/bulk
 *  POST   /notifications/account-unlocked
 *  POST   /notifications/manager-unlocked
 */

const notificationApi = {
  // ================== USER SIDE ==================

  /**
   * Lấy danh sách thông báo của user hiện tại
   * params gợi ý: { page, limit, is_read, type }
   */
  async getMyNotifications(params) {
    const response = await api.get("/notifications/my-notifications", {
      params,
    });
    return response.data; // { success, message, data: { notifications, unread_count, pagination } }
  },

  /** Lấy số lượng thông báo chưa đọc (dùng cho Badge ở header) */
  async getUnreadCount() {
    const response = await api.get("/notifications/unread-count");
    return response.data; // { success, data: { unread_count } }
  },

  /** Lấy thông báo gần đây (dùng cho dropdown ở header) */
  async getRecent(limit = 10) {
    const response = await api.get("/notifications/recent", {
      params: { limit },
    });
    return response.data; // { success, data: { notifications } }
  },

  /** Đánh dấu 1 thông báo là đã đọc */
  async markAsRead(notificationId) {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /** Đánh dấu tất cả thông báo là đã đọc */
  async markAllAsRead() {
    const response = await api.put("/notifications/mark-all-read");
    return response.data;
  },

  /** Xoá 1 thông báo */
  async deleteNotification(notificationId) {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /** Gửi test push notification cho user hiện tại (để debug Web Push) */
  async testPush() {
    const response = await api.post("/notifications/test-push");
    return response.data;
  },

  // =============== SYSTEM / ADMIN / MANAGER ===============

  /** Admin duyệt / từ chối event + tạo thông báo (wrapper tiện dùng nếu cần) */
  async notifyEventApproval(payload) {
    // payload: { event_id, is_approved, rejection_reason? }
    const response = await api.post("/notifications/event-approval", payload);
    return response.data;
  },

  /** Thông báo cho Manager khi có đăng ký mới */
  async notifyNewRegistration(payload) {
    // payload: { event_id, user_id }
    const response = await api.post("/notifications/new-registration", payload);
    return response.data;
  },

  /** Thông báo trạng thái đăng ký cho Volunteer – thường BE tự gọi */
  async notifyRegistrationStatus(payload) {
    // payload: { registration_id, status, rejection_reason? }
    const response = await api.post(
      "/notifications/registration-status",
      payload
    );
    return response.data;
  },

  /** Nhắc nhở sự kiện (gần tới ngày) – Manager */
  async notifyEventReminder(payload) {
    // payload: { event_id }
    const response = await api.post("/notifications/event-reminder", payload);
    return response.data;
  },

  /** Sự kiện sắp diễn ra (1h trước) – Manager */
  async notifyEventStartingSoon(payload) {
    // payload: { event_id }
    const response = await api.post(
      "/notifications/event-starting-soon",
      payload
    );
    return response.data;
  },

  /** Sự kiện bị huỷ – Admin */
  async notifyEventCancelled(payload) {
    // payload: { event_id, reason }
    const response = await api.post("/notifications/event-cancelled", payload);
    return response.data;
  },

  /** Sự kiện cập nhật khẩn – Manager */
  async notifyEventUpdatedUrgent(payload) {
    // payload: { event_id, changes }
    const response = await api.post(
      "/notifications/event-updated-urgent",
      payload
    );
    return response.data;
  },

  /** Nội dung mới (post/comment) trong event – gửi cho participants đã approved */
  async notifyNewContent(payload) {
    // payload: { event_id, content_type: "post"|"comment", content_id, content_preview? }
    const response = await api.post("/notifications/new-content", payload);
    return response.data;
  },

  /** Thông báo có reaction mới (like post/comment) */
  async notifyNewReaction(payload) {
    // payload: { content_type, content_id, reactor_id, content_owner_id }
    const response = await api.post("/notifications/new-reaction", payload);
    return response.data;
  },

  /** Tài khoản bị khoá – Admin */
  async notifyAccountLocked(payload) {
    // payload: { user_id, reason }
    const response = await api.post("/notifications/account-locked", payload);
    return response.data;
  },

  /** Manager bị khoá – Admin */
  async notifyManagerLocked(payload) {
    // payload: { manager_id, reason }
    const response = await api.post("/notifications/manager-locked", payload);
    return response.data;
  },

  /** Tạo 1 notification tùy ý cho 1 user (Admin) */
  async createNotification(payload) {
    // payload: { user_id, type, payload }
    const response = await api.post("/notifications", payload);
    return response.data;
  },

  /** Tạo thông báo hàng loạt cho nhiều user (Admin) */
  async bulkCreateNotifications(payload) {
    // payload: { user_ids: number[], type, payload }
    const response = await api.post("/notifications/bulk", payload);
    return response.data;
  },

  /** Thông báo mở khoá tài khoản user (Admin) */
  async notifyAccountUnlocked(payload) {
    // payload: { user_id }
    const response = await api.post("/notifications/account-unlocked", payload);
    return response.data;
  },

  /** Thông báo mở khoá manager (Admin) */
  async notifyManagerUnlocked(payload) {
    // payload: { manager_id }
    const response = await api.post("/notifications/manager-unlocked", payload);
    return response.data;
  },
};

export default notificationApi;
