import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authApi from "../../../apis/authApi";

// read from localStorage
const savedToken = localStorage.getItem("vh_token");
const savedUser = localStorage.getItem("vh_user");

const initialState = {
  user: savedUser ? JSON.parse(savedUser) : null,
  token: savedToken || null,
  isAuthenticated: !!savedToken && !!savedUser,
  loading: false,
  error: null,
};

// thunk login
const loginThunk = createAsyncThunk(
  "auth/login",
  async ({ email, password }, thunkAPI) => {
    try {
      const res = await authApi.login({ email, password });

      if (!res.success) {
        return thunkAPI.rejectWithValue(res.message || "Login failed");
      }

      return res.data;
    } catch (error) {
      const msg = error?.response?.data?.message || "Error while logging in";
      return thunkAPI.rejectWithValue(msg);
    }
  }
);

// register thunk
const registerThunk = createAsyncThunk(
  "auth/register",
  async (payload, { rejectWithValue }) => {
    try {
      // payload = { email, password, full_name, phone, role_name }
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

        // lưu xuống localStorage
        localStorage.setItem("vh_token", token);
        localStorage.setItem("vh_user", JSON.stringify(user));
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed";
      })
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
      });
  },
});

export { loginThunk, registerThunk };
export default authSlice;
