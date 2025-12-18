import React, { useEffect, useState } from "react";
import { Spin, Empty, Avatar, Tag, Button, Tooltip, Pagination } from "antd";
import {
  ClockCircleOutlined, MessageFilled, FireFilled, CalendarOutlined,
  EnvironmentOutlined, UserOutlined, EditOutlined, ArrowUpOutlined,
  FileTextOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
  PlayCircleFilled, RightOutlined, StarFilled, RiseOutlined, RightCircleFilled, StarOutlined, TeamOutlined
} from "@ant-design/icons";

import { useNavigate, Link } from "react-router-dom";
import dashboardApi from "../../../apis/dashboardApi";
import "./Dashboard.css";

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentViewIndex, setCurrentViewIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getDashboard();
        if (res.success) setData(res.data);
      } catch (error) {
        console.error("Lỗi tải data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [currentViewIndex]);

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

  const renderContent = () => {
    let content = null;
    let headerText = "";
    let HeaderIcon = null;
    let sourceData = [];
    let isGridView = false;

    // --- TAB 0: CHỜ DUYỆT ---
    if (currentViewIndex === 0) {
      headerText = "Sự kiện chờ duyệt";
      HeaderIcon = ClockCircleOutlined;
      sourceData = data?.col1_pending || [];
      const currentData = getPaginatedData(sourceData);
      content = currentData.map((ev) => (
        <div key={ev.event_id} className="horizontal-item">
          <div style={{ flex: 1, paddingRight: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Tag color="#578FCA">PENDING</Tag>
              <span style={{ fontSize: 13, color: "#888" }}>Chờ {ev.days_waiting} ngày</span>
            </div>
            <Link to={`/events/${ev.event_id}`} className="item-info-title" style={{ display: "block" }}>{ev.title}</Link>
            <div style={{ display: "flex", gap: 16, color: "#666", fontSize: 14 }}>
               <span><EnvironmentOutlined /> {ev.location}</span>
               <span><UserOutlined /> {ev.current_participants}/{ev.target_participants}</span>
            </div>
          </div>
          <Button type="primary" icon={<EditOutlined />} onClick={() => navigate(`/manager/events/${ev.event_id}/edit`)}>Sửa</Button>
        </div>
      ));
    } 

    // --- TAB 1: HOẠT ĐỘNG ---
    else if (currentViewIndex === 1) {
      headerText = "Hoạt động mới";
      HeaderIcon = MessageFilled;
      sourceData = data?.col2_activity || [];
      const currentData = getPaginatedData(sourceData);
      isGridView = true;
      content = currentData.map((item, idx) => (
        <div key={`act-${idx}`} className="activity-card">
          <div className="act-card-header">
            <Avatar src={item.author_avatar} icon={<UserOutlined />} size={40} />
            <div><div style={{ fontWeight: "bold" }}>{item.author_name}</div><div style={{ fontSize: 12, color: "#999" }}>{timeAgo(item.created_at)}</div></div>
          </div>
          <div className="act-card-content">"{item.content}"</div>
          <div className="act-card-footer">
             <div><div style={{ fontSize: 11, color: "#3674B5", fontWeight: "bold" }}>{item.type.toUpperCase()}</div><div style={{ fontWeight: 600 }}>{item.event_title}</div></div>
             <Button shape="circle" icon={<RightCircleFilled style={{fontSize: 24, color: "#578FCA"}} />} type="text" onClick={() => navigate(`/events/${item.event_id}`)} />
          </div>
        </div>
      ));
    }

    // --- TAB 2: TRENDING ---
    else {
      headerText = "Sự kiện thu hút";
      HeaderIcon = FireFilled;
      sourceData = data?.col3_trending || [];
      const currentData = getPaginatedData(sourceData);

      content = currentData.map((ev, idx) => {
         const realRank = (currentPage - 1) * pageSize + idx;
         return (
          <div 
            key={ev.event_id} 
            className="horizontal-item clickable-card"
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            onClick={() => navigate(`/events/${ev.event_id}`)}
          >
            {}
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
               
               {/* PHẦN 1: THÔNG TIN */}
                         <div style={{ paddingRight: 24, maxWidth: "65%" }}>
                           <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                             <Tag color={realRank === 0 ? "#f5222d" : "#3674B5"} style={{ margin: 0 }}>
                               {realRank === 0 ? "TOP 1" : `TOP ${realRank + 1}`}
                             </Tag>
                             <Tag color="gold" style={{ margin: 0 }}>
                               <StarFilled /> {ev.engagement_score} điểm
                             </Tag>
                           </div>
               
                           <div 
                             style={{ fontSize: 18, fontWeight: "bold", color: "#333", marginBottom: 8 }}
                           >
                             {ev.title}
                           </div>
               
                           <div style={{ display: "flex", gap: 16, color: "#666", fontSize: 14 }}>
                              <span><EnvironmentOutlined /> {ev.location}</span>
                              <span><UserOutlined /> {ev.current_participants}/{ev.target_participants} người</span>
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

            {/* PHẦN 3: NÚT ĐIỀU HƯỚNG TRÒN (ĐẨY SANG PHẢI) */}
            <div className="item-action-col">
              <div className="arrow-btn-circle">
                <RightOutlined />
              </div>
            </div>
          </div>
         );
      });
    }

    return (
      <div className="dashboard-section animation-fade-in">
        <div className="section-header"><HeaderIcon /> {headerText}</div>
        <div className={isGridView ? "activity-grid-container" : "list-layout-container"}>{content}</div>
        <Pagination current={currentPage} pageSize={pageSize} total={sourceData.length} onChange={(page) => setCurrentPage(page)} showSizeChanger={false} style={{ marginTop: 24, textAlign: 'center' }} />
      </div>
    );
  };

  if (loading) return <div style={{ padding: 100, textAlign: "center" }}><Spin size="large" /></div>;

  return (
    <div className="dashboard-container">
      {/* GIỮ NGUYÊN 5 Ô STATS CỦA MANAGER */}
      <div className="stats-grid-container">
          <div className="stats-card-modern card-theme-1"><div className="stats-left"><span className="stats-title">Đã tạo</span><span className="stats-number">{data?.stats?.total_created}</span></div><div className="stats-icon-bg"><FileTextOutlined /></div></div>
          <div className="stats-card-modern card-theme-3"><div className="stats-left"><span className="stats-title">Chờ duyệt</span><span className="stats-number">{data?.stats?.total_pending}</span></div><div className="stats-icon-bg"><ExclamationCircleOutlined /></div></div>
          <div className="stats-card-modern card-theme-2"><div className="stats-left"><span className="stats-title">Đã duyệt</span><span className="stats-number">{data?.stats?.total_approved}</span></div><div className="stats-icon-bg"><CheckCircleOutlined /></div></div>
          <div className="stats-card-modern card-theme-4"><div className="stats-left"><span className="stats-title">Đang diễn ra</span><span className="stats-number">{data?.stats?.total_running}</span></div><div className="stats-icon-bg"><PlayCircleFilled /></div></div>
          <div className="stats-card-modern card-theme-5"><div className="stats-left"><span className="stats-title">Đã xong</span><span className="stats-number">{data?.stats?.total_completed}</span></div><div className="stats-icon-bg"><CheckCircleOutlined /></div></div>
      </div>

      <div className="custom-tabs-container">
        <div className="custom-tabs">
          <div className="tab-glider tab-theme-blue" style={{ width: "calc((100% - 8px) / 3)", transform: `translateX(${currentViewIndex * 100}%)`, backgroundColor: "#3674B5" }}></div>
          {tabs.map((tab, index) => (
            <button key={tab.key} className={`tab-btn ${currentViewIndex === index ? "active" : ""}`} onClick={() => setCurrentViewIndex(index)}>
              <span style={{ marginRight: 6 }}>{tab.icon}</span>{tab.label}
            </button>
          ))}
        </div>
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>{renderContent()}</div>
    </div>
  );
};

export default ManagerDashboard;