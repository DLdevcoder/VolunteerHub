// Whole auth slice (if you ever need it)
export const authStateSelector = (state) => state.auth;

// Individual fields
export const authUserSelector = (state) => state.auth.user;
export const authTokenSelector = (state) => state.auth.token;
export const authIsAuthenticatedSelector = (state) =>
  state.auth.isAuthenticated;
export const authLoadingSelector = (state) => state.auth.loading;
export const authErrorSelector = (state) => state.auth.error;
export const authSuccessMessageSelector = (state) => state.auth.successMessage;
