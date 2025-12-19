import React, { useEffect, useState } from "react";
import {
  Spin,
  Empty,
  Avatar,
  Tag,
  Button,
  Tooltip,
  Pagination,
} from "antd";

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6; // Đã thiết lập tối đa 6 item 1 trang

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getDashboard();
        if (res.success) setData(res.data);
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

  const renderContent = () => {
    let content = null;
    let headerText = "";
    let HeaderIcon = null;
    let sourceData = [];
    let isGridView = false;

    /* TAB 0: SỰ KIỆN MỚI */
    if (currentViewIndex === 0) {
      headerText = "Sự kiện mới công bố";
      HeaderIcon = ThunderboltFilled;
      sourceData = data?.col1_new || [];
      const currentData = getPaginatedData(sourceData);

      content = currentData.map((ev) => (
        <div 
            key={ev.event_id} 
            className="horizontal-item clickable-card"
            style={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            onClick={() => navigate(`/events/${ev.event_id}`)}
        >
          <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
            
            {/* --- ÁP DỤNG CLASS MỚI CHO PHẦN THÔNG TIN --- */}
            <div className="trending-info-section">
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Tag color="#1890ff" style={{ margin: 0 }}>NEW</Tag>
                <span style={{ fontSize: 13, color: "#888" }}>
                  <CalendarOutlined /> {new Date(ev.start_date).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div 
                style={{ 
                  fontSize: 18, 
                  fontWeight: "bold", 
                  color: "#3674B5", 
                  marginBottom: 8,
                  whiteSpace: "nowrap", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis" 
                }}
                title={ev.title}
              >
                {ev.title}
              </div>
              <div style={{ display: "flex", gap: 16, color: "#666", fontSize: 14 }}>
                 <span><EnvironmentOutlined /> {ev.location}</span>
                 <span><TeamOutlined /> {ev.current_participants}/{ev.target_participants || "∞"} người</span>
              </div>
            </div>

            {/* --- ÁP DỤNG CLASS MỚI CHO PHẦN THỐNG KÊ --- */}
            <div 
              className="trending-growth-section"
              style={{ 
                display: "flex", 
                flexDirection: "column", 
                gap: 4, 
                paddingLeft: 24, 
                borderLeft: "1px solid #eee", 
                minWidth: 100 
              }}
            >
               <div style={{fontSize: 13, color: "#666"}}>
                  <FileTextOutlined style={{color: "#3674B5", marginRight: 6}} /> <b>{ev.total_posts}</b> bài
               </div>
               <div style={{fontSize: 13, color: "#666"}}>
                  <LikeOutlined style={{color: "#ff4d4f", marginRight: 6}} /> <b>{ev.total_reactions}</b> tương tác
               </div>
               <div style={{fontSize: 13, color: "#666"}}>
                  <CommentOutlined style={{color: "#faad14", marginRight: 6}} /> <b>{ev.total_comments}</b> bình luận
               </div>
            </div>
          </div>
          <div className="item-action-col">
            <div className="arrow-btn-circle"><RightOutlined /></div>
          </div>
        </div>
      ));
    }

    /* TAB 1: HOẠT ĐỘNG */
    else if (currentViewIndex === 1) {
      headerText = "Hoạt động mới";
      HeaderIcon = MessageFilled;
      sourceData = data?.col2_feed || [];
      const currentData = getPaginatedData(sourceData);
      isGridView = true;

      content = currentData.map((item, idx) => (
        <div key={`feed-${idx}`} className="activity-card">
          <div className="act-card-header">
            <Avatar src={item.author_avatar} icon={<UserOutlined />} size={40} />
            <div>
              <div style={{ fontWeight: "bold", color: "#333" }}>{item.author_name}</div>
              <div style={{ fontSize: 12, color: "#999" }}>
                {timeAgo(item.created_at)} • {item.type === "post" ? "Đăng bài" : "Bình luận"}
              </div>
            </div>
          </div>
          <div className="act-card-content">{item.content}</div>
          <div className="act-card-footer">
             <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: 11, color: "#3674B5", fontWeight: "bold", marginBottom: 2 }}>
                   {item.type === "post" ? "POST" : "COMMENT"}
                </div>
                <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "180px" }} title={item.event_title}>
                  {item.event_title}
                </div>
             </div>
             <Tooltip title="Xem chi tiết">
                <Button shape="circle" icon={<RightCircleFilled style={{fontSize: 24, color: "#578FCA"}} />} type="text" onClick={() => navigate(`/events/${item.event_id}`)} />
             </Tooltip>
          </div>
        </div>
      ));
    } 

    /* TAB 2: TRENDING */
    else {
      headerText = "Sự kiện thu hút";
      HeaderIcon = FireFilled;
      sourceData = data?.col3_trending || [];
      const currentData = getPaginatedData(sourceData);

      content = currentData.map((ev, idx) => {
        const realRank = (currentPage - 1) * pageSize + idx;
        return (
          <div key={ev.event_id} className="horizontal-item clickable-card" style={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => navigate(`/events/${ev.event_id}`)}>
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
              
              {/* --- ÁP DỤNG CLASS MỚI CHO PHẦN THÔNG TIN --- */}
              <div className="trending-info-section">
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Tag color={realRank === 0 ? "#f5222d" : "#3674B5"} style={{ margin: 0 }}>
                    {realRank === 0 ? "TOP 1" : `TOP ${realRank + 1}`}
                  </Tag>
                </div>
                <div 
                  style={{ 
                    fontSize: 18, 
                    fontWeight: "bold", 
                    color: "#333", 
                    marginBottom: 8,
                    whiteSpace: "nowrap", 
                    overflow: "hidden", 
                    textOverflow: "ellipsis" 
                  }}
                  title={ev.title}
                >
                  {ev.title}
                </div>
                <div style={{ display: "flex", gap: 16, color: "#666", fontSize: 14 }}>
                   <span><EnvironmentOutlined /> {ev.location}</span>
                   <span><TeamOutlined /> {ev.current_participants}/{ev.target_participants} người</span>
                </div>
              </div>

              {/* --- ÁP DỤNG CLASS MỚI CHO PHẦN TĂNG TRƯỞNG --- */}
              <div 
                className="trending-growth-section"
                style={{ 
                   display: "flex", 
                   flexDirection: "column", 
                   gap: 4, 
                   paddingLeft: 24, 
                   borderLeft: "1px solid #eee", 
                   minWidth: 160 
                }}
              >
                 <div style={{ fontSize: 11, fontWeight: "bold", color: "#888", marginBottom: 2 }}><RiseOutlined /> TĂNG TRƯỞNG 24H</div>
                 <div style={{ fontSize: 13, color: "#389e0d", fontWeight: 600 }}><ArrowUpOutlined style={{ marginRight: 6 }} /> +{ev.new_participants_24h} người</div>
                 <div style={{ fontSize: 13, color: "#3674B5", fontWeight: 600 }}><FileTextOutlined style={{ marginRight: 6 }} /> +{ev.new_posts_24h} bài đăng</div>
              </div>
            </div>

            <div style={{ textAlign: "center", paddingLeft: 30, minWidth: 120, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
               <div style={{ fontSize: 12, color: "#999", marginBottom: 4 }}>Điểm</div>
               <div style={{ fontSize: 28, fontWeight: "bold", color: "#3674B5", lineHeight: 1 }}>{ev.engagement_score}</div>
               <div style={{ marginTop: 6 }}><StarFilled style={{ color: "#fadb14", fontSize: 20 }} /></div>
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

        <div className={isGridView ? "activity-grid-container" : "list-layout-container"}>
          {content.length > 0 ? content : <Empty description="Chưa có dữ liệu" />}
        </div>

        {/* PHẦN PHÂN TRANG ĐÃ CĂN TRÁI */}
        {sourceData.length > pageSize && (
          <div style={{ 
            marginTop: 24, 
            display: "flex", 
            justifyContent: "flex-start" // Đã đổi từ center sang flex-start để dịch sang trái
          }}>
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
      <div className="custom-tabs-container">
        <div className="custom-tabs">
          <div className={`tab-glider tab-theme-blue`}
               style={{ 
                 width: "calc((100% - 8px) / 3)",
                 transform: `translateX(${currentViewIndex * 100}%)`,
                 backgroundColor: "#3674B5"
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

      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
         {renderContent()}
      </div>
    </div>
  );
};

export default VolunteerDashboard;