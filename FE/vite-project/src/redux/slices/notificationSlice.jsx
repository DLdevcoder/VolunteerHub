// src/redux/slices/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import notificationApi from "../../../apis/notificationApi";

/* ========== THUNKS ========== */

// Lấy danh sách thông báo của user hiện tại
export const fetchNotificationsThunk = createAsyncThunk(
  "notification/fetchNotifications",
  async (params, { rejectWithValue }) => {
    try {
      const res = await notificationApi.getMyNotifications(params);
      // res: { success, data: { notifications, unread_count, pagination } }
      if (!res.success) {
        return rejectWithValue(res.message || "Không thể tải thông báo");
      }
      // trả về phần data bên trong
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Lỗi khi tải thông báo";
      return rejectWithValue(msg);
    }
  }
);

// Lấy số lượng chưa đọc (badge)
export const fetchUnreadCountThunk = createAsyncThunk(
  "notification/fetchUnreadCount",
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationApi.getUnreadCount();
      // res: { success, data: { unread_count } }
      if (!res.success) {
        return rejectWithValue(
          res.message || "Không thể lấy số thông báo chưa đọc"
        );
      }
      return res.data.unread_count;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Lỗi khi lấy số thông báo chưa đọc";
      return rejectWithValue(msg);
    }
  }
);

// Lấy vài thông báo gần đây (dropdown ở header)
export const fetchRecentNotificationsThunk = createAsyncThunk(
  "notification/fetchRecent",
  async (limit = 10, { rejectWithValue }) => {
    try {
      const res = await notificationApi.getRecent(limit);
      // res: { success, data: { notifications: [...] } }
      if (!res.success) {
        return rejectWithValue(
          res.message || "Không thể tải thông báo gần đây"
        );
      }

      return res.data.notifications; // ⬅️ sửa lại, không còn .data.data nữa
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Lỗi khi tải thông báo gần đây";
      return rejectWithValue(msg);
    }
  }
);

// Đánh dấu 1 thông báo là đã đọc
export const markNotificationReadThunk = createAsyncThunk(
  "notification/markRead",
  async (notificationId, { rejectWithValue }) => {
    try {
      const res = await notificationApi.markAsRead(notificationId);
      if (!res.success) {
        return rejectWithValue(res.message || "Không thể cập nhật trạng thái");
      }
      return notificationId;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Lỗi khi đánh dấu đã đọc";
      return rejectWithValue(msg);
    }
  }
);

// Đánh dấu tất cả là đã đọc
export const markAllNotificationsReadThunk = createAsyncThunk(
  "notification/markAllRead",
  async (_, { rejectWithValue }) => {
    try {
      const res = await notificationApi.markAllAsRead();
      if (!res.success) {
        return rejectWithValue(
          res.message || "Không thể đánh dấu tất cả đã đọc"
        );
      }
      return true;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err.message ||
        "Lỗi khi đánh dấu tất cả đã đọc";
      return rejectWithValue(msg);
    }
  }
);

// Xoá 1 thông báo
export const deleteNotificationThunk = createAsyncThunk(
  "notification/deleteOne",
  async (notificationId, { rejectWithValue }) => {
    try {
      const res = await notificationApi.deleteNotification(notificationId);
      if (!res.success) {
        return rejectWithValue(res.message || "Không thể xoá thông báo");
      }
      return notificationId;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err.message || "Lỗi khi xoá thông báo";
      return rejectWithValue(msg);
    }
  }
);

/* ========== SLICE ========== */

const initialState = {
  list: [], // danh sách đầy đủ (trang Notifications)
  pagination: null,

  recent: [], // vài notification gần đây (dropdown ở header)

  unreadCount: 0,

  loadingList: false,
  loadingRecent: false,
  loadingUnread: false,
  markingAll: false,

  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    clearNotificationError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      /* --- fetchNotifications --- */
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loadingList = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loadingList = false;
        state.list = action.payload.notifications || [];
        state.pagination = action.payload.pagination || null;
        // backend cũng trả unread_count -> sync luôn
        if (typeof action.payload.unread_count === "number") {
          state.unreadCount = action.payload.unread_count;
        }
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loadingList = false;
        state.error = action.payload || "Không thể tải danh sách thông báo";
      })

      /* --- fetchUnreadCount --- */
      .addCase(fetchUnreadCountThunk.pending, (state) => {
        state.loadingUnread = true;
      })
      .addCase(fetchUnreadCountThunk.fulfilled, (state, action) => {
        state.loadingUnread = false;
        state.unreadCount = action.payload;
      })
      .addCase(fetchUnreadCountThunk.rejected, (state, action) => {
        state.loadingUnread = false;
        state.error = action.payload || "Không thể tải số thông báo chưa đọc";
      })

      /* --- fetchRecent --- */
      .addCase(fetchRecentNotificationsThunk.pending, (state) => {
        state.loadingRecent = true;
      })
      .addCase(fetchRecentNotificationsThunk.fulfilled, (state, action) => {
        state.loadingRecent = false;
        state.recent = action.payload || [];
      })
      .addCase(fetchRecentNotificationsThunk.rejected, (state, action) => {
        state.loadingRecent = false;
        state.error = action.payload || "Không thể tải thông báo gần đây";
      })

      /* --- mark one read --- */
      .addCase(markNotificationReadThunk.fulfilled, (state, action) => {
        const id = action.payload;

        // update trong list
        const inList = state.list.find((n) => n.notification_id === id);
        if (inList) inList.is_read = 1;

        // update trong recent
        const inRecent = state.recent.find((n) => n.notification_id === id);
        if (inRecent) inRecent.is_read = 1;

        if (state.unreadCount > 0) state.unreadCount -= 1;
      })

      /* --- mark all read --- */
      .addCase(markAllNotificationsReadThunk.pending, (state) => {
        state.markingAll = true;
      })
      .addCase(markAllNotificationsReadThunk.fulfilled, (state) => {
        state.markingAll = false;
        state.list.forEach((n) => {
          n.is_read = 1;
        });
        state.recent.forEach((n) => {
          n.is_read = 1;
        });
        state.unreadCount = 0;
      })
      .addCase(markAllNotificationsReadThunk.rejected, (state, action) => {
        state.markingAll = false;
        state.error = action.payload || "Không thể đánh dấu tất cả đã đọc";
      })

      /* --- delete one --- */
      .addCase(deleteNotificationThunk.fulfilled, (state, action) => {
        const id = action.payload;
        state.list = state.list.filter((n) => n.notification_id !== id);
        state.recent = state.recent.filter((n) => n.notification_id !== id);
      });
  },
});

export const { clearNotificationError } = notificationSlice.actions;
export default notificationSlice;
