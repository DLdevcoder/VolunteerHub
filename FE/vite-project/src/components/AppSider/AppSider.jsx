import { Layout, Menu } from "antd";
import {
  CalendarOutlined,
  HistoryOutlined,
  AppstoreOutlined,
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
  }

  const handleMenuClicked = ({ key }) => {
    if (key === "events") navigate("/events");
    if (key === "history") navigate("/history");
    if (key === "dashboard") navigate("/dashboard");
  };

  return (
    <Sider className="app-sider-container" theme="light" width="15%">
      <Menu
        mode="inline"
        selectedKeys={[selectedKey]}
        onClick={handleMenuClicked}
        items={[
          { key: "events", icon: <CalendarOutlined />, label: "Events" },
          { key: "history", icon: <HistoryOutlined />, label: "Lịch sử" },
          { key: "dashboard", icon: <AppstoreOutlined />, label: "Dashboard" },
        ]}
      />
    </Sider>
  );
};

export default AppSider;
