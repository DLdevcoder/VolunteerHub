import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // URL Backend của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================================
// 1. REQUEST INTERCEPTOR: Tự động gắn Token khi gửi đi
// =====================================================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vh_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================================
// 2. RESPONSE INTERCEPTOR: Xử lý phản hồi (QUAN TRỌNG ĐỂ CHẶN USER)
// =====================================================================
api.interceptors.response.use(
  (response) => {
    // Nếu API trả về thành công (status 2xx), trả về data bình thường
    return response;
  },
  (error) => {
    const { response } = error;

    if (response) {
      // -------------------------------------------------------------
      // TRƯỜNG HỢP 1: Tài khoản bị KHÓA hoặc TẠM NGƯNG (403 Forbidden)
      // (Dựa trên phản hồi từ middleware `checkAccountActive` ở Backend)
      // -------------------------------------------------------------
      if (response.status === 403 && response.data) {
        const { accountStatus, message } = response.data;

        // Chỉ xử lý nếu backend báo rõ là do trạng thái tài khoản
        if (accountStatus === "Locked" || accountStatus === "Suspended") {
          // 1. Thông báo cho người dùng
          alert(
            message ||
              "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên."
          );

          // 2. Xóa sạch dữ liệu đăng nhập
          localStorage.removeItem("vh_token");
          localStorage.removeItem("vh_user");

          // 3. Đá về trang Login
          window.location.href = "/login";

          return Promise.reject(error);
        }
      }

      // -------------------------------------------------------------
      // TRƯỜNG HỢP 2: Token hết hạn hoặc không hợp lệ (401 Unauthorized)
      // -------------------------------------------------------------
      if (response.status === 401) {
        // Tránh vòng lặp vô hạn nếu đang ở trang login
        if (window.location.pathname !== "/login") {
          localStorage.removeItem("vh_token");
          localStorage.removeItem("vh_user");
          window.location.href = "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export { api };
