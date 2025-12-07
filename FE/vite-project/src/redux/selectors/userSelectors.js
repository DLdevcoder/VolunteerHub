// basic "me" info
export const meSelector = (state) => state.user.me;
export const loadingMeSelector = (state) => state.user.loadingMe;
export const errorMeSelector = (state) => state.user.errorMe;
export const updatingMeSelector = (state) => state.user.updatingMe;

// admin user list
export const adminUsersSelector = (state) => state.user.admin.list;
export const adminPaginationSelector = (state) => state.user.admin.pagination;
export const adminLoadingListSelector = (state) => state.user.admin.loadingList;
export const adminErrorListSelector = (state) => state.user.admin.errorList;
