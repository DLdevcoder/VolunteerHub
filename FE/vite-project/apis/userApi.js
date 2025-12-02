// src/apis/userApi.js
import { api } from "../api";

const userApi = {
  // GET /users/me
  getMe: async () => {
    const res = await api.get("/users/me");
    return res.data; // { success, data: { user } }
  },

  // PUT /users/me
  updateMe: async (payload) => {
    const res = await api.put("/users/me", payload);
    return res.data; // { success, message, data: { user } }
  },

  // Admin: GET /users
  getAllUsers: async (params) => {
    const res = await api.get("/users", { params });
    return res.data; // { success, data: { users, pagination } }
  },

  // Admin: GET /users/:user_id
  getUserById: async (userId) => {
    const res = await api.get(`/users/${userId}`);
    return res.data; // { success, data: { user } }
  },

  // Admin: PUT /users/:user_id/status
  updateUserStatus: async (userId, status) => {
    const res = await api.put(`/users/${userId}/status`, { status });
    return res.data; // { success, message, data: { user } }
  },
};

export default userApi;
