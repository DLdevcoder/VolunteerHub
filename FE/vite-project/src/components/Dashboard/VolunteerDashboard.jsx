// src/components/Dashboard/VolunteerDashboard.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux"; // Lấy user từ Redux
import dashboardApi from "../../../apis/dashboardApi";
import ActivityWidget from "./ActivityWidget";
import "./VolunteerDashboard.css";

// Import Icons
import { FaFire, FaVideo, FaImages, FaSmile } from "react-icons/fa";
import { MdFiberNew, MdEventAvailable } from "react-icons/md";
import { UserOutlined } from "@ant-design/icons"; // Hoặc icon mặc định nếu không có avatar

const VolunteerDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lấy thông tin user đăng nhập để hiển thị avatar ở ô post
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const response = await dashboardApi.getDashboard();
        if (response.success) {
          setDashboardData(response.data);
        }
      } catch (err) {
        console.error(err);
        setError("Không thể tải dữ liệu.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading)
    return (
      <div
        style={{
          padding: 50,
          textAlign: "center",
          background: "#f0f2f5",
          minHeight: "100vh",
        }}
      >
        Đang tải bảng tin...
      </div>
    );

  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* --- CỘT TRÁI: News Feed (Đã mở rộng) --- */}
        <div className="news-feed">
          {/* Status Composer (Khung đăng bài giả) */}
          <div className="create-post-card">
            <div className="create-post-top">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="User"
                  className="user-avatar-circle"
                />
              ) : (
                <div className="user-avatar-circle">
                  <UserOutlined style={{ fontSize: 20 }} />
                </div>
              )}

              <div className="status-input">
                {user?.full_name
                  ? `Chào ${user.full_name}, bạn đang nghĩ gì?`
                  : "Bạn đang nghĩ gì?"}
              </div>
            </div>
            <div className="create-post-actions">
              <div className="action-btn">
                <FaVideo className="icon-video" /> Video trực tiếp
              </div>
              <div className="action-btn">
                <FaImages className="icon-photo" /> Ảnh/Video
              </div>
              <div className="action-btn">
                <FaSmile className="icon-feeling" /> Cảm xúc
              </div>
            </div>
          </div>

          {/* Danh sách bài đăng */}
          <ActivityWidget events={dashboardData?.events_with_new_posts} />
        </div>

        {/* --- CỘT PHẢI: Sidebar Sự kiện --- */}
        <div className="right-sidebar">
          {/* Widget: Sự kiện Hot */}
          <div className="sidebar-card">
            <div className="sidebar-heading">
              <FaFire style={{ color: "#f02849" }} /> Sự kiện Nổi bật
            </div>
            {dashboardData?.trending_events?.map((event) => (
              <Link
                key={event.event_id}
                to={`/events/${event.event_id}`}
                className="event-sidebar-item"
              >
                <div
                  className="event-icon-box"
                  style={{ backgroundColor: "#ffebeb", color: "#f02849" }}
                >
                  <FaFire />
                </div>
                <div className="event-sidebar-info">
                  <h4>{event.title}</h4>
                  <p>{event.current_participants} người tham gia</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Widget: Sự kiện Mới */}
          <div className="sidebar-card">
            <div className="sidebar-heading">
              <MdFiberNew style={{ color: "#45bd62", fontSize: 24 }} /> Mới công
              bố
            </div>
            {dashboardData?.new_events?.map((event) => (
              <Link
                key={event.event_id}
                to={`/events/${event.event_id}`}
                className="event-sidebar-item"
              >
                <div
                  className="event-icon-box"
                  style={{ backgroundColor: "#e7f3ff", color: "#1877f2" }}
                >
                  <MdEventAvailable />
                </div>
                <div className="event-sidebar-info">
                  <h4>{event.title}</h4>
                  <p>{new Date(event.start_date).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
