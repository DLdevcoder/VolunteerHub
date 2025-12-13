import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Row,
  Col,
  Spin,
  Empty,
  Button,
  Modal,
  Tag,
  Tooltip,
  Input,
  // Bỏ import message từ antd ở đây
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
  FireFilled,
  EnvironmentOutlined,
  LineChartOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

import dashboardApi from "../../../apis/dashboardApi";

// SỬA ĐƯỜNG DẪN IMPORT (chỉ dùng ../../)
import {
  approveEventThunk,
  rejectEventThunk,
} from "../../redux/slices/eventSlice";

import useGlobalMessage from "../../utils/hooks/useGlobalMessage"; // Import hook thông báo

import "./Dashboard.css";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage(); // Khởi tạo messageApi

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal reject state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);

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
      await dispatch(approveEventThunk(id)).unwrap();
      messageApi.success("Đã duyệt sự kiện!"); // Dùng messageApi
      fetchData();
    } catch (error) {
      const errMsg = error?.message || "Lỗi khi duyệt sự kiện";
      messageApi.error(errMsg); // Dùng messageApi
    }
  };

  const openRejectModal = (ev) => {
    setRejectingEvent(ev);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    const reason = rejectReason.trim();
    
    // Logic hiển thị cảnh báo giống ảnh bạn gửi
    if (!reason || reason.length < 5) {
      messageApi.warning("Lý do cần ít nhất 5 ký tự"); // Dùng messageApi sẽ hiện thông báo chuẩn
      return;
    }
    
    if (!rejectingEvent) return;

    const eventId = rejectingEvent.event_id;

    try {
      setRejectLoading(true);
      await dispatch(rejectEventThunk({ eventId, reason })).unwrap();

      messageApi.success("Đã từ chối sự kiện!"); // Dùng messageApi
      
      setRejectModalOpen(false);
      setRejectingEvent(null);
      setRejectReason("");
      
      fetchData();
    } catch (error) {
      const errMsg = error?.message || "Lỗi khi từ chối sự kiện";
      messageApi.error(errMsg); // Dùng messageApi
    } finally {
      setRejectLoading(false);
    }
  };

  const handleRejectCancel = () => {
    setRejectModalOpen(false);
    setRejectingEvent(null);
    setRejectReason("");
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
                    <Link 
                      to={`/events/${ev.event_id}`}
                      style={{ fontWeight: "bold", color: "#1890ff", fontSize: "15px" }}
                    >
                      {index + 1}. {ev.title}""
                    </Link>
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
                      onClick={() => openRejectModal(ev)}
                    >
                      TỪ CHỐI
                    </Button>
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
                <Link
                  to={`/events/${ev.event_id}`}
                  key={ev.event_id}
                  style={{ display: 'block', textDecoration: 'none' }}
                >
                  <div
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

                    <div className="text-bold" style={{ fontSize: 15, color: "#cf1322" }}>
                      "{ev.title}"
                    </div>

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
                </Link>
              ))}

              {!data?.trending_events?.length && (
                <Empty description="Chưa có dữ liệu trending" />
              )}
            </div>
          </div>
        </Col>
      </Row>

      {/* Modal từ chối sự kiện */}
      <Modal
        title={
          rejectingEvent
            ? `Từ chối sự kiện: "${rejectingEvent.title}"`
            : "Từ chối sự kiện"
        }
        open={rejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={handleRejectCancel}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        confirmLoading={rejectLoading}
        okButtonProps={{ danger: false }}
      >
        <p>Nhập lý do từ chối:</p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={500}
          showCount
          placeholder="Ví dụ: Nội dung sự kiện chưa rõ ràng, cần bổ sung thông tin chi tiết..."
          style={{ marginTop: 4, marginBottom: 24 }}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;