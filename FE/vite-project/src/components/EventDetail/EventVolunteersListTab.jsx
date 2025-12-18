// src/pages/EventDetail/EventVolunteersListTab.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Typography, Spin, Empty, Avatar, Space } from "antd";
import { UserOutlined, TeamOutlined } from "@ant-design/icons"; // Thêm icon

import { getEventVolunteersPublicThunk } from "../../redux/slices/registrationSlice";
import {
  publicEventVolunteersSelector,
  publicEventVolunteersLoadingSelector,
  publicEventVolunteersErrorSelector,
} from "../../redux/selectors/registrationSelectors";

const { Text } = Typography;

const EventVolunteersListTab = ({ eventId }) => {
  const dispatch = useDispatch();

  let items = useSelector(publicEventVolunteersSelector(eventId));
  const loading = useSelector(publicEventVolunteersLoadingSelector(eventId));
  const error = useSelector(publicEventVolunteersErrorSelector(eventId));

  useEffect(() => {
    if (!eventId) return;
    dispatch(getEventVolunteersPublicThunk(eventId));
  }, [dispatch, eventId]);

  // Chỉ lấy những người đã được duyệt hoặc hoàn thành
  items = (items || []).filter(
    (item) => item.status === "approved" || item.status === "completed"
  );

  if (loading && !items.length) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!loading && error) {
    return <Empty description={error} />;
  }

  if (!loading && !items.length) {
    return <Empty description="Chưa có tình nguyện viên nào tham gia" />;
  }

  const columns = [
    {
      title: "Tình nguyện viên",
      dataIndex: "full_name",
      key: "full_name",
      render: (text) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />}/>
          <Text strong style={{ color: "#333" }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: "Ngày tham gia",
      dataIndex: "registration_date",
      key: "registration_date",
      width: 200,
      render: (val) =>
        val ? new Date(val).toLocaleDateString("vi-VN") : "-",
    },
  ];

  return (
    <div className="participants-tab-container">
      {/* Header thống kê nhỏ */}
      <div 
        style={{ 
          marginBottom: 16, 
          padding: "12px 16px", 
          backgroundColor: "#f9f9f9", 
          borderRadius: 8,
          border: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          gap: 8,
          color: "#555"
        }}
      >
        <TeamOutlined style={{ color: "#3674B5", fontSize: 18 }} />
        <span>Danh sách chính thức: <strong>{items.length}</strong> tình nguyện viên</span>
      </div>

      <Table
        className="participants-table" // Dùng class chung để ăn style màu xanh
        rowKey="registration_id"
        columns={columns}
        dataSource={items}
        pagination={{ pageSize: 10 }} // Thêm phân trang nếu danh sách dài
        size="middle"
      />
    </div>
  );
};

export default EventVolunteersListTab;