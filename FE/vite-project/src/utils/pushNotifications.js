// src/utils/pushNotifications.js
import { api } from "../../api";

// ✅ must match backend router
const PUBLIC_KEY_ENDPOINT = "/webpush/vapid-key";
const SUBSCRIBE_ENDPOINT = "/webpush/subscribe";

// Helper convert base64 VAPID public key sang Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Hàm chính: gọi khi user đã login
export async function initPushNotifications() {
  try {
    // 1. Browser không support
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Trình duyệt không hỗ trợ Web Push");
      return;
    }

    // 2. Xin quyền
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("[Push] User từ chối Notification permission:", permission);
      return;
    }

    // 3. Đăng ký service worker (dùng sw.js trong /public)
    const registration = await navigator.serviceWorker.register("/sw.js");
    console.log("[Push] Service worker registered:", registration.scope);

    // 4. Kiểm tra đã subscribe chưa
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 4.1 Lấy VAPID public key từ BE
      const res = await api.get(PUBLIC_KEY_ENDPOINT);
      const publicKey =
        res.data.publicKey || res.data.vapidPublicKey || res.data.key;

      if (!publicKey) {
        console.error("[Push] Không lấy được VAPID public key từ backend");
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // 4.2 Tạo subscription mới
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      console.log("[Push] New subscription created:", subscription);
    } else {
      console.log("[Push] Existing subscription found:", subscription);
    }

    // 5. Gửi subscription lên BE để lưu
    await api.post(SUBSCRIBE_ENDPOINT, { subscription });
    console.log("[Push] Subscription sent to backend successfully");
  } catch (err) {
    console.error("[Push] initPushNotifications error:", err);
  }
}
