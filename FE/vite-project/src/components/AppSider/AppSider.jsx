// src/components/AppSider/AppSider.jsx
import { useEffect, useState } from "react";
import { Layout, Menu } from "antd";
import {
  CalendarOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileAddOutlined,
  UnorderedListOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const { Sider } = Layout;

const AppSider = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const authUser = useSelector((state) => state.auth.user);
  const role = authUser?.role_name;

  // ✅ Control collapse state
  const [collapsed, setCollapsed] = useState(false);

  let selectedKey = "dashboard";
  if (path.startsWith("/history")) selectedKey = "history";
  else if (path.startsWith("/events")) selectedKey = "events";
  else if (path.startsWith("/dashboard")) selectedKey = "dashboard";
  else if (path.startsWith("/manager/events/create"))
    selectedKey = "manager-create-event";
  else if (path.startsWith("/manager/events"))
    selectedKey = "manager-my-events";
  else if (path.startsWith("/admin/event-requests"))
    selectedKey = "admin-event-requests";
  else if (path.startsWith("/admin/users")) selectedKey = "admin-users";
  else if (path.startsWith("/admin/export")) selectedKey = "admin-export";

  useEffect(() => {
    if (path === "/") navigate("/dashboard");
  }, [path, navigate]);

  const handleMenuClicked = ({ key }) => {
    if (key === "events") navigate("/events");
    if (key === "history") navigate("/history");
    if (key === "dashboard") navigate("/dashboard");

    if (key === "manager-create-event") navigate("/manager/events/create");
    if (key === "manager-my-events") navigate("/manager/events");

    if (key === "admin-event-requests") navigate("/admin/event-requests");
    if (key === "admin-users") navigate("/admin/users");
    if (key === "admin-export") navigate("/admin/export");
  };

  const dashboardItem = {
    key: "dashboard",
    icon: <AppstoreOutlined />,
    label: "Dashboard",
  };

  const volunteerItems = [
    dashboardItem,
    { key: "events", icon: <CalendarOutlined />, label: "Events" },
    { key: "history", icon: <HistoryOutlined />, label: "Lịch sử" },
  ];

  const managerGroup = {
    key: "manager",
    icon: <TeamOutlined />,
    label: "Manager",
    children: [
      {
        key: "manager-create-event",
        icon: <FileAddOutlined />,
        label: "Tạo event",
      },
      {
        key: "manager-my-events",
        icon: <UnorderedListOutlined />,
        label: "Event của tôi",
      },
    ],
  };

  const adminGroup = {
    key: "admin",
    icon: <TeamOutlined />,
    label: "Admin",
    children: [
      {
        key: "admin-event-requests",
        icon: <UnorderedListOutlined />,
        label: "Event requests",
      },
      { key: "admin-users", icon: <UserOutlined />, label: "Users" },
    ],
  };

  let items = [];
  let defaultOpenKeys = [];

  if (role === "Manager") {
    items = [dashboardItem, managerGroup];
    defaultOpenKeys = ["manager"];
  } else if (role === "Admin") {
    items = [dashboardItem, adminGroup];
    defaultOpenKeys = ["admin"];
  } else {
    items = volunteerItems;
    defaultOpenKeys = [];
  }

  return (
    <Sider
      className="app-sider-container"
      theme="light"
      width={240} // ✅ fixed width (important)
      collapsedWidth={64} // ✅ collapsed width (icon-only)
      collapsible // ✅ show trigger (hamburger)
      breakpoint="lg" // ✅ auto collapse below 992px
      collapsed={collapsed}
      onCollapse={(v) => setCollapsed(v)}
    >
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={defaultOpenKeys}
        onClick={handleMenuClicked}
        items={items}
        inlineCollapsed={collapsed} // ✅ makes submenu behave nicely
      />
    </Sider>
  );
};

export default AppSider;
