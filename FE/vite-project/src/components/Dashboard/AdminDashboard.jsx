import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import {
  Spin,
  Empty,
  Button,
  Modal,
  Tag,
  Tooltip,
  Input,
} from "antd";
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
  LineChartOutlined,
  StarFilled,
  StarOutlined,
} from "@ant-design/icons";
// 1. Thêm useNavigate
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate(); // 2. Init navigate

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State quản lý tab: 0 = Pending, 1 = Trending
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

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
      messageApi.success("Đã duyệt sự kiện!");
      fetchData();
    } catch (error) {
      const errMsg = error?.message || "Lỗi khi duyệt sự kiện";
      messageApi.error(errMsg);
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

    const eventId = rejectingEvent.event_id;
    try {
      setRejectLoading(true);
      await dispatch(rejectEventThunk({ eventId, reason })).unwrap();
      messageApi.success("Đã từ chối sự kiện!");
      setRejectModalOpen(false);
      setRejectingEvent(null);
      setRejectReason("");
      fetchData();
    } catch (error) {
      const errMsg = error?.message || "Lỗi khi từ chối sự kiện";
      messageApi.error(errMsg);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleRejectCancel = () => {
    setRejectModalOpen(false);
    setRejectingEvent(null);
    setRejectReason("");
  };

  // Cấu hình Tabs (Admin chỉ có 2 danh sách chính)
  const tabs = [
    { label: "CHỜ DUYỆT", icon: <ClockCircleOutlined />, key: "pending" },
    { label: "XU HƯỚNG", icon: <FireFilled />, key: "trending" },
  ];

  const renderContent = () => {
    let content = null;
    let headerClass = "";
    let headerText = "";
    let HeaderIcon = null;

    if (currentViewIndex === 0) {
      /* ================= TAB 1: PENDING ================= */
      headerClass = "header-yellow";
      headerText = `Sự kiện chờ duyệt (${data?.pending_events?.length || 0})`;
      HeaderIcon = ClockCircleOutlined;

      content = data?.pending_events?.map((ev, index) => (
        <div key={ev.event_id} className="dashboard-item pending-item">
          {/* Phần thông tin (Click để xem chi tiết) */}
          <div 
             style={{cursor: 'pointer'}} 
             onClick={() => navigate(`/events/${ev.event_id}`)}
             title="Xem chi tiết"
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Tag color="orange">#{index + 1} Pending</Tag>
              <span className="text-xs text-grey">Chờ {ev.days_waiting} ngày</span>
            </div>

            <div
              className="text-bold"
              style={{ fontSize: 16, color: "#1890ff", marginBottom: 8 }}
            >
              {ev.title}
            </div>

            <div className="text-sm text-grey" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div><UserOutlined /> Quản lý: <b>{ev.manager_name}</b></div>
              <div><TeamOutlined /> {ev.current_participants}/{ev.target_participants} người</div>
              <div><CalendarOutlined /> {new Date(ev.start_date).toLocaleDateString("vi-VN")}</div>
              <div><EnvironmentOutlined /> {ev.location}</div>
            </div>
          </div>

          {/* Phần nút thao tác (Tách biệt) */}
          <div style={{ display: "flex", gap: 10, marginTop: 16, paddingTop: 12, borderTop: "1px dashed #d9d9d9" }}>
            <Button
              type="primary"
              block
              icon={<CheckOutlined />}
              onClick={(e) => { e.stopPropagation(); handleApprove(ev.event_id); }}
            >
              DUYỆT
            </Button>
            <Button
              danger
              block
              icon={<CloseOutlined />}
              onClick={(e) => { e.stopPropagation(); openRejectModal(ev); }}
            >
              TỪ CHỐI
            </Button>
          </div>
        </div>
      ));

      if (!data?.pending_events?.length) content = <Empty description="Hết việc! Không còn sự kiện chờ duyệt" />;
    } else {
      /* ================= TAB 2: TRENDING ================= */
      headerClass = "header-red";
      headerText = "Sự kiện thu hút";
      HeaderIcon = FireFilled;

      content = data?.trending_events?.map((ev, index) => (
        <div
          key={ev.event_id}
          className={`dashboard-item trending-item clickable-card ${index === 0 ? "rank-1" : ""}`}
          onClick={() => navigate(`/events/${ev.event_id}`)}
        >
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Tag color={index === 0 ? "red" : index === 1 ? "volcano" : "gold"}>
                {index === 0 ? "TOP 1" : index === 1 ? "TOP 2" : `TOP ${index + 1}`}
              </Tag>
              <Tooltip title="Điểm tương tác">
                <Tag color="gold"><StarFilled /> {ev.engagement_score}đ</Tag>
              </Tooltip>
            </div>

            <div className="text-bold" style={{ fontSize: 16, color: "#cf1322", marginBottom: 6 }}>
              {ev.title}
            </div>

            <div style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
              <UserOutlined /> {ev.manager_name} | <TeamOutlined /> <b>{ev.current_participants}/{ev.target_participants}</b>
            </div>

            <div className="growth-box">
              <div style={{ fontSize: 11, fontWeight: "bold", color: "#555", marginBottom: 4 }}>
                <LineChartOutlined /> TĂNG TRƯỞNG 24H:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                <div style={{ color: "#389e0d" }}><ArrowUpOutlined /> +{ev.new_participants_24h} người</div>
                <div style={{ color: "#096dd9" }}><ArrowUpOutlined /> +{ev.new_posts_24h} bài</div>
              </div>
            </div>
          </div>
        </div>
      ));

      if (!data?.trending_events?.length) content = <Empty description="Chưa có dữ liệu trending" />;
    }

    return (
      <div className="dashboard-section animation-fade-in">
        <div className={`section-header ${headerClass}`}>
          <HeaderIcon /> {headerText}
        </div>
        <div className="section-grid">
          {content}
        </div>
      </div>
    );
  };

  if (loading)
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div className="dashboard-container">
      {/* ================= 1. THỐNG KÊ (GRID) ================= */}
      <div className="stats-grid-container">
        <div className="stats-card stats-blue">
          <div className="stats-value">{data?.stats?.total_users || 0}</div>
          <div className="stats-label"><UserOutlined /> Người dùng</div>
          <div className="text-xs" style={{ color: "#52c41a", marginTop: 4 }}>
             <ArrowUpOutlined /> +{data?.stats?.new_users_24h || 0} (24h)
          </div>
        </div>

        <div className="stats-card stats-green">
          <div className="stats-value">{data?.stats?.total_events || 0}</div>
          <div className="stats-label"><CalendarOutlined /> Sự kiện</div>
          <div className="text-xs" style={{ color: "#52c41a", marginTop: 4 }}>
             <ArrowUpOutlined /> +{data?.stats?.new_events_24h || 0} (24h)
          </div>
        </div>

        <div className="stats-card stats-orange">
          <div className="stats-value">{data?.stats?.pending_events || 0}</div>
          <div className="stats-label"><ClockCircleOutlined /> Chờ duyệt</div>
           <div className="text-xs" style={{ color: "#faad14", marginTop: 4 }}>
             Cần xử lý gấp
          </div>
        </div>

        <div className="stats-card stats-red">
          <div className="stats-value">{data?.stats?.locked_users || 0}</div>
          <div className="stats-label"><LockOutlined /> Đã khóa</div>
          <div className="text-xs" style={{ color: "#cf1322", marginTop: 4 }}>
             +{data?.stats?.new_locked_24h || 0} gần đây
          </div>
        </div>
      </div>

      {/* ================= 2. TABS (2 ITEM) ================= */}
      <div className="custom-tabs-container">
        <div className="custom-tabs">
          {/* Do Admin chỉ có 2 tab, ta override style width của glider 
             từ /3 thành /2 để thanh trượt đẹp hơn 
          */}
          <div 
            className={`tab-glider`}
            style={{
                width: "calc((100% - 8px) / 2)",
                transform: `translateX(${currentViewIndex * 100}%)`,
                backgroundColor: currentViewIndex === 0 ? "#faad14" : "#f5222d" // Vàng cho Pending, Đỏ cho Trending
            }}
          ></div>

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

      {/* ================= 3. CONTENT AREA ================= */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {renderContent()}
      </div>

      {/* ================= 4. MODAL REJECT ================= */}
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
        <p>Nhập lý do từ chối (bắt buộc):</p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={500}
          showCount
          placeholder="Ví dụ: Nội dung chưa phù hợp, thiếu thông tin địa điểm..."
          style={{ marginTop: 4, marginBottom: 24 }}
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;