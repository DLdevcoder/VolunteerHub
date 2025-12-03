import { Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/AppLayout/AppLayout";

import LoginForm from "./components/LoginForm/LoginForm";
import RegisterForm from "./components/RegisterForm/RegisterForm";
import ResetPassword from "./components/ResetPassword/ResetPassword";

import EventsPage from "./pages/EventsPage";
import HistoryPage from "./pages/HistoryPage";
import DashboardPage from "./pages/DashboardPage";

import Profile from "./components/Profile/Profile";
import NotificationsPage from "./pages/NotificationsPage";

import ManagerCreateEvent from "./components/manager/ManagerCreateEvent/ManagerCreateEvent";
import ManagerMyEvents from "./components/manager/ManagerMyEvents/ManagerMyEvents";

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/profile" element={<Profile />} />

      <Route path="/" element={<AppLayout />}>
        <Route index element={<Navigate to="/events" />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="notifications" element={<NotificationsPage />} />

        {/* Manager routes */}
        <Route path="manager">
          <Route path="events" element={<ManagerMyEvents />} />
          <Route path="events/create" element={<ManagerCreateEvent />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default App;
