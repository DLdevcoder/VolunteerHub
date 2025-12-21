import React, { useEffect, useState } from "react";
import { Spin, Empty, Avatar, Tag, Button, Pagination } from "antd";
import {
  ClockCircleOutlined,
  MessageFilled,
  FireFilled,
  EnvironmentOutlined,
  UserOutlined,
  EditOutlined,
  ArrowUpOutlined,
  FileTextOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  PlayCircleFilled,
  RightCircleFilled,
  RiseOutlined,
  StarFilled,
  TeamOutlined,
  LikeOutlined,
  CommentOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import dashboardApi from "../../../apis/dashboardApi";
import "./Dashboard.css";

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // tab
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  // pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const res = await dashboardApi.getDashboard();
      if (res?.success) setData(res.data);
    } catch (error) {
      console.error("Lỗi tải data:", error);
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

  const timeAgo = (dateString) => {
    if (!dateString) return "";
    const seconds = Math.floor((new Date() - new Date(dateString)) / 1000);
    if (seconds < 60) return "Vừa xong";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} phút trước`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} giờ trước`;
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  const tabs = [
    { label: "CHỜ DUYỆT", icon: <ClockCircleOutlined />, key: "pending" },
    { label: "HOẠT ĐỘNG", icon: <MessageFilled />, key: "activity" },
    { label: "SỰ KIỆN HOT", icon: <FireFilled />, key: "trending" },
  ];

  const getPaginatedData = (list) => {
    if (!list || !Array.isArray(list)) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return list.slice(startIndex, startIndex + pageSize);
  };

  // -------------------------
  // TAB 0: PENDING (Manager)
  // -------------------------
  const renderPendingList = () => {
    const sourceData = data?.col1_pending || [];
    const currentData = getPaginatedData(sourceData);

    // status -> AntD Tag (orange pending, green approved, red rejected...)
    const getStatusTag = (statusRaw) => {
      const s = String(statusRaw || "").toUpperCase();

      if (["PENDING", "WAITING", "IN_REVIEW"].includes(s)) {
        return { text: "PENDING", color: "orange" };
      }
      if (["APPROVED", "ACCEPTED"].includes(s)) {
        return { text: "APPROVED", color: "green" };
      }
      if (["REJECTED", "DECLINED"].includes(s)) {
        return { text: "REJECTED", color: "red" };
      }

      return { text: s || "UNKNOWN", color: "default" };
    };

    return (
      <>
        <div
          className="section-header"
          style={{ borderLeftColor: "var(--primary-blue)" }}
        >
          <ClockCircleOutlined /> Sự kiện chờ duyệt ({sourceData.length})
        </div>

        <div className="list-layout-container">
          {currentData.length === 0 ? (
            <Empty description="Không có dữ liệu" />
          ) : (
            currentData.map((ev, index) => {
              // ✅ pick the right field from backend (use whichever exists)
              const statusRaw =
                ev.status || ev.event_status || ev.approval_status || "PENDING";
              const { text, color } = getStatusTag(statusRaw);

              return (
                <div
                  key={ev.event_id}
                  className="horizontal-item pending-card manager-pending-card"
                  onClick={() => navigate(`/events/${ev.event_id}`)}
                  title="Xem chi tiết"
                >
                  {/* LEFT */}
                  <div className="pending-main">
                    <div className="pending-top">
                      <Tag className="pending-rank">
                        #{index + 1 + (currentPage - 1) * pageSize}
                      </Tag>

                      {/* ✅ status Tag (AntD) */}
                      <Tag color={color} style={{ margin: 0, fontWeight: 700 }}>
                        {text}
                      </Tag>

                      <span className="pending-wait">
                        Chờ <b>{ev.days_waiting}</b> ngày
                      </span>
                    </div>

                    <div className="pending-title">{ev.title}</div>

                    {/* ✅ stacked meta (not inline) */}
                    <div className="pending-meta">
                      <div className="pending-meta-row">
                        <EnvironmentOutlined />
                        <span>Địa điểm: {ev.location}</span>
                      </div>

                      <div className="pending-meta-row">
                        <TeamOutlined />
                        <span>
                          Quy mô:{" "}
                          <b>
                            {ev.current_participants}/{ev.target_participants}
                          </b>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div
                    className="pending-actions pending-actions-single"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="primary"
                      size="middle"
                      icon={<EditOutlined />}
                      block
                      className="pending-btn pending-btn-edit"
                      onClick={() =>
                        navigate(`/manager/events/${ev.event_id}/edit`)
                      }
                    >
                      Sửa
                    </Button>
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

  // -------------------------
  // TAB 1: ACTIVITY (grid)
  // -------------------------
  const renderActivityList = () => {
    const sourceData = data?.col2_activity || [];
    const currentData = getPaginatedData(sourceData);

    return (
      <>
        <div
          className="section-header"
          style={{ borderLeftColor: "var(--color-med-blue)" }}
        >
          <MessageFilled /> Hoạt động mới
        </div>

        <div className="activity-grid-container">
          {currentData.length === 0 ? (
            <Empty description="Không có dữ liệu" />
          ) : (
            currentData.map((item, idx) => (
              <div key={`act-${idx}`} className="activity-card">
                <div className="act-card-header">
                  <Avatar
                    src={item.author_avatar}
                    icon={<UserOutlined />}
                    size={44}
                  />
                  <div className="act-header-text">
                    <div className="activity-author-name">
                      {item.author_name}
                    </div>
                    <div className="activity-time-text">
                      {timeAgo(item.created_at)}
                    </div>
                  </div>
                </div>

                <div className="act-card-content">{item.content}</div>

                <div className="act-card-footer">
                  <div className="act-footer-left">
                    <div className="activity-type-label">
                      {(item.type || "ACTIVITY").toUpperCase()}
                    </div>
                    <div
                      className="activity-event-title"
                      title={item.event_title}
                    >
                      {item.event_title}
                    </div>
                  </div>

                  <Button
                    shape="circle"
                    type="text"
                    className="act-go-btn"
                    icon={<RightCircleFilled />}
                    onClick={() => navigate(`/events/${item.event_id}`)}
                  />
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

  // -------------------------
  // TAB 2: TRENDING
  // -------------------------
  const renderTrendingList = () => {
    const sourceData = data?.col3_trending || [];
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
            currentData.map((ev, idx) => {
              const realRank = (currentPage - 1) * pageSize + idx;
              const rankColor = realRank === 0 ? "#f5222d" : "#3674B5";

              return (
                <div
                  key={ev.event_id}
                  className="horizontal-item clickable-card trending-card"
                  onClick={() => navigate(`/events/${ev.event_id}`)}
                >
                  <div className="trending-main">
                    <div className="trending-info-section">
                      <div className="trending-tags-row">
                        <Tag color={rankColor} style={{ margin: 0 }}>
                          {realRank === 0 ? "TOP 1" : `TOP ${realRank + 1}`}
                        </Tag>
                      </div>

                      {/* ✅ use class so it can wrap/clamp responsively */}
                      <div className="trending-title" title={ev.title}>
                        {ev.title}
                      </div>

                      <div className="trending-meta">
                        <span>
                          <EnvironmentOutlined /> {ev.location}
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
                      <div className="trending-growth-react">
                        <LikeOutlined /> <span>+{ev.new_likes_24h} likes</span>
                      </div>
                      <div className="trending-growth-cmt">
                          <CommentOutlined /> <span>+{ev.new_comments_24h} cmt</span>
                      </div>
                    </div>
                  </div>

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
    if (currentViewIndex === 0) return renderPendingList();
    if (currentViewIndex === 1) return renderActivityList();
    return renderTrendingList();
  };

  if (loading) {
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-container manager-dashboard">
      {/* STATS (5 cards for manager) */}
      <div className="stats-grid-container manager-stats-grid">
        <div className="stats-card-modern card-theme-1">
          <div className="stats-left">
            <span className="stats-title">Đã tạo</span>
            <span className="stats-number">
              {data?.stats?.total_created ?? 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <FileTextOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-3">
          <div className="stats-left">
            <span className="stats-title">Chờ duyệt</span>
            <span className="stats-number">
              {data?.stats?.total_pending ?? 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <ExclamationCircleOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-2">
          <div className="stats-left">
            <span className="stats-title">Đã duyệt</span>
            <span className="stats-number">
              {data?.stats?.total_approved ?? 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <CheckCircleOutlined />
          </div>
        </div>

        <div className="stats-card-modern card-theme-4">
          <div className="stats-left">
            <span className="stats-title">Đang chạy</span>
            <span className="stats-number">
              {data?.stats?.total_running ?? 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <PlayCircleFilled />
          </div>
        </div>

        <div className="stats-card-modern card-theme-5">
          <div className="stats-left">
            <span className="stats-title">Đã xong</span>
            <span className="stats-number">
              {data?.stats?.total_completed ?? 0}
            </span>
          </div>
          <div className="stats-icon-bg">
            <CheckCircleOutlined />
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="custom-tabs-container">
        <div className="custom-tabs">
          <div
            className="tab-glider"
            style={{
              width: "calc((100% - 8px) / 3)",
              transform: `translateX(${currentViewIndex * 100}%)`,
              backgroundColor: "#3674B5",
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

      <div className="dashboard-section animation-fade-in">
        {renderContent()}
      </div>
    </div>
  );
};

export default ManagerDashboard;
