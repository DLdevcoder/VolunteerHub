// src/redux/slices/eventSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import eventApi from "../../../apis/eventApi";

/* ======================================================================
   Helpers
====================================================================== */

const replaceEventInList = (list, updated) =>
  Array.isArray(list)
    ? list.map((ev) =>
        ev.event_id === updated.event_id ? { ...ev, ...updated } : ev
      )
    : [];

/* ======================================================================
   THUNKS
====================================================================== */

// =========================
// 1. VOLUNTEER: active events
// =========================
export const fetchActiveEvents = createAsyncThunk(
  "events/fetchActiveEvents",
  async (params, { rejectWithValue }) => {
    try {
      const res = await eventApi.getActiveEvents(params);

      if (!res?.success) {
        return rejectWithValue(
          res?.message || "Không lấy được danh sách sự kiện"
        );
      }

      const result = res.data || {};
      const events = result.events || [];
      const apiPagination = result.pagination || {};

      const pagination = {
        page: apiPagination.page ?? params?.page ?? 1,
        limit:
          apiPagination.limit ??
          params?.limit ??
          (Array.isArray(events) ? events.length : 0),
        total:
          apiPagination.total ?? (Array.isArray(events) ? events.length : 0),
        totalPages:
          apiPagination.totalPages ??
          (apiPagination.total && apiPagination.limit
            ? Math.ceil(apiPagination.total / apiPagination.limit)
            : 1),
      };

      return { events, pagination };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không lấy được danh sách sự kiện";
      return rejectWithValue(msg);
    }
  }
);

// =========================
// 2. Categories
// =========================
export const fetchEventCategories = createAsyncThunk(
  "events/fetchCategories",
  async (_, { rejectWithValue }) => {
    try {
      const res = await eventApi.getCategories();
      if (!res?.success) {
        return rejectWithValue(
          res?.message || "Không tải được danh sách danh mục"
        );
      }
      return res.data || [];
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không tải được danh sách danh mục";
      return rejectWithValue(msg);
    }
  }
);

// =========================
// 3. MANAGER – create event
// =========================
export const createEventThunk = createAsyncThunk(
  "events/createEvent",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await eventApi.createEvent(payload);
      if (!res?.success) {
        return rejectWithValue(res?.message || "Tạo sự kiện thất bại");
      }
      return res.data?.event || null;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Tạo sự kiện thất bại";
      return rejectWithValue(msg);
    }
  }
);

// =========================
// 4. MANAGER – my events list
// =========================
export const fetchManagerEvents = createAsyncThunk(
  "events/fetchManagerEvents",
  async (params, { rejectWithValue }) => {
    try {
      const res = await eventApi.getMyEvents(params);
      if (!res?.success) {
        return rejectWithValue(res?.message || "Không tải được event của bạn");
      }

      const result = res.data || {};
      const events = result.events || [];
      const apiPag = result.pagination || {};

      const pagination = {
        page: apiPag.page ?? params?.page ?? 1,
        limit: apiPag.limit ?? params?.limit ?? 10,
        total:
          apiPag.total ??
          apiPag.total_records ??
          (Array.isArray(events) ? events.length : 0),
        totalPages:
          apiPag.totalPages ??
          apiPag.total_pages ??
          (apiPag.total && apiPag.limit
            ? Math.ceil(apiPag.total / apiPag.limit)
            : 1),
      };

      return { events, pagination };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không tải được event của bạn";
      return rejectWithValue(msg);
    }
  }
);

// =========================
// 5. ADMIN – list events (requests)
// =========================
export const fetchAdminEvents = createAsyncThunk(
  "events/fetchAdminEvents",
  async (params, { rejectWithValue }) => {
    try {
      const res = await eventApi.getAllEventsAdmin(params);
      if (!res?.success) {
        return rejectWithValue(
          res?.message || "Không tải được danh sách sự kiện (admin)"
        );
      }

      const result = res.data || {};
      const events = result.events || [];
      const apiPag = result.pagination || {};

      const pagination = {
        page: apiPag.page ?? params?.page ?? 1,
        limit: apiPag.limit ?? params?.limit ?? 10,
        total:
          apiPag.total ??
          apiPag.total_records ??
          (Array.isArray(events) ? events.length : 0),
        totalPages:
          apiPag.totalPages ??
          apiPag.total_pages ??
          (apiPag.total && apiPag.limit
            ? Math.ceil(apiPag.total / apiPag.limit)
            : 1),
      };

      return { events, pagination };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không tải được danh sách sự kiện (admin)";
      return rejectWithValue(msg);
    }
  }
);

// =========================
// 6. ADMIN – approve / reject event
// =========================
export const approveEventThunk = createAsyncThunk(
  "events/approveEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await eventApi.approveEvent(eventId);
      if (!res?.success) {
        return rejectWithValue(res?.message || "Không thể duyệt sự kiện");
      }
      return res.data?.event;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể duyệt sự kiện";
      return rejectWithValue(msg);
    }
  }
);

