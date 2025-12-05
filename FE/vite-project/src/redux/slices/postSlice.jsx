// src/redux/slices/postSlice.js
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import postApi from "../../../apis/postApi";

// ===== THUNKS =====

// eventId, page, limit
export const fetchEventPostsThunk = createAsyncThunk(
  "posts/fetchEventPosts",
  async ({ eventId, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const res = await postApi.getEventPosts(eventId, { page, limit });
      if (!res?.success) {
        return rejectWithValue(res?.message || "Không tải được bài viết");
      }

      const posts = res.data || [];
      const pagination = res.pagination || {
        page,
        limit,
        total: posts.length,
        totalPages: 1,
      };

      return { posts, pagination };
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Không tải được bài viết";
      return rejectWithValue(msg);
    }
  }
);

export const createPostThunk = createAsyncThunk(
  "posts/createPost",
  async ({ eventId, content }, { rejectWithValue }) => {
    try {
      const res = await postApi.createPost(eventId, { content });
      if (!res?.success) {
        return rejectWithValue(res?.message || "Không thể đăng bài");
      }
      return res.data?.post;
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Không thể đăng bài";
      return rejectWithValue(msg);
    }
  }
);

export const deletePostThunk = createAsyncThunk(
  "posts/deletePost",
  async (postId, { rejectWithValue }) => {
    try {
      const res = await postApi.deletePost(postId);
      if (!res?.success) {
        return rejectWithValue(res?.message || "Không thể xóa bài");
      }
      return { postId };
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Không thể xóa bài";
      return rejectWithValue(msg);
    }
  }
);

// ===== STATE + SLICE =====

const initialState = {
  items: [],
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  loading: false,
  error: null,

  creating: false,
  createError: null,

  deletingId: null,
};

const postSlice = createSlice({
  name: "posts",
  initialState,
  reducers: {
    resetPostsState(state) {
      state.items = [];
      state.pagination = {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
      state.loading = false;
      state.error = null;
      state.creating = false;
      state.createError = null;
      state.deletingId = null;
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder
      .addCase(fetchEventPostsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEventPostsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.posts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchEventPostsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Không tải được bài viết";
      });

    // create
    builder
      .addCase(createPostThunk.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createPostThunk.fulfilled, (state, action) => {
        state.creating = false;
        const newPost = action.payload;
        if (newPost) {
          state.items = [newPost, ...state.items];
          // optional: tăng total
          state.pagination.total = (state.pagination.total || 0) + 1;
        }
      })
      .addCase(createPostThunk.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload || "Không thể đăng bài";
      });

    // delete
    builder
      .addCase(deletePostThunk.pending, (state, action) => {
        state.deletingId = action.meta.arg; // postId
      })
      .addCase(deletePostThunk.fulfilled, (state, action) => {
        const { postId } = action.payload || {};
        state.items = state.items.filter((p) => p.post_id !== postId);
        state.deletingId = null;
        if (state.pagination.total > 0) {
          state.pagination.total -= 1;
        }
      })
      .addCase(deletePostThunk.rejected, (state) => {
        state.deletingId = null;
      });
  },
});

export const { resetPostsState } = postSlice.actions;
export default postSlice;
