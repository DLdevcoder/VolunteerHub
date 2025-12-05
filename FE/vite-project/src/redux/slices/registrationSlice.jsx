// src/redux/slices/registrationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import registrationApi from "../../../apis/registrationApi";

/* =======================================================
   VOLUNTEER THUNKS
   ======================================================= */

// Volunteer đăng ký sự kiện
export const registerForEventThunk = createAsyncThunk(
  "registration/registerForEvent",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await registrationApi.registerForEvent(eventId);
      // res: { success, message, data? }
      if (!res?.success) {
        return rejectWithValue({
          eventId,
          message: res?.message || "Không thể đăng ký sự kiện",
        });
      }

      return {
        eventId,
        message: res?.message || "Đăng ký sự kiện thành công",
      };
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể đăng ký sự kiện";
      return rejectWithValue({ eventId, message: msg });
    }
  }
);

// Volunteer hủy đăng ký sự kiện
export const cancelRegistrationThunk = createAsyncThunk(
  "registration/cancelRegistration",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await registrationApi.cancelRegistration(eventId);
      if (!res?.success) {
        return rejectWithValue({
          eventId,
          message: res?.message || "Không thể hủy đăng ký sự kiện",
        });
      }

      return {
        eventId,
        message: res?.message || "Hủy đăng ký thành công",
      };
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Không thể hủy đăng ký sự kiện";
      return rejectWithValue({ eventId, message: msg });
    }
  }
);

/* =======================================================
   MANAGER THUNKS
   ======================================================= */

// Lấy danh sách đăng ký của 1 event
export const getEventRegistrationsThunk = createAsyncThunk(
  "registration/getEventRegistrations",
  async (eventId, { rejectWithValue }) => {
    try {
      const res = await registrationApi.getEventRegistrations(eventId);
      // backend: { success, message, data: list }
      if (!res?.success) {
        return rejectWithValue({
          eventId,
          message:
            res?.message || "Không thể tải danh sách đăng ký của sự kiện",
        });
      }

      const list = res.data || [];
      return { eventId, registrations: list };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        "Không thể tải danh sách đăng ký của sự kiện";
      return rejectWithValue({ eventId, message: msg });
    }
  }
);

// Duyệt 1 đơn
export const approveRegistrationThunk = createAsyncThunk(
  "registration/approveRegistration",
  async ({ registrationId, eventId }, { rejectWithValue }) => {
    try {
      const res = await registrationApi.approveRegistration(registrationId);
      if (!res?.success) {
        return rejectWithValue({
          registrationId,
          eventId,
          message: res?.message || "Không thể duyệt đăng ký",
        });
      }

      return {
        registrationId,
        eventId,
        message: res?.message || "Đã duyệt đăng ký thành công",
      };
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể duyệt đăng ký";
      return rejectWithValue({ registrationId, eventId, message: msg });
    }
  }
);

// Từ chối 1 đơn
export const rejectRegistrationThunk = createAsyncThunk(
  "registration/rejectRegistration",
  async ({ registrationId, eventId, reason }, { rejectWithValue }) => {
    try {
      const res = await registrationApi.rejectRegistration(
        registrationId,
        reason
      );
      if (!res?.success) {
        return rejectWithValue({
          registrationId,
          eventId,
          message: res?.message || "Không thể từ chối đăng ký",
        });
      }

      return {
        registrationId,
        eventId,
        message: res?.message || "Đã từ chối đăng ký",
      };
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể từ chối đăng ký";
      return rejectWithValue({ registrationId, eventId, message: msg });
    }
  }
);

// Đánh dấu hoàn thành
export const completeRegistrationThunk = createAsyncThunk(
  "registration/completeRegistration",
  async ({ registrationId, eventId }, { rejectWithValue }) => {
    try {
      const res = await registrationApi.completeRegistration(registrationId);
      if (!res?.success) {
        return rejectWithValue({
          registrationId,
          eventId,
          message: res?.message || "Không thể đánh dấu hoàn thành đăng ký",
        });
      }

      return {
        registrationId,
        eventId,
        message: res?.message || "Đã xác nhận hoàn thành cho tình nguyện viên",
      };
    } catch (err) {
      const msg =
        err?.response?.data?.message || "Không thể đánh dấu hoàn thành đăng ký";
      return rejectWithValue({ registrationId, eventId, message: msg });
    }
  }
);

/* =======================================================
   STATE SHAPE
   =======================================================

   state.registration = {
     volunteer: {
       registeringId: null,   // eventId hoặc "cancel-<eventId>"
       error: null,
     },
     manager: {
       byEvent: {
         [eventId]: {
           items: [...],
           loading: false,
           error: null,
         },
       },
       updatingId: null,      // registrationId đang duyệt / từ chối / complete
       error: null,
     },
   }
*/

const initialState = {
  volunteer: {
    registeringId: null,
    error: null,
  },
  manager: {
    byEvent: {}, // eventId -> { items, loading, error }
    updatingId: null,
    error: null,
  },
};

