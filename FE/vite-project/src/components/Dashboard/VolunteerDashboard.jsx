import React, { useEffect, useState } from "react";
import {
  Spin,
  Empty,
  Avatar,
  Tag,
  Button,
  Tooltip,
} from "antd";

import {
  ThunderboltFilled,
  MessageFilled,
  FireFilled,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  ArrowUpOutlined,
  CommentOutlined,
  LikeOutlined,
  CheckCircleFilled,
  FileTextOutlined,
  StarFilled,
  RiseOutlined,
  BellOutlined,
} from "@ant-design/icons";

import { Link } from "react-router-dom";
import dashboardApi from "../../../apis/dashboardApi";
import "./Dashboard.css";

const VolunteerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // view: 0 = new, 1 = feed, 2 = trending (Dùng số để dễ tính toán vị trí animation)
  const [currentViewIndex, setCurrentViewIndex] = useState(0);

  const fetchData = async () => {
    try {
      // Mock data hoặc gọi API thật
      const res = await dashboardApi.getDashboard();
      if (res.success) setData(res.data);
    } catch (error) {
      console.error("Lỗi tải dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  // Cấu hình các Tabs
  const tabs = [
    { label: "SỰ KIỆN MỚI", icon: <ThunderboltFilled />, key: "new" },
    { label: "HOẠT ĐỘNG", icon: <MessageFilled />, key: "feed" },
    { label: "XU HƯỚNG", icon: <FireFilled />, key: "trending" },
  ];

  const renderContent = () => {
    // Reset scroll top khi chuyển tab (nếu cần)
    // window.scrollTo(0, 0);

    let content = null;
    let headerClass = "";
    let headerText = "";
    let HeaderIcon = null;

    if (currentViewIndex === 0) {
      // --- VIEW: NEW ---
      headerClass = "header-blue";
      headerText = "Sự kiện mới công bố";
      HeaderIcon = ThunderboltFilled;
      content = data?.col1_new?.map((ev) => (
        <div key={ev.event_id} className="dashboard-item new-item">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Tag color="blue" style={{ fontWeight: "bold" }}>
                <ThunderboltFilled /> MỚI
              </Tag>
              <span className="text-xs text-grey">
                <CalendarOutlined /> {new Date(ev.start_date).toLocaleDateString("vi-VN")}
              </span>
            </div>

            <Link to={`/events/${ev.event_id}`} className="text-bold" style={{ fontSize: 16, color: "#333", display: "block", marginBottom: 8 }}>
              {ev.title}
            </Link>

            <div className="text-sm text-grey">
              <div style={{marginBottom: 4}}><EnvironmentOutlined /> {ev.location}</div>
              <div style={{ fontWeight: 600, color: "#333" }}>
                <UserOutlined /> {ev.current_participants}/{ev.target_participants || "∞"} người
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 12, fontSize: 12, borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
              <span><FileTextOutlined /> {ev.total_posts} bài</span>
              <span style={{ color: "#faad14" }}><LikeOutlined /> {ev.total_reactions}</span>
              <span style={{ color: "#1890ff" }}><CommentOutlined /> {ev.total_comments}</span>
            </div>
          </div>

          <div style={{ marginTop: 16, borderTop: "1px dashed #eee", paddingTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#52c41a", fontSize: 12, fontWeight: 600 }}>
              <CheckCircleFilled /> Đã duyệt
            </span>
            <Link to={`/events/${ev.event_id}`}>
              <Button size="small" type="primary" ghost>Chi tiết</Button>
            </Link>
          </div>
        </div>
      ));
      if (!data?.col1_new?.length) content = <Empty description="Chưa có dữ liệu" />;
    } 
    
    else if (currentViewIndex === 1) {
      // --- VIEW: FEED ---
      headerClass = "header-orange";
      headerText = "Tin mới (Đã tham gia)";
      HeaderIcon = MessageFilled;
      content = data?.col2_feed?.map((item, idx) => (
        <div key={`feed-${idx}`} className="dashboard-item feed-item">
          <div>
            <div style={{ fontSize: 12, color: "#fa8c16", fontWeight: "bold", marginBottom: 12, display:"flex", alignItems:"center", gap: 6 }}>
              <BellOutlined /> {item.event_title}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <Avatar src={item.author_avatar} icon={<UserOutlined />} />
              <div style={{ flex: 1 }}>
                <div>
                  <span className="text-bold">{item.author_name}</span>
                  <span className="text-xs text-grey" style={{marginLeft: 4}}>
                    {item.type === "post" ? "đã đăng bài" : "đã bình luận"}
                  </span>
                </div>
                <div className="feed-quote">
                  "{(item.content.length > 100 ? item.content.substring(0, 100) + "..." : item.content) || ""}"
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#999" }}>
                  <span>{timeAgo(item.created_at)}</span>
                  {item.type === "post" && (
                    <span><LikeOutlined /> {item.like_count} • <CommentOutlined /> {item.comment_count}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={{ textAlign: "right", marginTop: 10 }}>
            <Link to={`/events/${item.event_id}`}>
              <Button size="small" type="text" style={{ color: "#fa8c16" }}>Xem ngay →</Button>
            </Link>
          </div>
        </div>
      ));
      if (!data?.col2_feed?.length) content = <Empty description="Chưa có dữ liệu" />;
    } 
    
    else if (currentViewIndex === 2) {
      // --- VIEW: TRENDING ---
      headerClass = "header-red";
      headerText = "Sự kiện thu hút";
      HeaderIcon = FireFilled;
      content = data?.col3_trending?.map((ev, index) => (
        <div key={ev.event_id} className={`dashboard-item trending-item ${index === 0 ? "rank-1" : ""}`}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <Tag color={index === 0 ? "volcano" : "default"}>
                <StarFilled /> {index === 0 ? "TOP 1" : `TOP ${index + 1}`}
              </Tag>
              <Tooltip title="Điểm tương tác">
                <Tag color="gold"><StarFilled /> {ev.engagement_score}</Tag>
              </Tooltip>
            </div>

            <Link to={`/events/${ev.event_id}`} className="text-bold" style={{ fontSize: 16, color: "#cf1322", display:"block", marginBottom: 8 }}>
              {ev.title}
            </Link>

            <div className="growth-box">
              <div style={{ fontSize: 11, fontWeight: "bold", color: "#555", marginBottom: 6 }}>
                <RiseOutlined /> TĂNG TRƯỞNG 24H:
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", fontSize: "12px", rowGap: 6 }}>
                <div style={{ width: "50%", color: "#389e0d" }}><ArrowUpOutlined /> +{ev.new_participants_24h} người</div>
                <div style={{ width: "50%", color: "#096dd9" }}><FileTextOutlined /> +{ev.new_posts_24h} bài</div>
                <div style={{ width: "50%", color: "#cf1322" }}><LikeOutlined /> +{ev.new_likes_24h} thích</div>
                <div style={{ width: "50%", color: "#d46b08" }}><CommentOutlined /> +{ev.new_comments_24h} cmt</div>
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between", fontSize: 11, color: "#666", background: "#fff", padding: "4px 8px", borderRadius: 4, border: "1px solid #eee" }}>
              <span><UserOutlined /> {ev.current_participants}</span>
              <span><FileTextOutlined /> {ev.total_posts}</span>
              <span><LikeOutlined /> {ev.total_reactions}</span>
              <span><CommentOutlined /> {ev.total_comments}</span>
            </div>
          </div>
          
          <Link to={`/events/${ev.event_id}`}>
            <Button type="primary" danger block style={{ marginTop: 16, fontWeight: "bold" }}>KHÁM PHÁ NGAY</Button>
          </Link>
        </div>
      ));
      if (!data?.col3_trending?.length) content = <Empty description="Chưa có dữ liệu" />;
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
      {/* --- CUSTOM NAVIGATION TABS --- */}
      <div className="custom-tabs-container">
        <div className="custom-tabs">
          {/* Miếng màu chạy (Glider) */}
          <div className={`tab-glider glider-${currentViewIndex}`}></div>

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

      {/* --- CONTENT AREA --- */}
      {renderContent()}
    </div>
  );
};

export default VolunteerDashboard;