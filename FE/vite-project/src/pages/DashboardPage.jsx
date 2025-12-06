// src/pages/DashboardPage.jsx
import React from "react";
import { useSelector } from "react-redux";
import VolunteerDashboard from "../components/Dashboard/VolunteerDashboard";
import ManagerDashboard from "../components/Dashboard/ManagerDashboard";
import AdminDashboard from "../components/Dashboard/AdminDashboard"; // Import mới

const DashboardPage = () => {
  const { user } = useSelector((state) => state.auth);

  // Check role Admin
  if (user?.role_name === "Admin" || user?.role === "Admin") {
    return <AdminDashboard />;
  }

  // Check role Manager
  if (user?.role_name === "Manager" || user?.role === "Manager") {
    return <ManagerDashboard />;
  }

  // Default: Volunteer
  return <VolunteerDashboard />;
};

export default DashboardPage;
