import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { Spin, Empty, Button, Modal, Tag, Input, Pagination } from "antd";
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

  // tab
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  // reject modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingEvent, setRejectingEvent] = useState(null);
  const [rejectLoading, setRejectLoading] = useState(false);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const fetchData = async () => {
    try {
      const res = await dashboardApi.getDashboard();
      if (res?.success) setData(res.data);
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
        rejectEventThunk({ eventId: rejectingEvent.event_id, reason })
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

  const getPaginatedData = (list) => {
    if (!list || !Array.isArray(list)) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return list.slice(startIndex, startIndex + pageSize);
  };

  const tabs = [
    { label: "CHỜ DUYỆT", icon: <ClockCircleOutlined />, key: "pending" },
    { label: "XU HƯỚNG", icon: <FireFilled />, key: "trending" },
  ];

  const renderPendingList = () => {
    const sourceData = data?.pending_events || [];
    const currentData = getPaginatedData(sourceData);

    return (
      <>
        <div
          className="section-header"
          style={{ borderLeftColor: "var(--primary-blue)" }}
        >
          <ClockCircleOutlined /> Danh sách chờ duyệt ({sourceData.length})
        </div>

        <div className="list-layout-container">
          {currentData.length === 0 ? (
            <Empty description="Không có dữ liệu" />
          ) : (
            currentData.map((ev, index) => (
              <div
                key={ev.event_id}
                className="horizontal-item pending-card"
                onClick={() => navigate(`/events/${ev.event_id}`)}
                title="Xem chi tiết"
              >
                {/* LEFT */}
                <div className="pending-main">
                  <div className="pending-top">
                    <Tag className="pending-rank">
                      #{index + 1 + (currentPage - 1) * pageSize}
                    </Tag>

                    <span className="pending-wait">
                      Đã chờ <b>{ev.days_waiting}</b> ngày
                    </span>
                  </div>

                  <div className="pending-title">{ev.title}</div>

                  <div className="pending-meta">
                    <div className="pending-meta-row">
                      <UserOutlined />
                      <span>
                        Quản lý: <b>{ev.manager_name}</b>
                      </span>
                    </div>

                    <div className="pending-meta-row">
                      <TeamOutlined />
                      <span>
                        Quy mô:{" "}
                        <b>
                          {ev.current_participants}/{ev.target_participants}
                        </b>{" "}
                        người
                      </span>
                    </div>

                    <div className="pending-meta-row">
                      <EnvironmentOutlined />
                      <span>Địa điểm: {ev.location}</span>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div
                  className="pending-actions"
                  onClick={(e) => e.stopPropagation()} // IMPORTANT: prevent card click
                >
                  <Button
                    type="primary"
                    size="middle"
                    icon={<CheckOutlined />}
                    block
                    className="pending-btn pending-btn-approve"
                    onClick={() => handleApprove(ev.event_id)}
                  >
                    Duyệt
                  </Button>

                  <Button
                    danger
                    size="middle"
                    icon={<CloseOutlined />}
                    block
                    className="pending-btn pending-btn-reject"
                    onClick={() => openRejectModal(ev)}
                  >
                    Từ chối
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {sourceData.length > pageSize && (
          <div className="pagination-wrapper" style={{ textAlign: "left" }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={sourceData.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        )}
      </>
    );
  };

  const renderTrendingList = () => {
    const sourceData = data?.trending_events || [];
    const currentData = getPaginatedData(sourceData);

    return (
      <>
        <div
          className="section-header"
          style={{ borderLeftColor: "var(--color-med-blue)" }}
        >
          <FireFilled /> Sự kiện thu hút
        </div>

        <div className="list-layout-container">
          {currentData.length === 0 ? (
            <Empty description="Không có dữ liệu" />
          ) : (
            currentData.map((ev, index) => {
              const realRank = (currentPage - 1) * pageSize + index;
              const rankColor = realRank === 0 ? "#f5222d" : "#3674B5";

              return (
                <div
                  key={ev.event_id}
                  className="horizontal-item clickable-card trending-card"
                  onClick={() => navigate(`/events/${ev.event_id}`)}
                >
                  {/* MAIN (info + growth) */}
                  <div className="trending-main">
                    <div className="trending-info-section">
                      <div className="trending-tags-row">
                        <Tag color={rankColor} style={{ margin: 0 }}>
                          {realRank === 0 ? "TOP 1" : `TOP ${realRank + 1}`}
                        </Tag>
                      </div>

                      <div className="trending-title" title={ev.title}>
                        {ev.title}
                      </div>

                      <div className="trending-meta">
                        <span>
                          <UserOutlined /> {ev.manager_name}
                        </span>
                        <span>
                          <TeamOutlined /> {ev.current_participants}/
                          {ev.target_participants} người
                        </span>
                      </div>
                    </div>

                    <div className="trending-growth-section">
                      <div className="trending-growth-label">
                        <RiseOutlined /> TĂNG TRƯỞNG 24H
                      </div>
                      <div className="trending-growth-up">
                        <ArrowUpOutlined /> +{ev.new_participants_24h} người
                      </div>
                      <div className="trending-growth-post">
                        <FileTextOutlined /> +{ev.new_posts_24h} bài đăng
                      </div>
                    </div>
                  </div>

                  {/* SCORE */}
                  <div className="trending-score-section">
                    <div className="score-label">Điểm</div>
                    <div className="score-number">{ev.engagement_score}</div>
                    <div className="score-star">
                      <StarFilled />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {sourceData.length > pageSize && (
          <div className="pagination-wrapper" style={{ textAlign: "left" }}>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={sourceData.length}
              onChange={(page) => setCurrentPage(page)}
              showSizeChanger={false}
            />
          </div>
        )}
      </>
    );
  };

  const renderContent = () => {
    return (
      <div className="dashboard-section animation-fade-in">
        {currentViewIndex === 0 ? renderPendingList() : renderTrendingList()}
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
      {/* STATS */}
      <div className="stats-grid-container">
        <div className="stats-card-modern card-theme-1">
          <div className="stats-left">
            <span className="stats-title">Tổng người dùng</span>
            <span className="stats-number">
              {data?.stats?.total_users || 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <UserOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-2">
          <div className="stats-left">
            <span className="stats-title">Tổng sự kiện</span>
            <span className="stats-number">
              {data?.stats?.total_events || 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <CalendarOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-3">
          <div className="stats-left">
            <span className="stats-title">Đang chờ duyệt</span>
            <span className="stats-number">
              {data?.stats?.pending_events || 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <ClockCircleOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-4">
          <div className="stats-left">
            <span className="stats-title">Tài khoản khóa</span>
            <span className="stats-number">
              {data?.stats?.locked_users || 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <LockOutlined />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="custom-tabs-container">
        <div className="custom-tabs">
          <div
            className="tab-glider"
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
              type="button"
            >
              <span className="tab-icon-wrapper">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {renderContent()}

      {/* REJECT MODAL */}
      <Modal
        title={
          rejectingEvent
            ? `Từ chối: "${rejectingEvent.title}"`
            : "Từ chối sự kiện"
        }
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
