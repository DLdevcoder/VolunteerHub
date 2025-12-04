// src/redux/slices/eventSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import eventApi from "../../../apis/eventApi";

// =========================
// THUNK: public active events
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
// THUNK: categories (used by ManagerCreateEvent, etc.)
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
// THUNK: manager - create event
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
// THUNK: manager - my events list
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
// STATE + SLICE
// =========================

const initialState = {
  // Public active events (volunteer)
  items: [],
  pagination: {
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,

  // Categories
  categories: [],
  categoriesLoading: false,
  categoriesError: null,

  // Manager: my events
  myEvents: [],
  myEventsPagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  myEventsLoading: false,
  myEventsError: null,

  // Manager: create event
  createLoading: false,
  createError: null,
  lastCreatedEvent: null,
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    resetCreateEventState(state) {
      state.createLoading = false;
      state.createError = null;
      state.lastCreatedEvent = null;
    },
  },
  extraReducers: (builder) => {
    // -------- active events (public) --------
    builder
      .addCase(fetchActiveEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.events;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchActiveEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không lấy được danh sách sự kiện";
      });

    // -------- categories --------
    builder
      .addCase(fetchEventCategories.pending, (state) => {
        state.categoriesLoading = true;
        state.categoriesError = null;
      })
      .addCase(fetchEventCategories.fulfilled, (state, action) => {
        state.categoriesLoading = false;
        state.categories = action.payload || [];
      })
      .addCase(fetchEventCategories.rejected, (state, action) => {
        state.categoriesLoading = false;
        state.categoriesError =
          action.payload || "Không tải được danh sách danh mục";
      });

    // -------- manager: create event --------
    builder
      .addCase(createEventThunk.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createEventThunk.fulfilled, (state, action) => {
        state.createLoading = false;
        state.lastCreatedEvent = action.payload;
      })
      .addCase(createEventThunk.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload || "Tạo sự kiện thất bại";
      });

    // -------- manager: my events --------
    builder
      .addCase(fetchManagerEvents.pending, (state) => {
        state.myEventsLoading = true;
        state.myEventsError = null;
      })
      .addCase(fetchManagerEvents.fulfilled, (state, action) => {
        state.myEventsLoading = false;
        state.myEvents = action.payload.events;
        state.myEventsPagination = action.payload.pagination;
      })
      .addCase(fetchManagerEvents.rejected, (state, action) => {
        state.myEventsLoading = false;
        state.myEventsError = action.payload || "Không tải được event của bạn";
      });
  },
});

export const { resetCreateEventState } = eventSlice.actions;

export default eventSlice;
