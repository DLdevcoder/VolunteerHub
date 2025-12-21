import React, { useEffect, useState } from "react";
import { Spin, Empty, Avatar, Tag, Button, Tooltip, Pagination } from "antd";
import {
  ThunderboltFilled,
  MessageFilled,
  FireFilled,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  TeamOutlined,
  ArrowUpOutlined,
  CommentOutlined,
  LikeOutlined,
  FileTextOutlined,
  StarFilled,
  RiseOutlined,
  RightOutlined,
  RightCircleFilled,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import dashboardApi from "../../../apis/dashboardApi";
import "./Dashboard.css";

const VolunteerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // view: 0 = new, 1 = feed, 2 = trending
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getDashboard();
        if (res?.success) setData(res.data);
      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setLoading(false);
      }
    };
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
    { label: "SỰ KIỆN MỚI", icon: <ThunderboltFilled />, key: "new" },
    { label: "HOẠT ĐỘNG", icon: <MessageFilled />, key: "feed" },
    { label: "XU HƯỚNG", icon: <FireFilled />, key: "trending" },
  ];

  const getPaginatedData = (list) => {
    if (!list || !Array.isArray(list)) return [];
    const startIndex = (currentPage - 1) * pageSize;
    return list.slice(startIndex, startIndex + pageSize);
  };

  const renderNewList = () => {
    const sourceData = data?.col1_new || [];
    const currentData = getPaginatedData(sourceData);

    return (
      <>
        <div
          className="section-header"
          style={{ color: "#3674B5", borderLeftColor: "#3674B5" }}
        >
          <ThunderboltFilled /> Sự kiện mới công bố
        </div>

        <div className="list-layout-container">
          {currentData.length === 0 ? (
            <Empty description="Chưa có dữ liệu" />
          ) : (
            currentData.map((ev) => (
              <div
                key={ev.event_id}
                className="horizontal-item clickable-card trending-card"
                onClick={() => navigate(`/events/${ev.event_id}`)}
                style={{ cursor: "pointer" }}
              >
                {/* MAIN */}
                <div className="trending-main" style={{ flex: 1 }}>
                  {/* INFO */}
                  <div className="trending-info-section">
                    <div
                      className="trending-tags-row"
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <Tag color="blue" style={{ margin: 0, fontWeight: 700 }}>
                        NEW
                      </Tag>
                      <span style={{ fontSize: 13, color: "#888" }}>
                        <CalendarOutlined />{" "}
                        {ev.start_date
                          ? new Date(ev.start_date).toLocaleDateString("vi-VN")
                          : "—"}
                      </span>
                    </div>

                    {/* ✅ use class so it wraps/clamps at tablet/mobile */}
                    <div
                      className="trending-title"
                      title={ev.title}
                      style={{ color: "#3674B5" }}
                    >
                      {ev.title}
                    </div>

                    <div className="trending-meta">
                      <span>
                        <EnvironmentOutlined /> {ev.location}
                      </span>
                      <span>
                        <TeamOutlined /> {ev.current_participants}/
                        {ev.target_participants ?? "∞"} người
                      </span>
                    </div>
                  </div>

                  {/* STATS (reuse growth section layout) */}
                  <div className="trending-growth-section">
                    <div style={{ fontSize: 13, color: "#666" }}>
                      <FileTextOutlined
                        style={{ color: "#3674B5", marginRight: 6 }}
                      />
                      <b>{ev.total_posts ?? 0}</b> bài
                    </div>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      <LikeOutlined
                        style={{ color: "#ff4d4f", marginRight: 6 }}
                      />
                      <b>{ev.total_reactions ?? 0}</b> tương tác
                    </div>
                    <div style={{ fontSize: 13, color: "#666" }}>
                      <CommentOutlined
                        style={{ color: "#faad14", marginRight: 6 }}
                      />
                      <b>{ev.total_comments ?? 0}</b> bình luận
                    </div>
                  </div>
                </div>

                {/* ACTION */}
                <div
                  className="item-action-col"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="arrow-btn-circle">
                    <RightOutlined />
                  </div>
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

  const renderFeedList = () => {
    const sourceData = data?.col2_feed || [];
    const currentData = getPaginatedData(sourceData);

    return (
      <>
        <div
          className="section-header"
          style={{ color: "#3674B5", borderLeftColor: "#3674B5" }}
        >
          <MessageFilled /> Hoạt động mới
        </div>

        <div className="activity-grid-container">
          {currentData.length === 0 ? (
            <Empty description="Chưa có dữ liệu" />
          ) : (
            currentData.map((item, idx) => (
              <div
                key={`feed-${idx}`}
                className="activity-card"
                // ✅ safety: always looks like a card even if CSS gets overridden
                style={{ background: "#fff" }}
              >
                <div className="act-card-header">
                  <Avatar
                    src={item.author_avatar}
                    icon={<UserOutlined />}
                    size={40}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: "#333" }}>
                      {item.author_name}
                    </div>
                    <div style={{ fontSize: 12, color: "#999" }}>
                      {timeAgo(item.created_at)} •{" "}
                      {item.type === "post" ? "Đăng bài" : "Bình luận"}
                    </div>
                  </div>
                </div>

                <div className="act-card-content">{item.content}</div>

                <div className="act-card-footer">
                  <div style={{ overflow: "hidden" }}>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#3674B5",
                        fontWeight: 700,
                        marginBottom: 2,
                      }}
                    >
                      {(item.type || "").toUpperCase()}
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: 180,
                      }}
                      title={item.event_title}
                    >
                      {item.event_title}
                    </div>
                  </div>

                  <Tooltip title="Xem chi tiết">
                    <Button
                      shape="circle"
                      icon={
                        <RightCircleFilled
                          style={{ fontSize: 24, color: "#578FCA" }}
                        />
                      }
                      type="text"
                      onClick={() => navigate(`/events/${item.event_id}`)}
                    />
                  </Tooltip>
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
    const sourceData = data?.col3_trending || [];
    const currentData = getPaginatedData(sourceData);

    return (
      <>
        <div
          className="section-header"
          style={{ color: "#3674B5", borderLeftColor: "#3674B5" }}
        >
          <FireFilled /> Sự kiện thu hút
        </div>

        <div className="list-layout-container">
          {currentData.length === 0 ? (
            <Empty description="Chưa có dữ liệu" />
          ) : (
            currentData.map((ev, idx) => {
              const realRank = (currentPage - 1) * pageSize + idx;
              const rankColor = realRank === 0 ? "#f5222d" : "#3674B5";

              return (
                <div
                  key={ev.event_id}
                  className="horizontal-item clickable-card trending-card"
                  onClick={() => navigate(`/events/${ev.event_id}`)}
                  style={{ cursor: "pointer" }}
                >
                  {/* MAIN */}
                  <div className="trending-main">
                    <div className="trending-info-section">
                      <div className="trending-tags-row">
                        <Tag
                          color={rankColor}
                          style={{ margin: 0, fontWeight: 700 }}
                        >
                          {realRank === 0 ? "TOP 1" : `TOP ${realRank + 1}`}
                        </Tag>
                      </div>

                      {/* ✅ class-based wrapping/clamp */}
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
    if (currentViewIndex === 0) return renderNewList();
    if (currentViewIndex === 1) return renderFeedList();
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
    <div className="dashboard-container">
      {/* TABS */}
      <div className="custom-tabs-container">
        <div className="custom-tabs">
          <div
            className="tab-glider tab-theme-blue"
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

      {/* CONTENT */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>{renderContent()}</div>
    </div>
  );
};

export default VolunteerDashboard;
