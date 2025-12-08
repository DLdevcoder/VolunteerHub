// src/redux/selectors/registrationSelectors.js

// ==== VOLUNTEER SELECTORS ====

export const volunteerRegistrationStateSelector = (state) =>
  state.registration.volunteer;

export const volunteerRegisteringIdSelector = (state) =>
  state.registration.volunteer.registeringId;

export const volunteerRegistrationErrorSelector = (state) =>
  state.registration.volunteer.error;

// ==== MANAGER SELECTORS ====

// Whole manager branch
export const registrationManagerStateSelector = (state) =>
  state.registration.manager;

// For a specific event
export const managerRegistrationsByEventSelector = (eventId) => (state) =>
  state.registration.manager.byEvent[eventId] || {
    items: [],
    loading: false,
    error: null,
  };

export const managerUpdatingIdSelector = (state) =>
  state.registration.manager.updatingId;

export const managerRegistrationErrorSelector = (state) =>
  state.registration.manager.error;

export const registrationVolunteerSelector = (state) =>
  state.registration.volunteer;

export const registrationRegisteringIdSelector = (state) =>
  state.registration.volunteer.registeringId;
