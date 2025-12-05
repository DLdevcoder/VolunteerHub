// src/apis/postApi.js
import { api } from "../api";

const postApi = {
  // GET /posts/events/:event_id?page=&limit=
  async getEventPosts(eventId, params) {
    const res = await api.get(`/posts/events/${eventId}`, { params });
    return res.data; // { success, data: posts, pagination }
  },

  // POST /posts/events/:event_id
  async createPost(eventId, payload) {
    // payload: { content }
    const res = await api.post(`/posts/events/${eventId}`, payload);
    return res.data; // { success, message, data: { post } }
  },

  // DELETE /posts/:post_id
  async deletePost(postId) {
    const res = await api.delete(`/posts/${postId}`);
    return res.data; // { success, message }
  },
};

export default postApi;
