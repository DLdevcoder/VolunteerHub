// Map type -> friendly label
export const NOTIF_TYPE_LABELS = {
  // Event related
  event_pending_approval: "Sự kiện chờ duyệt",
  event_approved: "Sự kiện đã được duyệt",
  event_rejected: "Sự kiện bị từ chối",
  event_reminder: "Nhắc nhở sự kiện",
  event_updated_urgent: "Cập nhật quan trọng",
  event_starting_soon: "Sự kiện sắp bắt đầu",
  event_cancelled: "Sự kiện bị hủy",

  // Registration related
  new_registration: "Đăng ký mới",
  registration_approved: "Đăng ký được chấp nhận",
  registration_rejected: "Đăng ký bị từ chối",
  registration_completed: "Hoàn thành sự kiện",

  // Content related
  new_post: "Bài viết mới",
  new_comment: "Bình luận mới",
  reaction_received: "Có tương tác mới",

  // Account related
  account_locked: "Tài khoản bị khóa",
  account_unlocked: "Tài khoản đã mở khóa",
  manager_account_locked: "Tài khoản manager bị khóa",
  manager_account_unlocked: "Tài khoản manager đã mở khóa",
};

export const getNotificationTypeLabel = (type) =>
  NOTIF_TYPE_LABELS[type] || type || "Thông báo";

export const getNotificationMainText = (payload = {}) =>
  payload.message || payload.event_title || payload.title || "";
