import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../../apis/authApi";

// Đọc từ localStorage (token + user)
const savedToken = localStorage.getItem("vh_token");
const savedUser = localStorage.getItem("vh_user");

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isAuthenticated: !!savedToken && !!savedUser,
  loading: false,
  error: null,
  successMessage: null, // 👈 NEW
};

/* =====================
   1. LOGIN
===================== */
export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const res = await authApi.login({ email, password });
      // res = { success, message, data: { user, token } }

      if (!res.success) {
        return rejectWithValue(res.message || "Login failed");
      }

      return {
        user: res.data.user,
        token: res.data.token,
        message: res.message || "Đăng nhập thành công",
      };
    } catch (error) {
      const msg = error?.response?.data?.message || "Error while logging in";
      return rejectWithValue(msg);
    }
  }
);

/* =====================
   2. REGISTER
===================== */

export const registerThunk = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await authApi.register(payload);
      // res = { success, message, data: { user, token } }

      if (!res.success) {
        return rejectWithValue(res.message || "Register failed");
      }

      return {
        user: res.data.user,
        token: res.data.token,
        message: res.message || "Đăng ký thành công",
      };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error while registering";
      return rejectWithValue(msg);
    }
  }
);

/* =====================
   3. FETCH ME (/auth/me)
   Dùng token hiện tại để lấy user tươi từ DB

   response: 
   {
      "success": true,
      "data": {
          "user": {
              "user_id": 2,
              "email": "huyndq05@gmail.com",
              "full_name": "huyndq",
              "phone": "0965425660",
              "avatar_url": null,
              "role_name": "Admin",
              "status": "Active",
              "created_at": "2025-11-24T08:59:36.000Z",
              "updated_at": "2025-11-29T13:50:29.000Z"
          }
      }
  }
===================== */

export const fetchMeThunk = createAsyncThunk(
  "auth/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await authApi.getMe(); // GET /auth/me

      if (!res.success) {
        return rejectWithValue(res.message || "Cannot fetch user info");
      }

      // backend: { success, data: { user } }
      return res.data.user;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error while fetching user info";
      return rejectWithValue(msg);
    }
  }
);

/* =====================
   4. CHANGE PASSWORD
===================== */

export const changePasswordThunk = createAsyncThunk(
  "auth/changePassword",
  async (payload, { rejectWithValue }) => {
    try {
      // payload = { current_password, new_password, confirm_password }
      const res = await authApi.changePassword(payload);

      if (!res.success) {
        return rejectWithValue(res.message || "Change password failed");
      }

      // BE: { success, message }
      return {
        message: res.message || "Đổi mật khẩu thành công",
      };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error while changing password";
      return rejectWithValue(msg);
    }
  }
);

/* =====================
   SLICE
===================== */

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.error = null;
      state.successMessage = null;

      localStorage.removeItem("vh_token");
      localStorage.removeItem("vh_user");
      localStorage.removeItem("vh_push_inited");
    },
    clearMessages(state) {
      state.error = null;
      state.successMessage = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* --- LOGIN --- */
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token, message } = action.payload;

        state.user = user;
        state.token = token;
        state.isAuthenticated = true;
        state.successMessage = message || null;

        localStorage.setItem("vh_token", token);
        localStorage.setItem("vh_user", JSON.stringify(user));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })

      /* --- REGISTER --- */
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage =
          action.payload?.message || "Register successfully! Please log in.";
        // (tuỳ ý dùng action.payload.user / token, hiện tại FE chưa cần)
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Register failed";
      })

      /* --- FETCH ME (/auth/me) --- */
      .addCase(fetchMeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        // không đụng successMessage
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.isAuthenticated = true;

        if (state.token) {
          localStorage.setItem("vh_user", JSON.stringify(action.payload));
        }
      })
      .addCase(fetchMeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Không thể tải thông tin người dùng hiện tại";
      })

      /* --- CHANGE PASSWORD --- */
      .addCase(changePasswordThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.successMessage = null;
      })
      .addCase(changePasswordThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.successMessage = action.payload.message;
      })
      .addCase(changePasswordThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Change password failed";
      });
  },
});

export const { logout, clearMessages } = authSlice.actions;
export default authSlice;
