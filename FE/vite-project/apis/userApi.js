// src/apis/userApi.js
import { api } from "../api";

const USER_API = "/users";

const userApi = {
  /* ========= USER SELF ========= */

  // GET /users/me
  async getMe() {
    const response = await api.get(`${USER_API}/me`);
    return response.data; // { success, data: { user } }
  },

  // PUT /users/me
  async updateMe(payload) {
    // payload: { full_name, phone, avatar_url? }
    const response = await api.put(`${USER_API}/me`, payload);
    return response.data; // { success, message?, data: { user } }
  },

  /* ========= ADMIN SIDE ========= */

  // GET /users  (with filters & pagination)
  // params: { page, limit, role?, status? }
  async getAllUsers(params) {
    const response = await api.get(`${USER_API}`, { params });
    return response.data; // { success, data: { users, pagination } } or { success, data: { users, pagination } }
  },

  // PUT /users/:user_id/status
  // body: { status: "Active" | "Locked" }
  async updateUserStatus(userId, status) {
    const response = await api.put(`${USER_API}/${userId}/status`, { status });
    return response.data; // { success, message?, data: { user } }
  },

  // PUT /users/:user_id/role
  // body: { role_name: "Admin" | "Manager" | "Volunteer" }
  async updateUserRole(userId, role_name) {
    const response = await api.put(`${USER_API}/${userId}/role`, {
      role_name,
    });
    return response.data; // { success, message?, data: { user } }
  },
};

export default userApi;