export const rejectEventThunk = createAsyncThunk(
  "events/rejectEvent",
  async ({ eventId, reason }, { rejectWithValue }) => {
    try {
      const res = await eventApi.rejectEvent(eventId, reason);
      if (!res?.success) {
        return rejectWithValue(res?.message || "Không thể từ chối sự kiện");
      }
      return res.data?.event;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể từ chối sự kiện";
      return rejectWithValue(msg);
    }
  }
);

// =========================
// 7. EVENT DETAIL – by id
// =========================
export const fetchEventDetailThunk = createAsyncThunk(
  "events/fetchEventDetail",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await eventApi.getEventById(eventId);
      if (!res?.success) {
        return rejectWithValue(
          res?.message || "Không lấy được chi tiết sự kiện"
        );
      }
      return res.data?.event || null;
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không lấy được chi tiết sự kiện";
      return rejectWithValue(msg);
    }
  }
);

// =========================
// 8. MANAGER – update event
// =========================
export const updateEventThunk = createAsyncThunk(
  "events/updateEvent",
  async ({ eventId, payload }, { rejectWithValue }) => {
    try {
      console.log("[updateEventThunk] eventId =", eventId);
      console.log("[updateEventThunk] UPDATE EVENT PAYLOAD =", payload);

      const res = await eventApi.updateEvent(eventId, payload);
      console.log("[updateEventThunk] API RESPONSE =", res);

      if (!res?.success) {
        return rejectWithValue(res?.message || "Cập nhật sự kiện thất bại");
      }

      // BE có thể trả về nhiều kiểu khác nhau, nên ta bắt hết:
      const updated =
        res.data?.event ?? // { data: { event: {...} } }
        res.data?.updatedEvent ?? // { data: { updatedEvent: {...} } }
        res.data ?? // { data: {...} }
        null;

      if (!updated) {
        console.warn(
          "[updateEventThunk] Không tìm thấy event đã cập nhật trong response"
        );
      }

      return updated;
    } catch (err) {
      console.error("[updateEventThunk] ERROR =", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Cập nhật sự kiện thất bại";
      return rejectWithValue(msg);
    }
  }
);

// =========================
// 9. MANAGER / ADMIN – delete event
// =========================
export const deleteEventThunk = createAsyncThunk(
  "events/deleteEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await eventApi.deleteEvent(eventId);
      if (!res?.success) {
        return rejectWithValue(res?.message || "Xóa sự kiện thất bại");
      }
      // Chỉ cần trả về id để xóa khỏi store
      return { eventId };
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Xóa sự kiện thất bại";
      return rejectWithValue(msg);
    }
  }
);

/* ======================================================================
   STATE + SLICE
====================================================================== */

