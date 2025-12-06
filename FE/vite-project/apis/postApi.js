import { api } from "../api";

const postApi = {
  // Lấy danh sách bài đăng
  getEventPosts: async (eventId, params) => {
    const res = await api.get(`/posts/events/${eventId}`, { params });
    return res.data;
  },

  // Đăng bài
  createPost: async (eventId, payload) => {
    const res = await api.post(`/posts/events/${eventId}`, payload);
    return res.data;
  },

  // Xóa bài
  deletePost: async (postId) => {
    const res = await api.delete(`/posts/${postId}`);
    return res.data;
  },

  // --- CÁC HÀM CÒN THIẾU ĐỂ LIKE & COMMENT CHẠY ĐƯỢC ---

  // Like/Unlike
  toggleLike: async (postId) => {
    // Gọi API: POST /reactions/posts/:post_id
    const res = await api.post(`/reactions/posts/${postId}`, { type: "like" });
    return res.data;
  },

  // Lấy danh sách Comment
  getComments: async (postId) => {
    // Gọi API: GET /comments/posts/:post_id
    const res = await api.get(`/comments/posts/${postId}`);
    return res.data;
  },

  // Viết Comment
  createComment: async (postId, content) => {
    // Gọi API: POST /comments/posts/:post_id
    const res = await api.post(`/comments/posts/${postId}`, { content });
    return res.data;
  },
};

export default postApi;
