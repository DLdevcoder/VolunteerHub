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
  Pagination,
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
  StarFilled,
  RiseOutlined,
  FileTextOutlined,
  RightOutlined,
} from "@ant-design/icons";
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
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // State quản lý tab
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  // State Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

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

  useEffect(() => {
    setCurrentPage(1);
  }, [currentViewIndex]);

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

  const getPaginatedData = (list) => {
    if (!list || !Array.isArray(list)) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return list.slice(startIndex, startIndex + pageSize);
  };

  const tabs = [
    { label: "CHỜ DUYỆT", icon: <ClockCircleOutlined />, key: "pending" },
    { label: "XU HƯỚNG", icon: <FireFilled />, key: "trending" },
  ];

  const renderContent = () => {
    let content = null;
    let headerText = "";
    let HeaderIcon = null;
    let sourceData = [];

    /* ================= TAB 1: PENDING (CHỜ DUYỆT) ================= */
    if (currentViewIndex === 0) {
      headerText = `Danh sách chờ duyệt (${data?.pending_events?.length || 0})`;
      HeaderIcon = ClockCircleOutlined;
      sourceData = data?.pending_events || [];
      const currentData = getPaginatedData(sourceData);

      content = currentData.map((ev, index) => (
        <div 
          key={ev.event_id} 
          className="horizontal-item"
          style={{ backgroundColor: "#fff" }} // Fix lỗi mất màu nền
        >
          {/* CỘT TRÁI: Thông tin chính */}
          <div 
             style={{cursor: 'pointer', flex: 1, paddingRight: 20}} 
             onClick={() => navigate(`/events/${ev.event_id}`)}
             title="Xem chi tiết"
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
               <Tag color="#3674B5" style={{margin: 0, fontSize: 13, padding: "2px 10px"}}>#{index + 1 + (currentPage - 1) * pageSize}</Tag>
               <span style={{fontSize: 14, color: '#888'}}>Đã chờ <b>{ev.days_waiting}</b> ngày</span>
            </div>

            <div
              className="text-bold"
              style={{ fontSize: 20, color: "#3674B5", marginBottom: 12, lineHeight: 1.4 }}
            >
              {ev.title}
            </div>

            <div className="text-sm" style={{ color: "#555", fontSize: 15, display: "flex", flexDirection: "column", gap: 8 }}>
              <span><UserOutlined /> Quản lý: <b>{ev.manager_name}</b></span>
              <span><TeamOutlined /> Quy mô: <b>{ev.current_participants}/{ev.target_participants}</b> người</span>
              <span><EnvironmentOutlined /> Địa điểm: {ev.location}</span>
            </div>
          </div>

          {/* CỘT PHẢI: Nút thao tác */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12, width: 140 }}>
            <Button
              type="primary"
              size="large"
              icon={<CheckOutlined />}
              block
              style={{height: 42, fontSize: 15, fontWeight: 600}}
              onClick={(e) => { e.stopPropagation(); handleApprove(ev.event_id); }}
            >
              Duyệt
            </Button>
            <Button
              danger
              size="large"
              icon={<CloseOutlined />}
              block
              style={{height: 42, fontSize: 15, fontWeight: 600}}
              onClick={(e) => { e.stopPropagation(); openRejectModal(ev); }}
            >
              Từ chối
            </Button>
          </div>
        </div>
      ));
    } 
    /* ================= TAB 2: TRENDING (CHỈNH SỬA GIỐNG ẢNH MẪU) ================= */
    else {
      headerText = "Sự kiện thu hút";
      HeaderIcon = FireFilled;
      sourceData = data?.trending_events || [];
      const currentData = getPaginatedData(sourceData);

      content = currentData.map((ev, index) => {
         const realRank = (currentPage - 1) * pageSize + index;
         return (
         <div 
        key={ev.event_id} 
        className="horizontal-item clickable-card"
        style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        onClick={() => navigate(`/events/${ev.event_id}`)}
      >
        {/* PHẦN 1 & 2: GIỮ NGUYÊN Y HỆT CODE BẠN GỬI */}
        <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
          
          {/* PHẦN 1: THÔNG TIN */}
          <div style={{ paddingRight: 24, maxWidth: "65%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Tag color={realRank === 0 ? "#f5222d" : "#3674B5"} style={{ margin: 0 }}>
                {realRank === 0 ? "TOP 1" : `TOP ${realRank + 1}`}
              </Tag>
            </div>

            <div 
              style={{ fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 8 }}
            >
              {ev.title}
            </div>

            <div style={{ display: "flex", gap: 16, color: "#666", fontSize: 14 }}>
               <span> <UserOutlined /> {ev.manager_name}</span> 
               <span><TeamOutlined /> {ev.current_participants}/{ev.target_participants} người</span>
            </div>
          </div>

          {/* PHẦN 2: TĂNG TRƯỞNG */}
          <div 
            style={{ 
              display: "flex", 
              flexDirection: "column", 
              gap: 4,
              paddingLeft: 24,
              borderLeft: "1px solid #eee", 
              minWidth: 160
            }}
          >
            <div style={{ fontSize: 11, fontWeight: "bold", color: "#888", marginBottom: 2 }}>
              <RiseOutlined /> TĂNG TRƯỞNG 24H
            </div>
            <div style={{ fontSize: 13, color: "#389e0d", fontWeight: 600 }}>
              <ArrowUpOutlined /> +{ev.new_participants_24h} người
            </div>
            <div style={{ fontSize: 13, color: "#3674B5", fontWeight: 600 }}>
              <FileTextOutlined /> +{ev.new_posts_24h} bài đăng
            </div>
          </div>
        </div>

        <div style={{ 
            textAlign: "center", 
            paddingLeft: 30, 
            borderLeft: "1px solid #eee", 
            minWidth: 120,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center"
        }}>
            <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>Điểm</div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#3674B5", lineHeight: 1 }}>
                {ev.engagement_score}
            </div>
            <div style={{ marginTop: 6 }}>
                <StarFilled style={{ color: "#fadb14", fontSize: 20 }} />
            </div>
        </div>
      </div>
    );
  });
}

    return (
      <div className="dashboard-section animation-fade-in">
        <div className="section-header" style={{ color: "#3674B5", borderLeftColor: "#3674B5" }}>
          <HeaderIcon /> {headerText}
        </div>
        <div className="list-layout-container">
          {content.length > 0 ? content : <Empty description="Không có dữ liệu" />}
        </div>
        
        {sourceData.length > pageSize && (
          <div style={{ marginTop: 24, display: "flex", justifyContent: "center" }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={sourceData.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        )}
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
      {/* ================= THỐNG KÊ ================= */}
      <div className="stats-grid-container">
        <div className="stats-card-modern card-theme-1">
           <div className="stats-left">
              <span className="stats-title">Tổng người dùng</span>
              <span className="stats-number">{data?.stats?.total_users || 0}</span>
           </div>
           <div className="stats-icon-bg"><UserOutlined /></div>
        </div>

        <div className="stats-card-modern card-theme-2">
           <div className="stats-left">
              <span className="stats-title">Tổng sự kiện</span>
              <span className="stats-number">{data?.stats?.total_events || 0}</span>
           </div>
           <div className="stats-icon-bg"><CalendarOutlined /></div>
        </div>

        <div className="stats-card-modern card-theme-3">
           <div className="stats-left">
              <span className="stats-title">Đang chờ duyệt</span>
              <span className="stats-number">{data?.stats?.pending_events || 0}</span>
           </div>
           <div className="stats-icon-bg"><ClockCircleOutlined /></div>
        </div>

        <div className="stats-card-modern card-theme-4">
           <div className="stats-left">
              <span className="stats-title">Tài khoản khóa</span>
              <span className="stats-number">{data?.stats?.locked_users || 0}</span>
           </div>
           <div className="stats-icon-bg"><LockOutlined /></div>
        </div>
      </div>

      {/* ================= TABS ================= */}
      <div className="custom-tabs-container">
        <div className="custom-tabs">
          <div 
            className="tab-glider"
            style={{
                width: "calc((100% - 8px) / 2)",
                transform: `translateX(${currentViewIndex * 100}%)`,
                backgroundColor: "#3674B5",
                position: "absolute", top: 4, bottom: 4, left: 4,
                borderRadius: 25, zIndex: 1,
                transition: "transform 0.3s ease"
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

      {/* ================= CONTENT ================= */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {renderContent()}
      </div>

      {/* ================= MODAL REJECT ================= */}
      <Modal
        title={rejectingEvent ? `Từ chối: "${rejectingEvent.title}"` : "Từ chối sự kiện"}
        open={rejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={handleRejectCancel}
        okText="Xác nhận"
        cancelText="Hủy"
        confirmLoading={rejectLoading}
        okButtonProps={{ danger: true }}
      >
        <p>Lý do từ chối:</p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
};

export default AdminDashboard;