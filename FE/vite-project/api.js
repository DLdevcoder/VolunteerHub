import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api", // BE của bạn
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor: tự động gắn Authorization nếu có token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("vh_token"); // hoặc lấy từ Redux store nếu thích

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export { api };
