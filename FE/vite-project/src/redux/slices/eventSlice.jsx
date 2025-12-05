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
  // { page, limit, search, category_id, start_date_from, start_date_to }
  async (params, { rejectWithValue }) => {
    try {
      const res = await eventApi.getActiveEvents(params);
      // res: { success, data: { events, pagination }, message? }

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
      // res: { success, data, message? }
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
      // res: { success, message, data: { event } }
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
  // { page, limit, approval_status, category_id, search, sort_by, sort_order }
  async (params, { rejectWithValue }) => {
    try {
      const res = await eventApi.getMyEvents(params);
      // res: { success, message, data: { events, pagination } }
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
  // { page, limit, approval_status, manager_id, category_id, search, sort_by, sort_order }
  async (params, { rejectWithValue }) => {
    try {
      const res = await eventApi.getAllEventsAdmin(params);
      // res: { success, data: { events, pagination }, message? }
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
      // { success, message, data: { event } }
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
      // { success, message, data: { event } }
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
      // BE: { success, data: { event } }
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

  // Manager: my events & create
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

  // Event detail (for detail page)
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
  },
});

export const { resetCreateEventState } = eventSlice.actions;
export default eventSlice;
