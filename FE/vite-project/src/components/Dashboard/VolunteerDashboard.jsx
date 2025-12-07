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
  RightOutlined,
  FileTextOutlined,
  StarFilled,
  RiseOutlined,
  BellOutlined, // thay 🔔
} from "@ant-design/icons";

import { Link } from "react-router-dom";
import dashboardApi from "../../../apis/dashboardApi";
import "./Dashboard.css";

const { Text } = Typography;

const VolunteerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading)
    return (
      <div style={{ padding: 100, textAlign: "center" }}>
        <Spin size="large" />
      </div>
    );

  return (
    <div className="dashboard-container">
      <Row gutter={24}>
        {/* =========================================================== */}
        {/* 1) SỰ KIỆN MỚI CÔNG BỐ */}
        {/* =========================================================== */}
        <Col xs={24} md={8}>
          <div className="dashboard-section">
            <div className="section-header header-blue">
              <ThunderboltFilled /> Sự kiện mới công bố
            </div>

            <div className="section-body custom-scroll">
              {data?.col1_new?.map((ev) => (
                <div key={ev.event_id} className="dashboard-item new-item">
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 5,
                    }}
                  >
                    <Tag color="blue" style={{ fontWeight: "bold" }}>
                      <ThunderboltFilled /> MỚI
                    </Tag>

                    <span className="text-xs text-grey">
                      <CalendarOutlined />{" "}
                      {new Date(ev.start_date).toLocaleDateString("vi-VN")}
                    </span>
                  </div>

                  <Link
                    to={`/events/${ev.event_id}`}
                    className="text-bold"
                    style={{ fontSize: 16, color: "#333" }}
                  >
                    {ev.title}
                  </Link>

                  <div className="text-sm text-grey" style={{ marginTop: 8 }}>
                    <div>
                      <EnvironmentOutlined /> {ev.location}
                    </div>

                    <div style={{ fontWeight: 600, color: "#333" }}>
                      <UserOutlined /> {ev.current_participants}/
                      {ev.target_participants || "∞"} người
                    </div>

                    <div
                      style={{
                        display: "flex",
                        gap: 12,
                        marginTop: 6,
                        fontSize: 12,
                        borderTop: "1px solid #f0f0f0",
                        paddingTop: 6,
                      }}
                    >
                      <span>
                        <FileTextOutlined /> {ev.total_posts} bài
                      </span>
                      <span style={{ color: "#faad14" }}>
                        <LikeOutlined /> {ev.total_reactions}
                      </span>
                      <span style={{ color: "#1890ff" }}>
                        <CommentOutlined /> {ev.total_comments}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 10,
                      borderTop: "1px dashed #eee",
                      paddingTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        color: "#52c41a",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    >
                      <CheckCircleFilled /> Đã duyệt
                    </span>

                    <Link to={`/events/${ev.event_id}`}>
                      <Button size="small" type="link">
                        XEM CHI TIẾT →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {!data?.col1_new?.length && (
                <Empty description="Chưa có sự kiện mới" />
              )}
            </div>
          </div>
        </Col>

        {/* =========================================================== */}
        {/* 2) FEED HOẠT ĐỘNG */}
        {/* =========================================================== */}
        <Col xs={24} md={8}>
          <div className="dashboard-section">
            <div className="section-header header-orange">
              <MessageFilled /> Tin mới (Đã tham gia)
            </div>

            <div className="section-body custom-scroll">
              {data?.col2_feed?.map((item, idx) => (
                <div key={`feed-${idx}`} className="dashboard-item feed-item">
                  <div
                    style={{
                      fontSize: 12,
                      color: "#fa8c16",
                      fontWeight: "bold",
                      marginBottom: 8,
                    }}
                  >
                    <BellOutlined /> {item.event_title}
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <Avatar src={item.author_avatar} icon={<UserOutlined />} />

                    <div style={{ flex: 1 }}>
                      <div>
                        <span className="text-bold">{item.author_name}</span>
                        <span className="text-xs text-grey">
                          {item.type === "post"
                            ? " đã đăng bài:"
                            : " đã bình luận:"}
                        </span>
                      </div>

                      <div className="feed-quote">
                        "
                        {(item.content.length > 80
                          ? item.content.substring(0, 80) + "..."
                          : item.content) || ""}
                        "
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          color: "#999",
                        }}
                      >
                        <span>{timeAgo(item.created_at)}</span>

                        {item.type === "post" && (
                          <span>
                            <LikeOutlined /> {item.like_count} •{" "}
                            <CommentOutlined /> {item.comment_count}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: "right", marginTop: 5 }}>
                    <Link to={`/events/${item.event_id}`}>
                      <Button
                        size="small"
                        type="text"
                        style={{ color: "#fa8c16" }}
                      >
                        VÀO XEM NGAY →
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}

              {!data?.col2_feed?.length && (
                <Empty description="Chưa có tin mới" />
              )}
            </div>
          </div>
        </Col>

        {/* =========================================================== */}
        {/* 3) SỰ KIỆN THU HÚT (TRENDING) */}
        {/* =========================================================== */}
        <Col xs={24} md={8}>
          <div className="dashboard-section">
            <div className="section-header header-red">
              <FireFilled /> Sự kiện thu hút
            </div>

            <div className="section-body custom-scroll">
              {data?.col3_trending?.map((ev, index) => (
                <div
                  key={ev.event_id}
                  className={`dashboard-item trending-item ${
                    index === 0 ? "rank-1" : ""
                  }`}
                >
                  {/* Rank + Score */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <Tag color="volcano">
                      <StarFilled />{" "}
                      {index === 0 ? "TOP 1" : index === 1 ? "TOP 2" : "TOP 3"}
                    </Tag>

                    <Tooltip title="Điểm tương tác">
                      <Tag color="gold">
                        <StarFilled /> {ev.engagement_score}
                      </Tag>
                    </Tooltip>
                  </div>

                  <Link
                    to={`/events/${ev.event_id}`}
                    className="text-bold"
                    style={{ fontSize: 16, color: "#cf1322" }}
                  >
                    {ev.title}
                  </Link>

                  {/* Growth 24h */}
                  <div className="growth-box">
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

                    <Row gutter={4} className="text-xs">
                      <Col span={12} style={{ color: "#389e0d" }}>
                        <ArrowUpOutlined /> +{ev.new_participants_24h} người
                      </Col>

                      <Col span={12} style={{ color: "#096dd9" }}>
                        <FileTextOutlined /> +{ev.new_posts_24h} bài
                      </Col>

                      <Col span={12} style={{ color: "#cf1322" }}>
                        <LikeOutlined /> +{ev.new_likes_24h} thích
                      </Col>

                      <Col span={12} style={{ color: "#d46b08" }}>
                        <CommentOutlined /> +{ev.new_comments_24h} cmt
                      </Col>
                    </Row>
                  </div>

                  {/* Tổng số liệu */}
                  <div
                    style={{
                      marginTop: 8,
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 11,
                      color: "#666",
                      background: "#fafafa",
                      padding: "4px 8px",
                      borderRadius: 4,
                    }}
                  >
                    <span>
                      <UserOutlined /> {ev.current_participants}
                    </span>

                    <span>
                      <FileTextOutlined /> {ev.total_posts}
                    </span>

                    <span>
                      <LikeOutlined /> {ev.total_reactions}
                    </span>

                    <span>
                      <CommentOutlined /> {ev.total_comments}
                    </span>
                  </div>

                  <Link to={`/events/${ev.event_id}`}>
                    <Button
                      type="primary"
                      danger
                      block
                      style={{ marginTop: 10, fontWeight: "bold" }}
                    >
                      KHÁM PHÁ NGAY
                    </Button>
                  </Link>
                </div>
              ))}

              {!data?.col3_trending?.length && (
                <Empty description="Chưa có trend" />
              )}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default VolunteerDashboard;
