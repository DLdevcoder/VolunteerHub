import React from "react";
import VolunteerDashboard from "../components/Dashboard/VolunteerDashboard";

const DashboardPage = () => {
  // Có thể thêm logic check role ở đây nếu muốn hiển thị Dashboard khác cho Admin/Manager
  // Ví dụ: return user.role === 'Admin' ? <AdminDashboard /> : <VolunteerDashboard />;

  return <VolunteerDashboard />;
};

export default DashboardPage;
