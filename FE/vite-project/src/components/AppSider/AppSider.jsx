import { Layout, Menu } from "antd";
import {
  CalendarOutlined,
  HistoryOutlined,
  AppstoreOutlined,
  TeamOutlined,
  FileAddOutlined,
  UnorderedListOutlined,
} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router-dom";

const { Sider } = Layout;

const AppSider = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;

  let selectedKey = "events";

  if (path.startsWith("/history")) {
    selectedKey = "history";
  } else if (path.startsWith("/dashboard")) {
    selectedKey = "dashboard";
  } else if (path.startsWith("/manager/events/create")) {
    selectedKey = "manager-create-event";
  } else if (path.startsWith("/manager/events")) {
    selectedKey = "manager-my-events";
  }

  const handleMenuClicked = ({ key }) => {
    if (key === "events") navigate("/events");
    if (key === "history") navigate("/history");
    if (key === "dashboard") navigate("/dashboard");

    if (key === "manager-create-event") navigate("/manager/events/create");
    if (key === "manager-my-events") navigate("/manager/events");
  };

  return (
    <Sider className="app-sider-container" theme="light" width="15%">
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={["manager"]} // luôn mở nhóm Manager
        onClick={handleMenuClicked}
        items={[
          { key: "events", icon: <CalendarOutlined />, label: "Events" },
          { key: "history", icon: <HistoryOutlined />, label: "Lịch sử" },
          { key: "dashboard", icon: <AppstoreOutlined />, label: "Dashboard" },

          {
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
          },
        ]}
      />
    </Sider>
  );
};

export default AppSider;
