import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Spin, Empty, Button, Modal, Tag, Input } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  LockOutlined,
  CheckOutlined,
  CloseOutlined,
  ArrowUpOutlined,
  FireFilled,
  EnvironmentOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import dashboardApi from "../../../apis/dashboardApi";
import {
  approveEventThunk,
  rejectEventThunk,
} from "../../redux/slices/eventSlice";

import useGlobalMessage from "../../utils/hooks/useGlobalMessage";
import "./Dashboard.css";

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

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
      messageApi.success("Đã duyệt sự kiện!");
      fetchData();
    } catch (error) {
      messageApi.error(error?.message || "Lỗi khi duyệt sự kiện");
    }
  };

  const openRejectModal = (ev) => {
    setRejectingEvent(ev);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    const reason = rejectReason.trim();
    if (!reason || reason.length < 5) {
      messageApi.warning("Lý do cần ít nhất 5 ký tự");
      return;
    }
    if (!rejectingEvent) return;

    try {
      setRejectLoading(true);
      await dispatch(
        rejectEventThunk({
          eventId: rejectingEvent.event_id,
          reason,
        })
      ).unwrap();
      messageApi.success("Đã từ chối sự kiện!");
      setRejectModalOpen(false);
      setRejectingEvent(null);
      setRejectReason("");
      fetchData();
    } catch (error) {
      messageApi.error(error?.message || "Lỗi khi từ chối sự kiện");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleRejectCancel = () => {
    setRejectModalOpen(false);
    setRejectingEvent(null);
    setRejectReason("");
  };

  const tabs = [
    { label: "CHỜ DUYỆT", icon: <ClockCircleOutlined />, key: "pending" },
    { label: "XU HƯỚNG", icon: <FireFilled />, key: "trending" },
  ];

  const renderContent = () => {
    let content = null;
    let headerText = "";
    let HeaderIcon = null;

    if (currentViewIndex === 0) {
      headerText = `Danh sách chờ duyệt (${data?.pending_events?.length || 0})`;
      HeaderIcon = ClockCircleOutlined;

      content = data?.pending_events?.map((ev, index) => (
        <div key={ev.event_id} className="dashboard-item pending-item">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div
              style={{ cursor: "pointer", flex: 1, paddingRight: 20 }}
              onClick={() => navigate(`/events/${ev.event_id}`)}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <Tag color="#3674B5" style={{ margin: 0, fontSize: 14, padding: "4px 10px" }}>
                  #{index + 1}
                </Tag>
                <span style={{ fontSize: 14, color: "#888" }}>
                  Đã chờ <b>{ev.days_waiting}</b> ngày
                </span>
              </div>

              <div
                className="text-bold"
                style={{ fontSize: 20, color: "#3674B5", marginBottom: 12, lineHeight: 1.4 }}
              >
                {ev.title}
              </div>

              <div
                className="text-sm"
                style={{
                  color: "#555",
                  fontSize: 15,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span>
                  <UserOutlined /> Quản lý: <b>{ev.manager_name}</b>
                </span>
                <span>
                  <TeamOutlined /> Quy mô:{" "}
                  <b>
                    {ev.current_participants}/{ev.target_participants}
                  </b>{" "}
                  người
                </span>
                <span>
                  <EnvironmentOutlined /> Địa điểm: {ev.location}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 140 }}>
              <Button
                type="primary"
                size="large"
                icon={<CheckOutlined />}
                block
                style={{ height: 40, fontSize: 15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleApprove(ev.event_id);
                }}
              >
                Duyệt
              </Button>
              <Button
                danger
                size="large"
                icon={<CloseOutlined />}
                block
                style={{ height: 40, fontSize: 15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  openRejectModal(ev);
                }}
              >
                Từ chối
              </Button>
            </div>
          </div>
        </div>
      ));

      if (!data?.pending_events?.length) {
        content = <Empty description="Hết việc! Không còn sự kiện chờ duyệt" />;
      }
    } else {
      headerText = "Sự kiện thu hút";
      HeaderIcon = FireFilled;

      content = data?.trending_events?.map((ev, index) => (
        <div
          key={ev.event_id}
          className="dashboard-item trending-item"
          style={{ cursor: "pointer" }}
          onClick={() => navigate(`/events/${ev.event_id}`)}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ flex: 1 }}>
              <div style={{ marginBottom: 10 }}>
                <Tag
                  color={index === 0 ? "#f5222d" : "#3674B5"}
                  style={{ fontSize: 14, padding: "4px 10px" }}
                >
                  {index === 0 ? "TOP 1" : `TOP ${index + 1}`}
                </Tag>
              </div>

              <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
                {ev.title}
              </div>

              <div style={{ fontSize: 15, color: "#666", marginBottom: 10 }}>
                <UserOutlined /> {ev.manager_name} | <TeamOutlined />{" "}
                <b>
                  {ev.current_participants}/{ev.target_participants}
                </b>
              </div>

              <div style={{ fontSize: 14, display: "flex", gap: 16 }}>
                <span style={{ color: "#389e0d", fontWeight: 600 }}>
                  <ArrowUpOutlined /> +{ev.new_participants_24h} người
                </span>
                <span style={{ color: "#3674B5", fontWeight: 600 }}>
                  <ArrowUpOutlined /> +{ev.new_posts_24h} bài
                </span>
              </div>
            </div>

            <div
              style={{
                textAlign: "center",
                paddingLeft: 30,
                borderLeft: "1px solid #eee",
                minWidth: 120,
              }}
            >
              <div style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>
                Engagement
              </div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: "bold",
                  color: "#578FCA",
                  lineHeight: 1,
                }}
              >
                {ev.engagement_score}
              </div>
              <StarFilled style={{ color: "#ffec3d", fontSize: 20, marginTop: 5 }} />
            </div>
          </div>
        </div>
      ));

      if (!data?.trending_events?.length) {
        content = <Empty description="Chưa có dữ liệu trending" />;
      }
    }

    return (
      <div className="dashboard-section animation-fade-in">
        <div className="section-header">
          <HeaderIcon /> {headerText}
        </div>
        <div className="section-grid">{content}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="stats-grid-container">
        <div className="stats-card-modern card-theme-1">
          <div className="stats-left">
            <span className="stats-title">Tổng người dùng</span>
            <span className="stats-number">{data?.stats?.total_users || 0}</span>
          </div>
          <div className="stats-icon-bg">
            <UserOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-2">
          <div className="stats-left">
            <span className="stats-title">Tổng sự kiện</span>
            <span className="stats-number">{data?.stats?.total_events || 0}</span>
          </div>
          <div className="stats-icon-bg">
            <CalendarOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-3">
          <div className="stats-left">
            <span className="stats-title">Đang chờ duyệt</span>
            <span className="stats-number">{data?.stats?.pending_events || 0}</span>
          </div>
          <div className="stats-icon-bg">
            <ClockCircleOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-4">
          <div className="stats-left">
            <span className="stats-title">Tài khoản khóa</span>
            <span className="stats-number">{data?.stats?.locked_users || 0}</span>
          </div>
          <div className="stats-icon-bg">
            <LockOutlined />
          </div>
        </div>
      </div>

      <div className="custom-tabs-container">
        <div className="custom-tabs">
          <div
            className={`tab-glider ${
              currentViewIndex === 0 ? "tab-theme-blue" : "tab-theme-dark"
            }`}
            style={{
              width: "calc((100% - 8px) / 2)",
              transform: `translateX(${currentViewIndex * 100}%)`,
            }}
          />
          {tabs.map((tab, index) => (
            <button
              key={tab.key}
              className={`tab-btn ${currentViewIndex === index ? "active" : ""}`}
              onClick={() => setCurrentViewIndex(index)}
            >
              <span style={{ marginRight: 6 }}>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>{renderContent()}</div>

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
      >
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={500}
          showCount
          placeholder="Ví dụ: Nội dung chưa phù hợp, thiếu thông tin địa điểm..."
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;
