const meSelector = (state) => state.user.me;
const loadingMeSelector = (state) => state.user.loadingMe;

const adminUsersSelector = (state) => state.user.admin.list;
const adminPaginationSelector = (state) => state.user.admin.pagination;
const adminLoadingListSelector = (state) => state.user.admin.loadingList;
const adminErrorListSelector = (state) => state.user.admin.errorList;

export {
  meSelector,
  loadingMeSelector,
  adminUsersSelector,
  adminPaginationSelector,
  adminLoadingListSelector,
  adminErrorListSelector,
};
