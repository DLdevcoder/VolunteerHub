const notificationsSelector = (state) => state.notification.list;
const notificationsPaginationSelector = (state) =>
  state.notification.pagination;

const unreadCountSelector = (state) => state.notification.unreadCount;

const recentNotificationsSelector = (state) => state.notification.recent;

const loadingNotificationsSelector = (state) => state.notification.loadingList;
const loadingRecentNotificationsSelector = (state) =>
  state.notification.loadingRecent;

export {
  notificationsSelector,
  notificationsPaginationSelector,
  unreadCountSelector,
  recentNotificationsSelector,
  loadingNotificationsSelector,
  loadingRecentNotificationsSelector,
};
