// src/redux/slices/userSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import userApi from "../../../apis/userApi";
import { loginThunk } from "./authSlice";

/* ========== THUNKS ========== */

// 1. Lấy thông tin cá nhân (GET /users/me)
export const fetchMeThunk = createAsyncThunk(
  "user/fetchMe",
  async (_, { rejectWithValue }) => {
    try {
      const res = await userApi.getMe();

      if (!res.success) {
        return rejectWithValue(res.message || "Cannot fetch user info");
      }

      return res.data.user; // user object
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error while fetching user info";
      return rejectWithValue(msg);
    }
  }
);

// 2. Cập nhật thông tin cá nhân (PUT /users/me)
export const updateMeThunk = createAsyncThunk(
  "user/updateMe",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await userApi.updateMe(payload);

      if (!res.success) {
        return rejectWithValue(res.message || "Cannot update user info");
      }

      return res.data.user; // user sau khi cập nhật
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error while updating user info";
      return rejectWithValue(msg);
    }
  }
);

// (OPTIONAL) Admin thunks
export const fetchUsersThunk = createAsyncThunk(
  "user/fetchUsers",
  async (params, { rejectWithValue }) => {
    try {
      const res = await userApi.getAllUsers(params);

      if (!res.success) {
        return rejectWithValue(res.message || "Cannot fetch users");
      }

      return res.data; // { users, pagination }
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error while fetching users";
      return rejectWithValue(msg);
    }
  }
);

export const updateUserStatusThunk = createAsyncThunk(
  "user/updateUserStatus",
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      const res = await userApi.updateUserStatus(userId, status);

      if (!res.success) {
        return rejectWithValue(res.message || "Cannot update user status");
      }

      return res.data.user;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error while updating user status";
      return rejectWithValue(msg);
    }
  }
);

export const updateUserRoleThunk = createAsyncThunk(
  "user/updateUserRole",
  async ({ userId, role_name }, { rejectWithValue }) => {
    try {
      const res = await userApi.updateUserRole(userId, role_name);

      if (!res.success) {
        return rejectWithValue(res.message || "Cannot update user role");
      }

      return res.data.user;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Error while updating user role";
      return rejectWithValue(msg);
    }
  }
);

/* ========== SLICE ========== */

const savedUser = localStorage.getItem("vh_user");

const initialState = {
  me: savedUser ? JSON.parse(savedUser) : null,
  loadingMe: false,
  updatingMe: false,
  errorMe: null,

  admin: {
    list: [],
    pagination: null,
    loadingList: false,
    errorList: null,
  },
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    clearUserError(state) {
      state.errorMe = null;
      state.admin.errorList = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* --- fetchMe --- */
      .addCase(fetchMeThunk.pending, (state) => {
        state.loadingMe = true;
        state.errorMe = null;
      })
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        state.loadingMe = false;
        state.me = action.payload;
      })
      .addCase(fetchMeThunk.rejected, (state, action) => {
        state.loadingMe = false;
        state.errorMe =
          action.payload || "Không thể tải thông tin người dùng hiện tại";
        state.me = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.me = action.payload.user;
      })

      /* --- updateMe --- */
      .addCase(updateMeThunk.pending, (state) => {
        state.updatingMe = true;
        state.errorMe = null;
      })
      .addCase(updateMeThunk.fulfilled, (state, action) => {
        state.updatingMe = false;
        state.me = action.payload;
      })
      .addCase(updateMeThunk.rejected, (state, action) => {
        state.updatingMe = false;
        state.errorMe =
          action.payload || "Không thể cập nhật thông tin người dùng";
      })

      /* --- fetchUsers (admin) --- */
      .addCase(fetchUsersThunk.pending, (state) => {
        state.admin.loadingList = true;
        state.admin.errorList = null;
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action) => {
        state.admin.loadingList = false;
        state.admin.list = action.payload.users;
        state.admin.pagination = action.payload.pagination;
      })
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        state.admin.loadingList = false;
        state.admin.errorList =
          action.payload || "Không thể tải danh sách users";
      })

      /* --- updateUserStatus (admin) --- */
      .addCase(updateUserStatusThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.admin.list.findIndex(
          (u) => u.user_id === updated.user_id
        );
        if (idx !== -1) {
          state.admin.list[idx] = updated;
        }
      })

      /* --- updateUserRole (admin) --- */
      .addCase(updateUserRoleThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        const idx = state.admin.list.findIndex(
          (u) => u.user_id === updated.user_id
        );
        if (idx !== -1) {
          state.admin.list[idx] = updated;
        }
      });
  },
});

export const { clearUserError } = userSlice.actions;
export default userSlice;
