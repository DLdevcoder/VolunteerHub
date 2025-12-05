// src/redux/selectors/eventSelectors.js

/* ===== EVENT DETAIL ===== */
export const eventDetailSelector = (state) => {
  const detail = state.events.detail || {};
  return detail.data ?? detail.event ?? null;
};

export const eventDetailLoadingSelector = (state) =>
  state.events.detail?.loading;

export const eventDetailErrorSelector = (state) => state.events.detail?.error;

/* ===== VOLUNTEER: active events ===== */
export const activeEventsSelector = (state) => state.events.volunteer.items;
export const activeEventsPaginationSelector = (state) =>
  state.events.volunteer.pagination;
export const activeEventsLoadingSelector = (state) =>
  state.events.volunteer.loading;
export const activeEventsErrorSelector = (state) =>
  state.events.volunteer.error;

/* ===== CATEGORIES ===== */
export const eventCategoriesSelector = (state) =>
  state.events.categories?.items ?? state.events.categories ?? [];
export const eventCategoriesLoadingSelector = (state) =>
  state.events.categories?.loading ?? state.events.categoriesLoading ?? false;
export const eventCategoriesErrorSelector = (state) =>
  state.events.categories?.error ?? state.events.categoriesError ?? null;

/* ===== MANAGER: my events list ===== */
export const managerEventsSelector = (state) =>
  state.events.manager?.myEvents ?? state.events.myEvents ?? [];
export const managerEventsPaginationSelector = (state) =>
  state.events.manager?.pagination ??
  state.events.myEventsPagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };
export const managerEventsLoadingSelector = (state) =>
  state.events.manager?.loading ?? state.events.myEventsLoading ?? false;
export const managerEventsErrorSelector = (state) =>
  state.events.manager?.error ?? state.events.myEventsError ?? null;

/* ===== MANAGER: create event ===== */
export const eventCreateLoadingSelector = (state) =>
  state.events.manager?.createLoading ?? state.events.createLoading ?? false;
export const eventCreateErrorSelector = (state) =>
  state.events.manager?.createError ?? state.events.createError ?? null;
export const lastCreatedEventSelector = (state) =>
  state.events.manager?.lastCreatedEvent ??
  state.events.lastCreatedEvent ??
  null;

/* ===== MANAGER: update / delete event ===== */
export const eventUpdateLoadingSelector = (state) =>
  state.events.manager?.updateLoading ?? false;
export const eventDeleteLoadingSelector = (state) =>
  state.events.manager?.deleteLoading ?? false;

/* ===== ADMIN: events (requests) ===== */
export const adminEventsSelector = (state) =>
  state.events.admin?.events ?? state.events.adminEvents ?? [];
export const adminEventsPaginationSelector = (state) =>
  state.events.admin?.pagination ??
  state.events.adminEventsPagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };
export const adminEventsLoadingSelector = (state) =>
  state.events.admin?.loading ?? state.events.adminEventsLoading ?? false;
export const adminEventsErrorSelector = (state) =>
  state.events.admin?.error ?? state.events.adminEventsError ?? null;
export const adminActionErrorSelector = (state) =>
  state.events.admin?.actionError ?? state.events.adminActionError ?? null;
