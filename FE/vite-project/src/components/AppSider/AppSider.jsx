// src/components/AppSider/AppSider.jsx (or wherever your file is)
import { Layout, Menu } from "antd";
import {
  CalendarOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileAddOutlined,
  UnorderedListOutlined,
  UserOutlined,
  FileExcelOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const { Sider } = Layout;

const AppSider = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  // ====== get current role from auth ======
  const authUser = useSelector((state) => state.auth.user);
  const role = authUser?.role_name; // 'Volunteer' | 'Manager' | 'Admin' | undefined

  // ====== selected key detection ======
  let selectedKey = "events";

  if (path.startsWith("/history")) {
    selectedKey = "history";
  } else if (path.startsWith("/dashboard")) {
    selectedKey = "dashboard";
  } else if (path.startsWith("/manager/events/create")) {
    selectedKey = "manager-create-event";
  } else if (path.startsWith("/manager/events")) {
    selectedKey = "manager-my-events";
  } else if (path.startsWith("/admin/event-requests")) {
    selectedKey = "admin-event-requests";
  } else if (path.startsWith("/admin/users")) {
    selectedKey = "admin-users";
  } else if (path.startsWith("/admin/export")) {
    selectedKey = "admin-export";
  }

  // ====== navigation handler ======
  const handleMenuClicked = ({ key }) => {
    // Volunteer / common
    if (key === "events") navigate("/events");
    if (key === "history") navigate("/history");
    if (key === "dashboard") navigate("/dashboard");

    // Manager
    if (key === "manager-create-event") navigate("/manager/events/create");
    if (key === "manager-my-events") navigate("/manager/events");

    // Admin
    if (key === "admin-event-requests") navigate("/admin/event-requests");
    if (key === "admin-users") navigate("/admin/users");
    if (key === "admin-export") navigate("/admin/export");
  };

  // ====== build menu items based on role ======

  // volunteer (or unknown) menu
  const volunteerItems = [
    { key: "events", icon: <CalendarOutlined />, label: "Events" },
    { key: "history", icon: <HistoryOutlined />, label: "Lịch sử" },
    { key: "dashboard", icon: <AppstoreOutlined />, label: "Dashboard" },
  ];

  // manager group
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

  // admin group
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
      {
        key: "admin-users",
        icon: <UserOutlined />,
        label: "Users",
      },
      {
        key: "admin-export",
        icon: <FileExcelOutlined />,
        label: "Export",
      },
    ],
  };

  let items = [];
  let defaultOpenKeys = [];

  if (role === "Manager") {
    // Managers: only Manager tabs + Dashboard
    items = [
      { key: "dashboard", icon: <AppstoreOutlined />, label: "Dashboard" },
      managerGroup,
    ];
    defaultOpenKeys = ["manager"];
  } else if (role === "Admin") {
    // Admins: only Admin tabs + Dashboard
    items = [
      { key: "dashboard", icon: <AppstoreOutlined />, label: "Dashboard" },
      adminGroup,
    ];
    defaultOpenKeys = ["admin"];
  } else {
    // Volunteers (or not logged in): Events + History + Dashboard
    items = volunteerItems;
    defaultOpenKeys = []; // no group to auto-open
  }

  return (
    <Sider className="app-sider-container" theme="light" width="15%">
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={defaultOpenKeys}
        onClick={handleMenuClicked}
        items={items}
      />
    </Sider>
  );
};

export default AppSider;
