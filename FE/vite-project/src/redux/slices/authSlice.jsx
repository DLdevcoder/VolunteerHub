import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../../apis/authApi";

// Đọc từ localStorage (token + user)
const savedToken = localStorage.getItem("vh_token");
const savedUser = localStorage.getItem("vh_user");

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  // ban đầu coi như đã đăng nhập nếu có token + user
  isAuthenticated: !!savedToken && !!savedUser,
  loading: false,
  error: null,
};

/* =====================
   1. LOGIN
===================== */

export const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const res = await authApi.login({ email, password });

      if (!res.success) {
        return thunkAPI.rejectWithValue(res.message || "Login failed");
      }

      // backend trả: { success, message, data: { user, token } }
      return res.data;
    } catch (error) {
      const msg = error?.response?.data?.message || "Error while logging in";
      return thunkAPI.rejectWithValue(msg);
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

      if (!res.success) {
        return rejectWithValue(res.message || "Register failed");
      }

      return res.data; // { user, token }
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

      localStorage.removeItem("vh_token");
      localStorage.removeItem("vh_user");
    },
  },
  extraReducers: (builder) => {
    builder
      /* --- LOGIN --- */
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        const { user, token } = action.payload;

        state.user = user;
        state.token = token;
        state.isAuthenticated = true;

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
      })
      .addCase(registerThunk.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Register failed";
      })

      /* --- FETCH ME (/auth/me) --- */
      .addCase(fetchMeThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        // nếu có user tức là token dùng được → coi như đang đăng nhập
        state.isAuthenticated = true;

        // sync lại user vào localStorage (token giữ nguyên)
        if (state.token) {
          localStorage.setItem("vh_user", JSON.stringify(action.payload));
        }
      })
      .addCase(fetchMeThunk.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || "Không thể tải thông tin người dùng hiện tại";
        // (option) nếu muốn: có thể clear token khi 401/403, nhưng tạm để nguyên
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice;
