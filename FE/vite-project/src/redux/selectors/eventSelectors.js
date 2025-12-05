// src/redux/selectors/eventSelectors.js

// ===== EVENT DETAIL =====
export const eventDetailSelector = (state) => state.events.detail.event;
export const eventDetailLoadingSelector = (state) =>
  state.events.detail.loading;
export const eventDetailErrorSelector = (state) => state.events.detail.error;

// ===== PUBLIC / VOLUNTEER: active events =====
export const activeEventsSelector = (state) => state.events.volunteer.items;

export const activeEventsPaginationSelector = (state) =>
  state.events.volunteer.pagination;

export const activeEventsLoadingSelector = (state) =>
  state.events.volunteer.loading;

export const activeEventsErrorSelector = (state) =>
  state.events.volunteer.error;

// ===== CATEGORIES =====
export const eventCategoriesSelector = (state) => state.events.categories;

export const eventCategoriesLoadingSelector = (state) =>
  state.events.categoriesLoading;

export const eventCategoriesErrorSelector = (state) =>
  state.events.categoriesError;

// ===== MANAGER: my events list =====
export const managerEventsSelector = (state) => state.events.manager.myEvents;

export const managerEventsPaginationSelector = (state) =>
  state.events.manager.myEventsPagination;

export const managerEventsLoadingSelector = (state) =>
  state.events.manager.myEventsLoading;

export const managerEventsErrorSelector = (state) =>
  state.events.manager.myEventsError;

// ===== MANAGER: create event =====
export const eventCreateLoadingSelector = (state) =>
  state.events.manager.createLoading;

export const eventCreateErrorSelector = (state) =>
  state.events.manager.createError;

export const lastCreatedEventSelector = (state) =>
  state.events.manager.lastCreatedEvent;

// ===== ADMIN: events (requests) =====
export const adminEventsSelector = (state) => state.events.admin.events;

export const adminEventsPaginationSelector = (state) =>
  state.events.admin.eventsPagination;

export const adminEventsLoadingSelector = (state) =>
  state.events.admin.eventsLoading;

export const adminEventsErrorSelector = (state) =>
  state.events.admin.eventsError;

export const adminActionErrorSelector = (state) =>
  state.events.admin.actionError;
