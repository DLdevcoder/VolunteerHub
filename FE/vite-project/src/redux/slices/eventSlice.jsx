// src/redux/slices/eventSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import eventApi from "../../../apis/eventApi";

// THUNK: fetch active events with pagination
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

const initialState = {
  items: [],
  pagination: {
    page: 1,
    limit: 9,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,
};

const eventSlice = createSlice({
  name: "events",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
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
  },
});

export default eventSlice;
