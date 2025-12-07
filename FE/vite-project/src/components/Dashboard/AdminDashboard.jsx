import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  List,
  Avatar,
} from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  UserOutlined,
  FireOutlined,
  ArrowRightOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import dashboardApi from "../../../apis/dashboardApi";
import "./VolunteerDashboard.css"; // Tái sử dụng container chung

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getDashboard();
        if (res.success) setData(res.data);
      } catch (error) {
        console.error("Lỗi tải dashboard admin:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        Đang tải dữ liệu quản trị...
      </div>
    );

  // --- Cấu hình cột cho bảng "Sự kiện mới" ---
  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
      render: (text, record) => (
        <Link
          to={`/events/${record.event_id}`}
          style={{ fontWeight: "bold", color: "#1890ff" }}
        >
          {text}
        </Link>
      ),
    },
    {
      title: "Người tạo",
      dataIndex: "manager_name",
      key: "manager_name",
      render: (text) => <span style={{ color: "#555" }}>{text}</span>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "start_date",
      key: "start_date",
      render: (date) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "approval_status",
      key: "approval_status",
      render: (status) => {
        let color = "geekblue";
        let label = "Đang xử lý";
        if (status === "approved") {
          color = "green";
          label = "Đã duyệt";
        }
        if (status === "pending") {
          color = "orange";
          label = "Chờ duyệt";
        }
        if (status === "rejected") {
          color = "red";
          label = "Từ chối";
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <Link to={`/events/${record.event_id}`}>
          <Button size="small">Chi tiết</Button>
        </Link>
      ),
    },
  ];

  return (
    <div className="dashboard-container">
      <div
        className="dashboard-content"
        style={{ display: "block", maxWidth: 1400 }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: "bold",
            marginBottom: 24,
            color: "#1a1a1a",
          }}
        >
          Tổng quan hệ thống
        </h1>

        {/* --- PHẦN 1: THỐNG KÊ NHANH (CARDS) --- */}
        <Row gutter={[16, 16]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              className="shadow-sm"
              style={{ borderRadius: 8 }}
            >
              <Statistic
                title="Sự kiện chờ duyệt"
                value={data?.quick_stats?.pending_events || 0}
                valueStyle={{ color: "#faad14", fontWeight: "bold" }}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              className="shadow-sm"
              style={{ borderRadius: 8 }}
            >
              <Statistic
                title="Đăng ký chờ duyệt"
                value={data?.quick_stats?.pending_registrations || 0}
                valueStyle={{ color: "#1890ff", fontWeight: "bold" }}
                prefix={<UserOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              className="shadow-sm"
              style={{ borderRadius: 8 }}
            >
              <Statistic
                title="Sắp diễn ra"
                value={data?.quick_stats?.upcoming_events || 0}
                valueStyle={{ color: "#52c41a", fontWeight: "bold" }}
                prefix={<CalendarOutlined />}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card
              bordered={false}
              className="shadow-sm"
              style={{ borderRadius: 8 }}
            >
              <Statistic
                title="User hoạt động"
                value={data?.quick_stats?.active_users || 0}
                valueStyle={{ color: "#722ed1", fontWeight: "bold" }}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={24}>
          {/* --- CỘT TRÁI: DANH SÁCH SỰ KIỆN MỚI (DẠNG BẢNG) --- */}
          <Col xs={24} lg={16}>
            <Card
              title={
                <span style={{ fontSize: 16, fontWeight: "bold" }}>
                  📌 Sự kiện mới cập nhật
                </span>
              }
              bordered={false}
              style={{ borderRadius: 10, minHeight: 500 }}
              extra={<Link to="/admin/events">Xem tất cả</Link>}
            >
              <Table
                columns={columns}
                dataSource={data?.new_events}
                rowKey="event_id"
                pagination={false}
                size="middle"
              />
            </Card>
          </Col>

          {/* --- CỘT PHẢI: TOP SỰ KIỆN HOT (DẠNG LIST) --- */}
          <Col xs={24} lg={8}>
            <Card
              title={
                <span
                  style={{ fontSize: 16, fontWeight: "bold", color: "#cf1322" }}
                >
                  <FireOutlined /> Sự kiện thu hút nhất
                </span>
              }
              bordered={false}
              style={{ borderRadius: 10, minHeight: 500 }}
            >
              <List
                itemLayout="horizontal"
                dataSource={data?.trending_events}
                renderItem={(item, index) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div
                          style={{
                            width: 30,
                            height: 30,
                            borderRadius: "50%",
                            background: index < 3 ? "#ffec3d" : "#f0f0f0",
                            color: index < 3 ? "#d48806" : "#555",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: "bold",
                          }}
                        >
                          {index + 1}
                        </div>
                      }
                      title={
                        <Link
                          to={`/events/${item.event_id}`}
                          style={{ color: "#333" }}
                        >
                          {item.title}
                        </Link>
                      }
                      description={
                        <div style={{ fontSize: 12 }}>
                          <span style={{ marginRight: 8 }}>
                            👤 {item.manager_name}
                          </span>
                          <span style={{ color: "#fa541c" }}>
                            ★ {item.engagement_score} điểm
                          </span>
                        </div>
                      }
                    />
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 12, color: "#888" }}>
                        {item.current_participants} người
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default AdminDashboard;
