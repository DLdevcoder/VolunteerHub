// src/App.jsx
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
import EventDetailPage from "./pages/EventDetailPage";

import ManagerCreateEvent from "./components/manager/ManagerCreateEvent/ManagerCreateEvent";
import ManagerMyEvents from "./components/manager/ManagerMyEvents/ManagerMyEvents";
import ManagerEditEvent from "./components/manager/ManagerEditEvent/ManagerEditEvent";

import AdminEventRequests from "./components/admin/AdminEventRequests/AdminEventRequests";
import AdminUsers from "./components/admin/AdminUsers/AdminUsers";
import AdminExport from "./components/admin/AdminExport/AdminExport";
import AdminCreateUser from "./components/admin/AdminCreateUser/AdminCreateUser";

const App = () => {
  return (
    <Routes>
      {/* Auth pages (outside layout) */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Main app layout */}
      <Route path="/" element={<AppLayout />}>
        {/* 👇 Default when logged in: /dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Main pages */}
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:event_id" element={<EventDetailPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="profile" element={<Profile />} />

        {/* Manager routes */}
        <Route path="manager">
          <Route path="events" element={<ManagerMyEvents />} />
          <Route path="events/create" element={<ManagerCreateEvent />} />
          <Route path="events/:event_id/edit" element={<ManagerEditEvent />} />
        </Route>

        {/* Admin routes */}
        <Route path="admin">
          <Route path="event-requests" element={<AdminEventRequests />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="export" element={<AdminExport />} />
          <Route path="users/create" element={<AdminCreateUser />} />
        </Route>
      </Route>

      {/* Fallback: anything unknown -> dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
