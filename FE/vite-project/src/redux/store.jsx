import { configureStore } from "@reduxjs/toolkit";
import authSlice from "./slices/authSlice.jsx";
import eventSlice from "./slices/eventSlice.jsx";
import userSlice from "./slices/userSlice.jsx";
import notificationSlice from "./slices/notificationSlice.jsx";
import registrationSlice from "./slices/registrationSlice.jsx";
import postSlice from "./slices/postSlice.jsx";

const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    events: eventSlice.reducer,
    user: userSlice.reducer,
    notification: notificationSlice.reducer,
    registration: registrationSlice.reducer,
    posts: postSlice.reducer,
  },
});

export default store;
