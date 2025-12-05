import "./AppLayout.css";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";
import AppHeader from "../AppHeader/AppHeader";
import AppSider from "../AppSider/AppSider";

const { Content } = Layout;

const AppLayout = () => {
  return (
    <Layout className="app-layout-container">
      <AppHeader />
      <Layout>
        <AppSider />
        <Content className="app-layout-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
