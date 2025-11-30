import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import eventApi from "../../../apis/eventApi";

// THUNK: fetch active events with pagination
export const fetchActiveEvents = createAsyncThunk(
  "events/fetchActiveEvents",
  // { page, limit, search, category_id, start_date_from, start_date_to }s
  async (params, { rejectWithValue }) => {
    try {
      const res = await eventApi.getActiveEvents(params);
      const payload = res?.data;

      if (!payload?.success) {
        return rejectWithValue(
          payload?.message || "Không lấy được danh sách sự kiện"
        );
      }

      /* payload.data
      "events": [
      {
        "event_id": 1,
        "title": "Dọn rác bờ hồ Hoàn Kiếm",
        "description": "Cùng nhau dọn rác...",
        "target_participants": 50,
        "current_participants": 10,
        "start_date": "2025-12-10 08:00:00",
        "end_date": "2025-12-10 11:00:00",
        "location": "Bờ hồ Hoàn Kiếm, Hà Nội",
        "manager_id": 2,
        "category_id": 1,
        "category_name": "Môi trường",
        "approval_status": "approved",
        "is_deleted": 0,
        "created_at": "...",
        "updated_at": "..."
      }
      // ...
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 9,
      "totalPages": 2
    }
      
      */
      const result = payload.data || {};
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
