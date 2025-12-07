import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Spin,
  Empty,
  Button,
  message,
  Modal,
  Tag,
  Tooltip,
} from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  StarFilled,
  LockOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowUpOutlined,
  DownloadOutlined,
  FileExcelOutlined,
  FireFilled,
  EnvironmentOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

import dashboardApi from "../../../apis/dashboardApi";
import eventApi from "../../../apis/eventApi";
import exportApi from "../../../apis/exportApi";

import "./Dashboard.css";

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [exportingEvents, setExportingEvents] = useState(false);
  const [exportingUsers, setExportingUsers] = useState(false);

  const fetchData = async () => {
    try {
      const res = await dashboardApi.getDashboard();
      if (res.success) setData(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await eventApi.approveEvent(id);
      message.success("Đã duyệt sự kiện!");
      fetchData();
    } catch (error) {
      message.error("Lỗi khi duyệt");
    }
  };

  const handleReject = (id) => {
    Modal.confirm({
      title: "Từ chối sự kiện này?",
      content: "Sự kiện sẽ bị hủy bỏ. Hành động này không thể hoàn tác.",
      okText: "Từ chối",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await eventApi.deleteEvent(id);
          message.success("Đã từ chối sự kiện!");
          fetchData();
        } catch (error) {
          message.error("Lỗi khi từ chối");
        }
      },
    });
  };

  const handleExportEvents = async () => {
    try {
      setExportingEvents(true);
      message.loading({
        content: "Đang tạo file báo cáo sự kiện...",
        key: "exportMsg",
      });
      const response = await exportApi.exportEvents("csv");
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `events_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({
        content: "Tải danh sách sự kiện thành công!",
        key: "exportMsg",
      });
    } catch (error) {
      console.error(error);
      message.error({ content: "Lỗi xuất dữ liệu.", key: "exportMsg" });
    } finally {
      setExportingEvents(false);
    }
  };

  const handleExportUsers = async () => {
    try {
      setExportingUsers(true);
      message.loading({
        content: "Đang xuất danh sách người dùng...",
        key: "exportUserMsg",
      });
      const response = await exportApi.exportUsers("csv");
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `users_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.success({
        content: "Tải danh sách người dùng thành công!",
        key: "exportUserMsg",
      });
    } catch (error) {
      console.error(error);
      message.error({
        content: "Lỗi xuất dữ liệu người dùng.",
        key: "exportUserMsg",
      });
    } finally {
      setExportingUsers(false);
    }
  };

  if (loading)
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div className="dashboard-container">
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <div className="stats-card stats-blue">
            <div className="stats-value">
              <UserOutlined /> {data?.stats?.total_users || 0}
            </div>
            <div className="stats-label">Người dùng</div>
            <div className="text-xs" style={{ color: "#52c41a", marginTop: 4 }}>
              <ArrowUpOutlined /> +{data?.stats?.new_users_24h || 0}/ngày
            </div>
          </div>
        </Col>

        <Col span={6}>
          <div className="stats-card stats-green">
            <div className="stats-value">
              <CalendarOutlined /> {data?.stats?.total_events || 0}
            </div>
            <div className="stats-label">Sự kiện</div>
            <div className="text-xs" style={{ color: "#52c41a", marginTop: 4 }}>
              <ArrowUpOutlined /> +{data?.stats?.new_events_24h || 0}/ngày
            </div>
          </div>
        </Col>

        <Col span={6}>
          <div className="stats-card stats-orange">
            <div className="stats-value">
              <ClockCircleOutlined /> {data?.stats?.pending_events || 0}
            </div>
            <div className="stats-label">Chờ duyệt</div>
            <div className="text-xs" style={{ color: "#faad14", marginTop: 4 }}>
              Cần xử lý gấp
            </div>
          </div>
        </Col>

        <Col span={6}>
          <div className="stats-card stats-red">
            <div className="stats-value">
              <LockOutlined /> {data?.stats?.locked_users || 0}
            </div>
            <div className="stats-label">Tài khoản khóa</div>
            <div className="text-xs" style={{ color: "#cf1322", marginTop: 4 }}>
              +{data?.stats?.new_locked_24h || 0} gần đây
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* Pending events */}
        <Col xs={24} md={12}>
          <div className="dashboard-section">
            <div className="section-header header-yellow">
              <ClockCircleOutlined /> SỰ KIỆN CHỜ DUYỆT (
              {data?.pending_events?.length || "đã duyệt hết sự kiện"})
            </div>

            <div className="section-body custom-scroll">
              {data?.pending_events?.map((ev, index) => (
                <div key={ev.event_id} className="dashboard-item pending-item">
                  <div
                    style={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <span style={{ fontWeight: "bold" }}>
                      #{index + 1}. "{ev.title}"
                    </span>
                    <Tag color="orange">Chờ {ev.days_waiting} ngày</Tag>
                  </div>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#666",
                      margin: "8px 0",
                      lineHeight: 1.6,
                    }}
                  >
                    <div>
                      <UserOutlined /> {ev.manager_name} | <TeamOutlined />{" "}
                      {ev.current_participants}/{ev.target_participants}
                    </div>
                    <div>
                      <CalendarOutlined />{" "}
                      {new Date(ev.start_date).toLocaleDateString("vi-VN")} |{" "}
                      <EnvironmentOutlined /> {ev.location}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <Button
                      type="primary"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={() => handleApprove(ev.event_id)}
                    >
                      DUYỆT
                    </Button>
                    <Button
                      danger
                      size="small"
                      icon={<CloseOutlined />}
                      onClick={() => handleReject(ev.event_id)}
                    >
                      TỪ CHỐI
                    </Button>
                    <Link to={`/events/${ev.event_id}`}>
                      <Button size="small">Xem chi tiết</Button>
                    </Link>
                  </div>
                </div>
              ))}

              {!data?.pending_events?.length && (
                <Empty description="Hết việc! Không còn sự kiện chờ duyệt" />
              )}
            </div>
          </div>
        </Col>

        {/* Trending events */}
        <Col xs={24} md={12}>
          <div className="dashboard-section">
            <div className="section-header header-red">
              <FireFilled /> SỰ KIỆN THU HÚT
            </div>

            <div className="section-body custom-scroll">
              {data?.trending_events?.map((ev, index) => (
                <div
                  key={ev.event_id}
                  className={`dashboard-item trending-item ${
                    index === 0 ? "rank-1" : ""
                  }`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <Tag
                      color={
                        index === 0 ? "red" : index === 1 ? "volcano" : "gold"
                      }
                    >
                      {index === 0
                        ? "TOP 1"
                        : index === 1
                          ? "TOP 2"
                          : `TOP ${index + 1}`}
                    </Tag>

                    <Tooltip title="Điểm tương tác">
                      <Tag color="gold">
                        <StarFilled /> {ev.engagement_score}đ
                      </Tag>
                    </Tooltip>
                  </div>

                  <Link
                    to={`/events/${ev.event_id}`}
                    className="text-bold"
                    style={{ fontSize: 15, color: "#cf1322" }}
                  >
                    "{ev.title}"
                  </Link>

                  <div
                    style={{
                      fontSize: 13,
                      color: "#666",
                      marginTop: 4,
                      marginBottom: 8,
                    }}
                  >
                    <UserOutlined /> {ev.manager_name} | <TeamOutlined />{" "}
                    <b>
                      {ev.current_participants}/{ev.target_participants}
                    </b>
                  </div>

                  <div className="growth-box">
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      <LineChartOutlined /> TĂNG TRƯỞNG 24H:
                    </div>

                    <Row gutter={4} className="text-xs">
                      <Col span={12} style={{ color: "#389e0d" }}>
                        <ArrowUpOutlined /> +{ev.new_participants_24h} người
                      </Col>
                      <Col span={12} style={{ color: "#096dd9" }}>
                        <ArrowUpOutlined /> +{ev.new_posts_24h} bài
                      </Col>
                    </Row>
                  </div>
                </div>
              ))}

              {!data?.trending_events?.length && (
                <Empty description="Chưa có dữ liệu trending" />
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* EXPORT AREA */}
      <div
        className="dashboard-section"
        style={{ height: "auto", padding: 20 }}
      >
        <h4 style={{ fontSize: 16, fontWeight: "bold", marginBottom: 15 }}>
          <DownloadOutlined /> XUẤT DỮ LIỆU HỆ THỐNG
        </h4>

        <div style={{ display: "flex", gap: 15 }}>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            size="large"
            onClick={handleExportEvents}
            loading={exportingEvents}
          >
            {exportingEvents
              ? "Đang tạo file..."
              : "Xuất danh sách Sự kiện (CSV)"}
          </Button>

          <Button
            icon={<FileExcelOutlined />}
            size="large"
            onClick={handleExportUsers}
            loading={exportingUsers}
          >
            {exportingUsers
              ? "Đang tạo file..."
              : "Xuất danh sách Người dùng (CSV)"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
