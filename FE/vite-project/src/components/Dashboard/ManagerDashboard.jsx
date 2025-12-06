import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, Statistic, Row, Col, Tag, Button } from "antd";
import {
  TeamOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import dashboardApi from "../../../apis/dashboardApi";
import ActivityWidget from "./ActivityWidget";
import "./VolunteerDashboard.css";

const ManagerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await dashboardApi.getDashboard();
        if (res.success) setData(res.data);
      } catch (error) {
        console.error("Lỗi tải dashboard quản lý:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading)
    return (
      <div style={{ padding: 50, textAlign: "center" }}>
        Đang tải dữ liệu quản lý...
      </div>
    );

  return (
    <div className="dashboard-container">
      <div
        className="dashboard-content"
        style={{ display: "block", maxWidth: 1200 }}
      >
        {/* --- PHẦN 1: HEADER & THỐNG KÊ (Giữ nguyên) --- */}
        <div style={{ marginBottom: 30 }}>
          <div style={{ marginBottom: 20 }}>
            <h1
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#1a1a1a",
                margin: 0,
              }}
            >
              Dashboard Quản Lý
            </h1>
            {/* Đã XÓA nút "Tạo sự kiện mới" ở đây theo yêu cầu */}
          </div>

          <Row gutter={16}>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: 10 }}>
                <Statistic
                  title="Tổng sự kiện"
                  value={data?.stats?.total_events || 0}
                  prefix={<CalendarOutlined style={{ color: "#1890ff" }} />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: 10 }}>
                <Statistic
                  title="Người tham gia"
                  value={data?.stats?.total_participants || 0}
                  prefix={<TeamOutlined style={{ color: "#52c41a" }} />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card bordered={false} style={{ borderRadius: 10 }}>
                <Statistic
                  title="Đang chờ duyệt"
                  value={data?.stats?.pending_events || 0}
                  prefix={<ClockCircleOutlined style={{ color: "#faad14" }} />}
                />
              </Card>
            </Col>
          </Row>
        </div>

        {/* --- PHẦN 2: GRID NỘI DUNG (Đã Đảo Cột) --- */}
        {/* Grid 2 cột: Feed (2 phần) - Sidebar (1 phần) */}
        <div
          style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 24 }}
        >
          {/* CỘT TRÁI (LỚN): Bảng tin hoạt động (News Feed) */}
          <div className="news-feed">
            <h3 className="font-bold text-gray-800 mb-4 text-lg">
              Hoạt động trên các sự kiện của bạn
            </h3>
            {/* Tái sử dụng ActivityWidget để hiển thị comment/post mới */}
            <ActivityWidget events={data?.recent_activities} />
          </div>

          {/* CỘT PHẢI (NHỎ): Danh sách sự kiện của tôi */}
          <div>
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 sticky top-5">
              <h3 className="font-bold text-gray-800 mb-4 text-lg border-b pb-2">
                Sự kiện của bạn
              </h3>

              <div className="space-y-4">
                {data?.my_events?.map((event) => (
                  <div
                    key={event.event_id}
                    className="p-3 border rounded-lg hover:bg-gray-50 transition bg-gray-50"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <Link
                        to={`/events/${event.event_id}`}
                        className="font-bold text-sm text-gray-900 hover:text-blue-600 block line-clamp-1"
                        title={event.title}
                      >
                        {event.title}
                      </Link>
                      <div>
                        {event.approval_status === "approved" && (
                          <Tag
                            color="success"
                            style={{ margin: 0, fontSize: 10 }}
                          >
                            Duyệt
                          </Tag>
                        )}
                        {event.approval_status === "pending" && (
                          <Tag
                            color="warning"
                            style={{ margin: 0, fontSize: 10 }}
                          >
                            Chờ
                          </Tag>
                        )}
                        {event.approval_status === "rejected" && (
                          <Tag
                            color="error"
                            style={{ margin: 0, fontSize: 10 }}
                          >
                            Hủy
                          </Tag>
                        )}
                      </div>
                    </div>

                    <div className="text-gray-500 text-xs mt-1">
                      📅 {new Date(event.start_date).toLocaleDateString()}
                    </div>
                    <div className="text-gray-500 text-xs mt-1">
                      📍 {event.location}
                    </div>

                    <div className="mt-2 text-xs font-semibold text-blue-600">
                      👥 {event.current_participants} /{" "}
                      {event.target_participants || "∞"} tham gia
                    </div>
                  </div>
                ))}

                {(!data?.my_events || data.my_events.length === 0) && (
                  <p className="text-center text-gray-500 py-4 text-sm">
                    Bạn chưa tạo sự kiện nào.
                  </p>
                )}
              </div>

              <div className="mt-4 text-center border-t pt-3">
                <Link
                  to="/my-events"
                  className="text-blue-600 font-medium hover:underline text-sm"
                >
                  Xem tất cả &rarr;
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
