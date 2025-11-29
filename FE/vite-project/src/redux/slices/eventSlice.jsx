import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import eventApi from "../../../apis/eventApi";

/**
 * Thunk: Lấy danh sách sự kiện đang hoạt động cho Volunteer / public
 * Gọi đến: GET /events/active?page=&limit=&search=&category_id=...
 */
const fetchActiveEvents = createAsyncThunk(
  "events/fetchActiveEvents",
  async (params, { rejectWithValue }) => {
    try {
      const res = await eventApi.getActiveEvents(params);

      // BE trả dạng:
      // { success, message, data: result }
      const result = res.data?.data ?? {};

      // console.log("active events result:", result);

      let events = [];
      let pagination = {};

      if (Array.isArray(result)) {
        // Trường hợp Event.getActiveEvents() trả thẳng mảng
        events = result;
        pagination = {
          page: params?.page || 1,
          limit: params?.limit || result.length,
          total: result.length,
          totalPages: 1,
        };
      } else {
        // Trường hợp trả object có phân trang: { events, pagination, total, ... }
        events =
          result.events || result.items || result.rows || result.data || [];

        pagination = {
          page: result.page || result.currentPage || params?.page || 1,
          limit:
            result.limit || result.pageSize || params?.limit || events.length,
          total: result.total || result.totalItems || events.length,
          totalPages: result.totalPages || result.total_pages || 1,
        };
      }

      return { events, pagination };
    } catch (err) {
      return rejectWithValue(
        err?.response?.data?.message || "Không lấy được danh sách sự kiện"
      );
    }
  }
);

const eventsSlice = createSlice({
  name: "events",
  initialState: {
    items: [], // danh sách sự kiện
    pagination: {
      page: 1,
      limit: 9,
      total: 0,
      totalPages: 1,
    },
    loading: false,
    error: null,
  },
  reducers: {
    // sau này nếu cần sort client-side, filter local... thì thêm reducer vào đây
  },
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
        state.error = action.payload;
      });
  },
});

export default eventsSlice;
export { fetchActiveEvents };
