// src/redux/selectors/postSelectors.js

export const eventPostsSelector = (state) => state.posts.items;

export const eventPostsPaginationSelector = (state) => state.posts.pagination;

export const eventPostsLoadingSelector = (state) => state.posts.loading;

export const eventPostsErrorSelector = (state) => state.posts.error;

export const createPostLoadingSelector = (state) => state.posts.creating;

export const createPostErrorSelector = (state) => state.posts.createError;

export const deletePostIdSelector = (state) => state.posts.deletingId;
