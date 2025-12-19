// src/components/AppSider/AppSider.jsx
import { useEffect } from "react"; // Import thêm useEffect
import { Layout, Menu } from "antd";
import {
  CalendarOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileAddOutlined,
  UnorderedListOutlined,
  UserOutlined,
  // FileExcelOutlined,
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
  // MẶC ĐỊNH: Đổi thành 'dashboard' thay vì 'events'
  let selectedKey = "dashboard";

  if (path.startsWith("/history")) {
    selectedKey = "history";
  } else if (path.startsWith("/events")) {
    // Thêm check cho events vì giờ mặc định là dashboard
    selectedKey = "events";
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

  // ====== Auto redirect to dashboard if at root '/' ======
  // Logic này đảm bảo khi vừa login xong (thường về '/') sẽ nhảy sang dashboard
  useEffect(() => {
    if (path === "/") {
      navigate("/dashboard");
    }
  }, [path, navigate]);

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

  // 1. Tạo item Dashboard riêng để tái sử dụng
  const dashboardItem = { 
    key: "dashboard", 
    icon: <AppstoreOutlined />, 
    label: "Dashboard" 
  };

  // 2. Sắp xếp lại volunteerItems: Dashboard -> Events -> History
  const volunteerItems = [
    dashboardItem, // Đưa Dashboard lên đầu
    { key: "events", icon: <CalendarOutlined />, label: "Events" },
    { key: "history", icon: <HistoryOutlined />, label: "Lịch sử" },
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
      // {
      //   key: "admin-export",
      //   icon: <FileExcelOutlined />,
      //   label: "Export",
      // },
    ],
  };

  let items = [];
  let defaultOpenKeys = [];

  if (role === "Manager") {
    // Managers: Dashboard + Manager Group
    items = [
      dashboardItem,
      managerGroup,
    ];
    defaultOpenKeys = ["manager"];
  } else if (role === "Admin") {
    // Admins: Dashboard + Admin Group
    items = [
      dashboardItem,
      adminGroup,
    ];
    defaultOpenKeys = ["admin"];
  } else {
    // Volunteers (or not logged in): Dashboard + Events + History
    items = volunteerItems;
    defaultOpenKeys = []; 
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