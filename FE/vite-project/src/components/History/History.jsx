import "../../../public/style/EventTableShared.css";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Table, Spin, Empty, Typography, Space } from "antd";
import { 
  CalendarOutlined, 
  EnvironmentOutlined, 
  FieldTimeOutlined 
} from "@ant-design/icons";

import eventApi from "../../../apis/eventApi";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

const { Title, Text } = Typography;
const getStatusConfig = (status) => {
  switch (status) {
    case "pending": return { className: "tag-pending", label: "Chờ duyệt" };
    case "approved": return { className: "tag-approved", label: "Đã tham gia" };
    case "completed": return { className: "tag-completed", label: "Hoàn thành" };
    case "rejected": return { className: "tag-rejected", label: "Từ chối" };
    case "cancelled": return { className: "tag-cancelled", label: "Đã hủy" };
    default: return { className: "tag-default", label: status };
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

const History = () => {
  const navigate = useNavigate();
  const messageApi = useGlobalMessage();

  const authUser = useSelector((state) => state.auth.user);
  const role = authUser?.role_name;

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await eventApi.getMyEventHistory();

        if (!res?.success) {
          messageApi.error(res?.message || "Không tải được lịch sử sự kiện");
          return;
        }
        setHistory(res.data || []);
      } catch (err) {
        console.error("Get history error:", err);
        messageApi.error("Không tải được lịch sử sự kiện");
      } finally {
        setLoading(false);
      }
    };

    if (authUser && role === "Volunteer") {
      fetchHistory();
    }
  }, [authUser, role, messageApi]);

  if (!authUser || role !== "Volunteer") {
    return (
      // SỬA: Dùng class chung
      <div className="event-table-container">
        <Empty description="Vui lòng đăng nhập tài khoản Tình nguyện viên." />
      </div>
    );
  }

  const getStatusFromRecord = (record) =>
    record.status || record.registration_status || record.reg_status || "pending";

  const columns = [
    {
      title: "Sự kiện",
      dataIndex: "title",
      key: "title",
      width: 250,
      render: (_, record) => (
        <Text strong style={{ fontSize: 15, color: "#333" }}>
          {record.title || record.event_title}
        </Text>
      ),
    },
    {
      title: "Thời gian diễn ra",
      key: "time",
      width: 320, 
      render: (_, record) => {
        const start = record.start_date || record.event_start_date;
        const end = record.end_date || record.event_end_date;
        if (!start || !end) return "--";

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
      render: (loc) => (
        <span style={{ color: "#555" }}>
          <EnvironmentOutlined style={{ marginRight: 6, color: "#3674B5" }} />
          {loc}
        </span>
      )
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      filters: [
        { text: "Chờ duyệt", value: "pending" },
        { text: "Đã tham gia", value: "approved" },
        { text: "Từ chối", value: "rejected" },
        { text: "Hoàn thành", value: "completed" },
      ],
      onFilter: (value, record) => getStatusFromRecord(record) === value,
      render: (_, record) => {
        const statusKey = getStatusFromRecord(record);
        const { className, label } = getStatusConfig(statusKey);
        // SỬA: Dùng class "status-tag" chung
        return <span className={`status-tag ${className}`}>{label}</span>;
      },
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registration_date",
      key: "registration_date",
      width: 160,
      align: "right",
      render: (val, record) => {
        const date = val || record.reg_date;
        return (
          <span style={{ color: "#888", fontSize: 13 }}>
            <FieldTimeOutlined style={{ marginRight: 4 }} />
            {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
          </span>
        );
      },
    },
  ];

  return (
    // SỬA: Dùng class container chung
    <div className="event-table-container">
      {/* SỬA: Dùng class header chung */}
      <div className="event-table-header">
        <div>
          <Title level={3} style={{ color: "#3674B5", margin: 0 }}>
            Lịch sử
          </Title>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : !history.length ? (
        <Empty description="Bạn chưa tham gia sự kiện nào." image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table
          // SỬA: Dùng class table chung
          className="shared-event-table"
          rowKey={(record) => record.registration_id || record.event_id}
          columns={columns}
          dataSource={history}
          pagination={{ pageSize: 10 }}
          onRow={(record) => ({
            onClick: () => {
              const eventId = record.event_id;
              if (eventId) navigate(`/events/${eventId}`);
            },
          })}
        />
      )}
    </div>
  );
};

export default History;