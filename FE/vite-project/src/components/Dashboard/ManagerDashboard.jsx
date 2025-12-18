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
  ClockCircleOutlined,
  MessageFilled,
  FireFilled,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EditOutlined,
  ArrowUpOutlined,
  LikeOutlined,
  CommentOutlined,
  FileTextOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  PlayCircleFilled,
  StarFilled,
  StarOutlined,
  RiseOutlined,
  BellOutlined,
} from "@ant-design/icons";

import { Link, useNavigate } from "react-router-dom";
import dashboardApi from "../../../apis/dashboardApi";
import "./Dashboard.css";

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
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

  const tabs = [
    { label: "CHỜ DUYỆT", icon: <ClockCircleOutlined />, key: "pending" },
    { label: "HOẠT ĐỘNG", icon: <MessageFilled />, key: "activity" },
    { label: "SỰ KIỆN HOT", icon: <FireFilled />, key: "trending" },
  ];

  const renderContent = () => {
    let content = null;
    let headerClass = "";
    let headerText = "";
    let HeaderIcon = null;

    if (currentViewIndex === 0) {
      // --- PENDING ---
      headerClass = "header-yellow";
      headerText = "Sự kiện chờ duyệt";
      HeaderIcon = ClockCircleOutlined;
      content = data?.col1_pending?.map((ev) => (
        <div key={ev.event_id} className="dashboard-item pending-item">
          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 8}}>
               <Tag color="warning"><ClockCircleOutlined /> PENDING</Tag>
               <span className="text-xs text-grey">Chờ {ev.days_waiting} ngày</span>
            </div>
            <Link to={`/events/${ev.event_id}`} className="text-bold" style={{ fontSize: 16, color: "#333", display: "block", marginBottom: 8 }}>
              {ev.title}
            </Link>
            <div className="text-sm text-grey" style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div><EnvironmentOutlined /> {ev.location}</div>
              <div><CalendarOutlined /> {new Date(ev.start_date).toLocaleDateString("vi-VN")}</div>
              <div><TeamOutlined /> {ev.current_participants}/{ev.target_participants} người</div>
            </div>
          </div>
          <div style={{ marginTop: 16, borderTop: "1px dashed #d9d9d9", paddingTop: 12 }}>
            <Button type="primary" style={{ background: "#faad14", borderColor: "#faad14", fontWeight: "bold" }} block icon={<EditOutlined />} onClick={() => navigate(`/manager/events/${ev.event_id}/edit`)}>
              CHỈNH SỬA
            </Button>
          </div>
        </div>
      ));
      if (!data?.col1_pending?.length) content = <Empty description="Không có sự kiện chờ duyệt" />;
    } 
    
    else if (currentViewIndex === 1) {
      // --- ACTIVITY ---
      headerClass = "header-blue";
      headerText = "Hoạt động mới";
      HeaderIcon = MessageFilled;
      content = data?.col2_activity?.map((item, idx) => (
        <div key={`act-${idx}`} className="dashboard-item" style={{ borderLeft: "4px solid #1890ff" }}>
          <div>
            <div style={{ fontSize: 12, color: "#1890ff", fontWeight: "bold", marginBottom: 10 }}>
               <BellOutlined /> {item.event_title}
            </div>
            <div style={{ fontSize: 11, color: "#888", marginBottom: 10 }}>
              <EnvironmentOutlined /> {item.location} • <TeamOutlined /> {item.current_participants}/{item.target_participants}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <Avatar src={item.author_avatar} icon={<UserOutlined />} size="small" />
              <div style={{ flex: 1 }}>
                <div className="text-sm">
                  <b>{item.author_name}</b> {item.type === "post" ? "vừa đăng tin:" : "vừa bình luận:"}
                </div>
                <div className="feed-quote">"{item.content.substring(0, 80)}..."</div>
                <div style={{ fontSize: 11, color: "#999", display: "flex", justifyContent: "space-between" }}>
                  <span><ClockCircleOutlined /> {timeAgo(item.created_at)}</span>
                  {item.type === "post" && (
                    <span><LikeOutlined /> {item.like_count} • <CommentOutlined /> {item.comment_count}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 12, paddingTop: 8, borderTop: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
             <div style={{ fontSize: 10, color: "#555" }}><FileTextOutlined /> +{item.event_new_posts_24h} bài/24h</div>
             <Link to={`/events/${item.event_id}`}><Button type="link" size="small" style={{ padding: 0 }}>Xem ngay →</Button></Link>
          </div>
        </div>
      ));
      if (!data?.col2_activity?.length) content = <Empty description="Chưa có hoạt động mới" />;
    } 
    
    else if (currentViewIndex === 2) {
      /* ========================================================= */
      /* TAB 3: TRENDING */
      /* ========================================================= */
      headerClass = "header-red";
      headerText = "Sự kiện thu hút của bạn";
      HeaderIcon = FireFilled;

      content = data?.col3_trending?.map((ev, idx) => (
        <div 
          key={ev.event_id} 
          // Thêm class clickable-card và sự kiện onClick
          className={`dashboard-item trending-item clickable-card ${idx === 0 ? "rank-1" : ""}`}
          onClick={() => navigate(`/events/${ev.event_id}`)}
        >
          {/* Nội dung bên trong thẻ */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <Tag color={idx === 0 ? "red" : idx === 1 ? "orange" : "blue"}>
                <StarFilled /> {idx === 0 ? "RẤT HOT" : idx === 1 ? "ĐANG LÊN" : "ĐÁNG CHÚ Ý"}
              </Tag>
              <Tooltip title="Điểm Trending">
                <Tag color="gold"><StarOutlined /> {ev.engagement_score}</Tag>
              </Tooltip>
            </div>

            {/* Title */}
            <div className="text-bold" style={{ fontSize: 16, color: "#cf1322", marginBottom: 6 }}>
              {ev.title}
            </div>

            <div style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>
               <EnvironmentOutlined /> {ev.location} • <TeamOutlined /> {ev.current_participants}/{ev.target_participants}
            </div>

            {/* Growth Box */}
            <div className="growth-box">
              <div style={{ fontSize: 11, fontWeight: "bold", color: "#555", marginBottom: 6 }}>
                <RiseOutlined /> TĂNG TRƯỞNG 24H:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
                 <div style={{ color: "green" }}><ArrowUpOutlined /> +{ev.new_participants_24h} người</div>
                 <div style={{ color: "blue" }}><FileTextOutlined /> +{ev.new_posts_24h} bài</div>
                 <div style={{ color: "#f5222d" }}><LikeOutlined /> +{ev.new_likes_24h} thích</div>
                 <div style={{ color: "#fa8c16" }}><CommentOutlined /> +{ev.new_comments_24h} cmt</div>
              </div>
            </div>
          </div>
          
          {/* Gợi ý bấm (Optional - hoặc bỏ đi vì toàn thẻ đã bấm được) */}
          <div style={{textAlign: 'center', marginTop: 12, color: '#1890ff', fontSize: 12, fontStyle: 'italic'}}>
            
          </div>
        </div>
      ));
      if (!data?.col3_trending?.length) content = <Empty description="Chưa có dữ liệu trending" />;
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
      {/* ========================================================= */}
      <div className="stats-grid-container">
          <div className="stats-card stats-blue">
            <div className="stats-value">{data?.stats?.total_created}</div>
            <div className="stats-label"><FileTextOutlined /> sự kiện Đã tạo</div>
          </div>

          <div className="stats-card stats-orange">
            <div className="stats-value">{data?.stats?.total_pending}</div>
            <div className="stats-label"><ExclamationCircleOutlined /> sự kiện Chờ duyệt</div>
          </div>

          <div className="stats-card stats-green">
            <div className="stats-value">{data?.stats?.total_approved}</div>
            <div className="stats-label"><CheckCircleOutlined /> sự kiện Đã duyệt</div>
          </div>

          <div className="stats-card stats-red">
            <div className="stats-value">{data?.stats?.total_running}</div>
            <div className="stats-label"><PlayCircleFilled /> Đang diễn ra</div>
          </div>

          <div className="stats-card stats-grey">
            <div className="stats-value">{data?.stats?.total_completed}</div>
            <div className="stats-label"><CheckCircleOutlined /> Đã xong</div>
          </div>
      </div>

      {/* ========================================================= */}
      <div className="custom-tabs-container">
        <div className="custom-tabs">
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

      {/* ========================================================= */}
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
         {renderContent()}
      </div>
    </div>
  );
};

export default ManagerDashboard;