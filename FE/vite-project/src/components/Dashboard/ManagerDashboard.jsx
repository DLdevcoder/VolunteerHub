import React, { useEffect, useState } from "react";
import {
  Row,
  Col,
  Spin,
  Empty,
  Avatar,
  Tag,
  Button,
  Tooltip,
  Typography,
} from "antd";

import {
  ClockCircleOutlined,
  MessageFilled,
  FireFilled,
  CalendarOutlined,
  EnvironmentOutlined,
  UserOutlined,
  EditOutlined,
  EyeOutlined,
  ArrowUpOutlined,
  LikeOutlined,
  CommentOutlined,
  FileTextOutlined,
  BarChartOutlined,
  TeamOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  PlayCircleFilled,
  StarFilled,
  StarOutlined,
  RiseOutlined,
  BellOutlined, // <-- thêm đây
} from "@ant-design/icons";

import { Link } from "react-router-dom";
import dashboardApi from "../../../apis/dashboardApi";
import "./Dashboard.css";

const { Text } = Typography;

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div className="dashboard-container">
      {/* ========================================================= */}
      {/* 1. THỐNG KÊ TỔNG QUAN */}
      {/* ========================================================= */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={5}>
          <div className="stats-card stats-blue">
            <div className="stats-value">{data?.stats?.total_created}</div>
            <div className="stats-label">
              <FileTextOutlined /> sự kiện Đã tạo
            </div>
          </div>
        </Col>

        <Col span={5}>
          <div className="stats-card stats-orange">
            <div className="stats-value">{data?.stats?.total_pending}</div>
            <div className="stats-label">
              <ExclamationCircleOutlined /> sự kiện Chờ duyệt
            </div>
          </div>
        </Col>

        <Col span={5}>
          <div className="stats-card stats-green">
            <div className="stats-value">{data?.stats?.total_approved}</div>
            <div className="stats-label">
              <CheckCircleOutlined style={{ color: "green" }} /> sự kiện Đã
              duyệt
            </div>
          </div>
        </Col>

        <Col span={5}>
          <div className="stats-card stats-red">
            <div className="stats-value">{data?.stats?.total_running}</div>
            <div className="stats-label">
              <PlayCircleFilled style={{ color: "red" }} /> Đang diễn ra
            </div>
          </div>
        </Col>

        <Col span={4}>
          <div className="stats-card stats-grey">
            <div className="stats-value">{data?.stats?.total_completed}</div>
            <div className="stats-label">
              <CheckCircleOutlined /> Đã xong
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={24}>
        {/* ========================================================= */}
        {/* CỘT 1: CHỜ DUYỆT */}
        {/* ========================================================= */}
        <Col xs={24} md={8}>
          <div className="dashboard-section">
            <div className="section-header header-yellow">
              <ClockCircleOutlined /> Sự kiện chờ duyệt
            </div>

            <div className="section-body custom-scroll">
              {data?.col1_pending?.map((ev) => (
                <div key={ev.event_id} className="dashboard-item pending-item">
                  <Link
                    to={`/events/${ev.event_id}`}
                    className="text-bold"
                    style={{ fontSize: 15, color: "#333" }}
                  >
                    • "{ev.title}"
                  </Link>

                  <div className="text-sm text-grey" style={{ marginTop: 8 }}>
                    <div>
                      <EnvironmentOutlined /> {ev.location}
                    </div>

                    <div>
                      <CalendarOutlined />{" "}
                      {new Date(ev.start_date).toLocaleDateString("vi-VN")}
                    </div>

                    <div>
                      <TeamOutlined /> {ev.current_participants}/
                      {ev.target_participants} người
                    </div>

                    <div
                      style={{
                        color: "#d46b08",
                        fontWeight: "bold",
                        marginTop: 4,
                      }}
                    >
                      <ClockCircleOutlined /> Đã chờ {ev.days_waiting} ngày
                    </div>
                  </div>

                  <div style={{ marginTop: 10, display: "flex", gap: 8 }}>
                    <Link to={`/events/${ev.event_id}/edit`}>
                      <Button size="small" icon={<EditOutlined />}>
                        CHỈNH SỬA
                      </Button>
                    </Link>

                    <Link to={`/events/${ev.event_id}`}>
                      <Button size="small" icon={<EyeOutlined />}>
                        XEM TRƯỚC
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {!data?.col1_pending?.length && (
                <Empty
                  description="Không có sự kiện chờ duyệt"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </div>
        </Col>

        {/* ========================================================= */}
        {/* CỘT 2: HOẠT ĐỘNG MỚI */}
        {/* ========================================================= */}
        <Col xs={24} md={9}>
          <div className="dashboard-section">
            <div className="section-header header-blue">
              <MessageFilled /> Hoạt động mới (Đã duyệt)
            </div>

            <div className="section-body custom-scroll">
              {data?.col2_activity?.map((item, idx) => (
                <div
                  key={`act-${idx}`}
                  className="dashboard-item"
                  style={{ borderLeft: "4px solid #1890ff" }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      color: "#1890ff",
                      fontWeight: "bold",
                      marginBottom: 6,
                    }}
                  >
                    <span>
                      <BellOutlined /> "{item.event_title}"
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: "#888", marginBottom: 8 }}>
                    <EnvironmentOutlined /> {item.location} • <TeamOutlined />{" "}
                    {item.current_participants}/{item.target_participants}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <Avatar
                      src={item.author_avatar}
                      icon={<UserOutlined />}
                      size="small"
                    />

                    <div style={{ flex: 1 }}>
                      <div className="text-sm">
                        <b>{item.author_name}</b>{" "}
                        {item.type === "post"
                          ? "vừa đăng tin:"
                          : "vừa bình luận:"}
                      </div>

                      <div className="feed-quote">
                        "{item.content.substring(0, 80)}..."
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color: "#999",
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          <ClockCircleOutlined /> {timeAgo(item.created_at)}
                        </span>

                        {item.type === "post" && (
                          <span>
                            <LikeOutlined /> {item.like_count} •{" "}
                            <CommentOutlined /> {item.comment_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: "1px solid #f0f0f0",
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ fontSize: 11, color: "#555" }}>
                      <FileTextOutlined /> {item.event_new_posts_24h} bài
                      mới/24h • <CommentOutlined />{" "}
                      {item.event_new_comments_24h} cmt mới/24h
                    </div>

                    <Link to={`/events/${item.event_id}`}>
                      <Button type="link" size="small" style={{ padding: 0 }}>
                        VÀO XEM NGAY →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {!data?.col2_activity?.length && (
                <Empty
                  description="Chưa có hoạt động mới"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </div>
        </Col>

        {/* ========================================================= */}
        {/* CỘT 3: SỰ KIỆN HOT */}
        {/* ========================================================= */}
        <Col xs={24} md={7}>
          <div className="dashboard-section">
            <div className="section-header header-red">
              <FireFilled /> Sự kiện thu hút của bạn
            </div>

            <div className="section-body custom-scroll">
              {data?.col3_trending?.map((ev, idx) => (
                <div
                  key={ev.event_id}
                  className={`dashboard-item trending-item ${idx === 0 ? "rank-1" : ""}`}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <Tag
                      color={idx === 0 ? "red" : idx === 1 ? "orange" : "blue"}
                    >
                      <StarFilled />{" "}
                      {idx === 0
                        ? "RẤT HOT"
                        : idx === 1
                          ? "ĐANG LÊN"
                          : "ĐÁNG CHÚ Ý"}
                    </Tag>

                    <Tooltip title="Điểm Trending">
                      <Tag color="gold">
                        <StarOutlined /> {ev.engagement_score}
                      </Tag>
                    </Tooltip>
                  </div>

                  <Link
                    to={`/events/${ev.event_id}`}
                    className="text-bold"
                    style={{ fontSize: 14, color: "#cf1322" }}
                  >
                    "{ev.title}"
                  </Link>

                  <div style={{ fontSize: 11, color: "#888", marginTop: 4 }}>
                    <EnvironmentOutlined /> {ev.location} • <TeamOutlined />{" "}
                    {ev.current_participants}/{ev.target_participants}
                  </div>

                  <div className="growth-box" style={{ marginTop: 8 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#555",
                        marginBottom: 4,
                      }}
                    >
                      <RiseOutlined /> TĂNG TRƯỞNG 24H:
                    </div>

                    <div
                      style={{
                        fontSize: 12,
                        color: "#666",
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 4,
                      }}
                    >
                      <div style={{ color: "green" }}>
                        <ArrowUpOutlined /> +{ev.new_participants_24h} người
                      </div>

                      <div style={{ color: "blue" }}>
                        <FileTextOutlined /> +{ev.new_posts_24h} bài
                      </div>

                      <div style={{ color: "#f5222d" }}>
                        <LikeOutlined /> +{ev.new_likes_24h} thích
                      </div>

                      <div style={{ color: "#fa8c16" }}>
                        <CommentOutlined /> +{ev.new_comments_24h} cmt
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 10, textAlign: "center" }}>
                    <Link to={`/events/${ev.event_id}/analytics`}>
                      <Button size="small" icon={<BarChartOutlined />} block>
                        XEM PHÂN TÍCH
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {!data?.col3_trending?.length && (
                <Empty
                  description="Chưa có dữ liệu trending"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default ManagerDashboard;
