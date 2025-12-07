import { api } from "../api";

const AUTH_API = "/auth";

const authApi = {
  login: async (data) => {
    // data = { email, password }
    const response = await api.post(`${AUTH_API}/login`, data);
    return response.data;
  },

  register: async (data) => {
    // data = { email, password, full_name, phone, role_name? }
    const response = await api.post(`${AUTH_API}/register`, data);
    return response.data; // { success, message, data: { user, token } }
  },

  getMe: async () => {
    const response = await api.get(`${AUTH_API}/me`);
    return response.data;
  },

  // NEW: change password (user must be logged in)
  changePassword: async (data) => {
    // data = { current_password, new_password, confirm_password }
    const response = await api.put(`${AUTH_API}/change-password`, data);
    return response.data; // { success, message }
  },
};

export default authApi;
