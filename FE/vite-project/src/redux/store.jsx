import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice.jsx";
import eventSlice from "./slices/eventSlice.jsx";
import userSlice from "./slices/userSlice.jsx";

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    events: eventSlice.reducer,
    user: userSlice.reducer,
  },
});

export default store;