const registrationSlice = createSlice({
  name: "registration",
  initialState,
  reducers: {
    clearRegistrationError(state) {
      state.volunteer.error = null;
      state.manager.error = null;
      // không đụng tới error trong từng event
    },
  },
  extraReducers: (builder) => {
    /* ---------------- VOLUNTEER ---------------- */
    builder
      .addCase(registerForEventThunk.pending, (state, action) => {
        const eventId = action.meta.arg;
        state.volunteer.registeringId = eventId;
        state.volunteer.error = null;
      })
      .addCase(registerForEventThunk.fulfilled, (state) => {
        state.volunteer.registeringId = null;
      })
      .addCase(registerForEventThunk.rejected, (state, action) => {
        state.volunteer.registeringId = null;
        state.volunteer.error = action.payload?.message || action.error.message;
      })

      .addCase(cancelRegistrationThunk.pending, (state, action) => {
        const eventId = action.meta.arg;
        state.volunteer.registeringId = `cancel-${eventId}`;
        state.volunteer.error = null;
      })
      .addCase(cancelRegistrationThunk.fulfilled, (state) => {
        state.volunteer.registeringId = null;
      })
      .addCase(cancelRegistrationThunk.rejected, (state, action) => {
        state.volunteer.registeringId = null;
        state.volunteer.error = action.payload?.message || action.error.message;
      });

    /* ---------------- MANAGER: LIST ---------------- */

    builder
      .addCase(getEventRegistrationsThunk.pending, (state, action) => {
        const eventId = action.meta.arg;

        if (!state.manager.byEvent[eventId]) {
          state.manager.byEvent[eventId] = {
            items: [],
            loading: false,
            error: null,
          };
        }

        state.manager.byEvent[eventId].loading = true;
        state.manager.byEvent[eventId].error = null;
        state.manager.error = null;
      })
      .addCase(getEventRegistrationsThunk.fulfilled, (state, action) => {
        const { eventId, registrations } = action.payload;
        if (!state.manager.byEvent[eventId]) {
          state.manager.byEvent[eventId] = {
            items: [],
            loading: false,
            error: null,
          };
        }
        state.manager.byEvent[eventId].items = registrations;
        state.manager.byEvent[eventId].loading = false;
      })
      .addCase(getEventRegistrationsThunk.rejected, (state, action) => {
        const eventId = action.payload?.eventId || action.meta.arg;
        const message = action.payload?.message || action.error.message;

        if (!state.manager.byEvent[eventId]) {
          state.manager.byEvent[eventId] = {
            items: [],
            loading: false,
            error: null,
          };
        }
        state.manager.byEvent[eventId].loading = false;
        state.manager.byEvent[eventId].error = message;
        state.manager.error = message;
      });

    /* ---------------- MANAGER: APPROVE / REJECT / COMPLETE ---------------- */

    builder
      .addCase(approveRegistrationThunk.pending, (state, action) => {
        state.manager.updatingId = action.meta.arg.registrationId;
        state.manager.error = null;
      })
      .addCase(approveRegistrationThunk.fulfilled, (state, action) => {
        const { registrationId, eventId } = action.payload;
        state.manager.updatingId = null;

        const eventState = state.manager.byEvent[eventId];
        if (eventState?.items) {
          const idx = eventState.items.findIndex(
            (r) => r.registration_id === registrationId
          );
          if (idx !== -1) {
            eventState.items[idx] = {
              ...eventState.items[idx],
              status: "approved",
            };
          }
        }
      })
      .addCase(approveRegistrationThunk.rejected, (state, action) => {
        state.manager.updatingId = null;
        state.manager.error = action.payload?.message || action.error.message;
      })

      .addCase(rejectRegistrationThunk.pending, (state, action) => {
        state.manager.updatingId = action.meta.arg.registrationId;
        state.manager.error = null;
      })
      .addCase(rejectRegistrationThunk.fulfilled, (state, action) => {
        const { registrationId, eventId } = action.payload;
        state.manager.updatingId = null;

        const eventState = state.manager.byEvent[eventId];
        if (eventState?.items) {
          const idx = eventState.items.findIndex(
            (r) => r.registration_id === registrationId
          );
          if (idx !== -1) {
            eventState.items[idx] = {
              ...eventState.items[idx],
              status: "rejected",
            };
          }
        }
      })
      .addCase(rejectRegistrationThunk.rejected, (state, action) => {
        state.manager.updatingId = null;
        state.manager.error = action.payload?.message || action.error.message;
      })

      .addCase(completeRegistrationThunk.pending, (state, action) => {
        state.manager.updatingId = action.meta.arg.registrationId;
        state.manager.error = null;
      })
      .addCase(completeRegistrationThunk.fulfilled, (state, action) => {
        const { registrationId, eventId } = action.payload;
        state.manager.updatingId = null;

        const eventState = state.manager.byEvent[eventId];
        if (eventState?.items) {
          const idx = eventState.items.findIndex(
            (r) => r.registration_id === registrationId
          );
          if (idx !== -1) {
            eventState.items[idx] = {
              ...eventState.items[idx],
              status: "completed",
            };
          }
        }
      })
      .addCase(completeRegistrationThunk.rejected, (state, action) => {
        state.manager.updatingId = null;
        state.manager.error = action.payload?.message || action.error.message;
      });
  },
});

export const { clearRegistrationError } = registrationSlice.actions;
export default registrationSlice;
