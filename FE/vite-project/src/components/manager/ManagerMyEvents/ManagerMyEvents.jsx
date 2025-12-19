import "../../../../public/style/EventTableShared.css"; 
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Table, message, Button, Typography, Space } from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  EditOutlined,
  PlusOutlined
} from "@ant-design/icons";

import { fetchManagerEvents } from "../../../redux/slices/eventSlice";
import {
  managerEventsSelector,
  managerEventsPaginationSelector,
  managerEventsLoadingSelector,
  managerEventsErrorSelector,
} from "../../../redux/selectors/eventSelectors";

const { Title, Text } = Typography;

const getStatusConfig = (status) => {
  switch (status) {
    case "approved": return { className: "tag-approved", label: "Đã duyệt" };
    case "pending": return { className: "tag-pending", label: "Chờ duyệt" };
    case "rejected": return { className: "tag-rejected", label: "Từ chối" };
    case "completed": return { className: "tag-completed", label: "Hoàn thành" };
    default: return { className: "tag-default", label: status || "Nháp" };
  }
};

const formatDateTime = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ManagerMyEvents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const events = useSelector(managerEventsSelector);
  const pagination = useSelector(managerEventsPaginationSelector);
  const loading = useSelector(managerEventsLoadingSelector);
  const error = useSelector(managerEventsErrorSelector);

  const [pageSize, setPageSize] = useState(10);

  const loadData = (page = 1, limit = pageSize) => {
    dispatch(fetchManagerEvents({ page, limit }));
  };

  useEffect(() => {
    loadData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const handleTableChange = (pag) => {
    setPageSize(pag.pageSize);
    loadData(pag.current, pag.pageSize);
  };

  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (text) => (
        <Text strong style={{ fontSize: 15, color: "#333" }}>{text}</Text>
      ),
    },
    {
      title: "Thời gian",
      key: "time",
      width: 300,
      render: (_, record) => {
        const start = record.start_date;
        const end = record.end_date;
        
        // Hiển thị đầy đủ: Ngày Giờ Bắt đầu - Ngày Giờ Kết thúc
        return (
          <div style={{ color: "#555", fontSize: 13, display: "flex", alignItems: "flex-start" }}>
            <CalendarOutlined style={{ marginRight: 8, marginTop: 3, color: "#3674B5", flexShrink: 0 }} />
            <span>
              {formatDateTime(start)} - {formatDateTime(end)}
            </span>
          </div>
        );
      },
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
      width: 250,
      render: (loc) => (
        <span style={{ color: "#555" }}>
          <EnvironmentOutlined style={{ marginRight: 6, color: "#3674B5" }} />
          {loc}
        </span>
      ),
    },
    {
      title: "Số lượng",
      key: "participants",
      align: "center",
      render: (_, record) => (
        <Space style={{ color: "#666" }}>
          <TeamOutlined style={{ color: "#3674B5" }} />
          <span>
            <b>{record.current_participants}</b> / {record.target_participants}
          </span>
        </Space>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "approval_status",
      key: "approval_status",
      align: "center",
      render: (status) => {
        const { className, label } = getStatusConfig(status);
        return <span className={`status-tag ${className}`}>{label}</span>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          className="btn-outline-edit" // Sử dụng class từ file CSS chung
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/manager/events/${record.event_id}/edit`);
          }}
        >
          Sửa
        </Button>
      ),
    },
  ];

  const pag = pagination || {};

  return (
    <div className="event-table-container">
      <div className="event-table-header">
        <div>
          <Title level={3} style={{ color: "#3674B5", margin: 0 }}>
            Sự kiện của tôi
          </Title>
          <Text type="secondary">Quản lý các sự kiện bạn đã tạo</Text>
        </div>
        
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          style={{ background: "#3674B5", borderRadius: 6, fontWeight: 600 }}
          onClick={() => navigate("/manager/events/create")}
        >
          Tạo mới
        </Button>
      </div>

      <Table
        className="shared-event-table"
        rowKey="event_id"
        loading={loading}
        columns={columns}
        dataSource={events}
        pagination={{
          current: pag.page || 1,
          pageSize,
          total: pag.total || 0,
          showSizeChanger: true,
        }}
        onChange={handleTableChange}
        onRow={(record) => ({
          onClick: () => navigate(`/events/${record.event_id}`),
        })}
      />
    </div>
  );
};

export default ManagerMyEvents;