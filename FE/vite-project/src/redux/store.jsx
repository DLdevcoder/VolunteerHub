import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice.jsx";
import eventSlice from "./slices/eventSlice.jsx";

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    events: eventSlice.reducer,
  },
});

export default store;