const initialState = {
  // Volunteer: active events
  volunteer: {
    items: [],
    pagination: {
      page: 1,
      limit: 9,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
  },

  // Categories
  categories: {
    items: [],
    loading: false,
    error: null,
  },

  // Manager: my events & create/edit/delete
  manager: {
    myEvents: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
    createLoading: false,
    createError: null,
    lastCreatedEvent: null,
    updateLoading: false,
    updateError: null,
    deleteLoading: false,
    deleteError: null,
  },

  // Admin: events list & actions
  admin: {
    events: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
    loading: false,
    error: null,
    actionError: null,
  },

  // Event detail (for detail / edit page)
  detail: {
    data: null,
    loading: false,
    error: null,
  },
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    resetCreateEventState(state) {
      state.manager.createLoading = false;
      state.manager.createError = null;
      state.manager.lastCreatedEvent = null;
    },
  },
  extraReducers: (builder) => {
    /* -------- volunteer active events -------- */
    builder
      .addCase(fetchActiveEvents.pending, (state) => {
        state.volunteer.loading = true;
        state.volunteer.error = null;
      })
      .addCase(fetchActiveEvents.fulfilled, (state, action) => {
        state.volunteer.loading = false;
        state.volunteer.items = action.payload.events;
        state.volunteer.pagination = action.payload.pagination;
      })
      .addCase(fetchActiveEvents.rejected, (state, action) => {
        state.volunteer.loading = false;
        state.volunteer.error =
          action.payload || "Không lấy được danh sách sự kiện";
      });

    /* -------- categories -------- */
    builder
      .addCase(fetchEventCategories.pending, (state) => {
        state.categories.loading = true;
        state.categories.error = null;
      })
      .addCase(fetchEventCategories.fulfilled, (state, action) => {
        state.categories.loading = false;
        state.categories.items = action.payload || [];
      })
      .addCase(fetchEventCategories.rejected, (state, action) => {
        state.categories.loading = false;
        state.categories.error =
          action.payload || "Không tải được danh sách danh mục";
      });

    /* -------- manager: create event -------- */
    builder
      .addCase(createEventThunk.pending, (state) => {
        state.manager.createLoading = true;
        state.manager.createError = null;
      })
      .addCase(createEventThunk.fulfilled, (state, action) => {
        state.manager.createLoading = false;
        state.manager.lastCreatedEvent = action.payload;
      })
      .addCase(createEventThunk.rejected, (state, action) => {
        state.manager.createLoading = false;
        state.manager.createError = action.payload || "Tạo sự kiện thất bại";
      });

    /* -------- manager: my events -------- */
    builder
      .addCase(fetchManagerEvents.pending, (state) => {
        state.manager.loading = true;
        state.manager.error = null;
      })
      .addCase(fetchManagerEvents.fulfilled, (state, action) => {
        state.manager.loading = false;
        state.manager.myEvents = action.payload.events;
        state.manager.pagination = action.payload.pagination;
      })
      .addCase(fetchManagerEvents.rejected, (state, action) => {
        state.manager.loading = false;
        state.manager.error = action.payload || "Không tải được event của bạn";
      });

    /* -------- admin: events list -------- */
    builder
      .addCase(fetchAdminEvents.pending, (state) => {
        state.admin.loading = true;
        state.admin.error = null;
      })
      .addCase(fetchAdminEvents.fulfilled, (state, action) => {
        state.admin.loading = false;
        state.admin.events = action.payload.events;
        state.admin.pagination = action.payload.pagination;
      })
      .addCase(fetchAdminEvents.rejected, (state, action) => {
        state.admin.loading = false;
        state.admin.error =
          action.payload || "Không tải được danh sách sự kiện (admin)";
      });

    /* -------- admin: approve / reject -------- */
    builder
      .addCase(approveEventThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;
        state.admin.events = replaceEventInList(state.admin.events, updated);
        state.manager.myEvents = replaceEventInList(
          state.manager.myEvents,
          updated
        );
        state.admin.actionError = null;
      })
      .addCase(approveEventThunk.rejected, (state, action) => {
        state.admin.actionError =
          action.payload || "Không thể duyệt sự kiện (admin)";
      })
      .addCase(rejectEventThunk.fulfilled, (state, action) => {
        const updated = action.payload;
        if (!updated) return;
        state.admin.events = replaceEventInList(state.admin.events, updated);
        state.manager.myEvents = replaceEventInList(
          state.manager.myEvents,
          updated
        );
        state.admin.actionError = null;
      })
      .addCase(rejectEventThunk.rejected, (state, action) => {
        state.admin.actionError =
          action.payload || "Không thể từ chối sự kiện (admin)";
      });

    /* -------- event detail -------- */
    builder
      .addCase(fetchEventDetailThunk.pending, (state) => {
        state.detail.loading = true;
        state.detail.error = null;
      })
      .addCase(fetchEventDetailThunk.fulfilled, (state, action) => {
        state.detail.loading = false;
        state.detail.data = action.payload;
      })
      .addCase(fetchEventDetailThunk.rejected, (state, action) => {
        state.detail.loading = false;
        state.detail.error =
          action.payload || "Không lấy được chi tiết sự kiện";
      });

    /* -------- manager: update event -------- */
    builder
      .addCase(updateEventThunk.pending, (state) => {
        state.manager.updateLoading = true;
        state.manager.updateError = null;
      })
      .addCase(updateEventThunk.fulfilled, (state, action) => {
        state.manager.updateLoading = false;

        const updated = action.payload;
        if (!updated || !updated.event_id) {
          console.warn(
            "[eventSlice] updateEventThunk.fulfilled but updated is",
            updated
          );
          return;
        }

        // Cập nhật trong danh sách Manager
        state.manager.myEvents = replaceEventInList(
          state.manager.myEvents,
          updated
        );

        // Cập nhật trong danh sách Admin (nếu cần)
        state.admin.events = replaceEventInList(state.admin.events, updated);

        // Cập nhật detail nếu đang xem event này
        if (
          state.detail.data &&
          state.detail.data.event_id === updated.event_id
        ) {
          state.detail.data = { ...state.detail.data, ...updated };
        }
      })
      .addCase(updateEventThunk.rejected, (state, action) => {
        state.manager.updateLoading = false;
        state.manager.updateError =
          action.payload || "Cập nhật sự kiện thất bại";
      });

    /* -------- manager/admin: delete event -------- */
    builder
      .addCase(deleteEventThunk.pending, (state) => {
        state.manager.deleteLoading = true;
        state.manager.deleteError = null;
      })
      .addCase(deleteEventThunk.fulfilled, (state, action) => {
        state.manager.deleteLoading = false;
        const id = action.payload?.eventId;
        if (!id) return;

        state.manager.myEvents = state.manager.myEvents.filter(
          (ev) => ev.event_id !== id
        );
        state.admin.events = state.admin.events.filter(
          (ev) => ev.event_id !== id
        );

        if (state.detail.data && state.detail.data.event_id === id) {
          state.detail.data = null;
        }
      })
      .addCase(deleteEventThunk.rejected, (state, action) => {
        state.manager.deleteLoading = false;
        state.manager.deleteError = action.payload || "Xóa sự kiện thất bại";
      });
  },
});

export const { resetCreateEventState } = eventSlice.actions;
export default eventSlice;
