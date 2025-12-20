import "../../../public/style/EventTableShared.css";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Table, Spin, Empty, Typography, Tag } from "antd";
import { FieldTimeOutlined } from "@ant-design/icons";

import eventApi from "../../../apis/eventApi";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

const { Title, Text } = Typography;

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

// ✅ AntD Tag config
const getStatusTag = (statusKey) => {
  switch (statusKey) {
    case "approved":
      return { color: "green", label: "Đã tham gia" };
    case "pending":
      return { color: "orange", label: "Chờ duyệt" };
    case "rejected":
      return { color: "red", label: "Từ chối" };
    case "completed":
      return { color: "blue", label: "Hoàn thành" };
    case "cancelled":
      return { color: "default", label: "Đã hủy" };
    default:
      return { color: "default", label: statusKey || "Nháp" };
  }
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

    if (authUser && role === "Volunteer") fetchHistory();
  }, [authUser, role, messageApi]);

  const getStatusFromRecord = (record) =>
    record.status ||
    record.registration_status ||
    record.reg_status ||
    "pending";

  const columns = [
    {
      title: "Sự kiện",
      dataIndex: "title",
      key: "title",
      width: "30%",
      ellipsis: true,
      render: (_, record) => (
        <Text strong className="evt-title evt-title-ellipsis">
          {record.title || record.event_title}
        </Text>
      ),
    },
    {
      title: "Thời gian diễn ra",
      key: "time",
      width: "18%",
      // ✅ IMPORTANT: do NOT set ellipsis:true here
      render: (_, record) => {
        const start = record.start_date || record.event_start_date;
        const end = record.end_date || record.event_end_date;
        if (!start || !end) return "--";

        return (
          <div className="evt-time-responsive">
            <span className="evt-time-start">{formatDateTime(start)}</span>
            <span className="evt-time-sep"> - </span>
            <span className="evt-time-end">{formatDateTime(end)}</span>
          </div>
        );
      },
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
      width: "28%",
      ellipsis: true,
      render: (loc) => <span className="evt-loc evt-loc-clamp">{loc}</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: "12%",
      filters: [
        { text: "Chờ duyệt", value: "pending" },
        { text: "Đã tham gia", value: "approved" },
        { text: "Từ chối", value: "rejected" },
        { text: "Hoàn thành", value: "completed" },
      ],
      onFilter: (value, record) => getStatusFromRecord(record) === value,
      render: (_, record) => {
        const statusKey = getStatusFromRecord(record);
        const { color, label } = getStatusTag(statusKey);
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registration_date",
      key: "registration_date",
      width: "12%",
      align: "right",
      ellipsis: true,
      render: (val, record) => {
        const date = val || record.reg_date;
        return (
          <span className="evt-reg evt-reg-nowrap">
            {/* <FieldTimeOutlined style={{ marginRight: 6 }} /> */}
            {date ? new Date(date).toLocaleDateString("vi-VN") : "-"}
          </span>
        );
      },
    },
  ];

  if (!authUser || role !== "Volunteer") {
    return (
      <div className="event-table-page">
        <div className="event-table-container">
          <Empty description="Vui lòng đăng nhập tài khoản Tình nguyện viên." />
        </div>
      </div>
    );
  }

  return (
    <div className="event-table-page">
      <div className="event-table-container">
        <div className="event-table-header">
          <Title className="event-table-title" level={3} style={{ margin: 0 }}>
            Lịch sử
          </Title>
        </div>

        {loading ? (
          <div className="event-table-loading">
            <Spin size="large" />
          </div>
        ) : !history.length ? (
          <Empty
            description="Bạn chưa tham gia sự kiện nào."
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Table
            className="shared-event-table"
            tableLayout="fixed"
            rowKey={(record) => record.registration_id || record.event_id}
            columns={columns}
            dataSource={history}
            pagination={{ pageSize: 10, showSizeChanger: true }}
            onRow={(record) => ({
              onClick: () => {
                const eventId = record.event_id;
                if (eventId) navigate(`/events/${eventId}`);
              },
            })}
          />
        )}
      </div>
    </div>
  );
};

export default History;
