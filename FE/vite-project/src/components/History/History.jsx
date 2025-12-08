import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Card, Table, Tag, Spin, Empty, Typography } from "antd";

import eventApi from "../../../apis/eventApi";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

const { Text } = Typography;

const statusColorMap = {
  pending: "gold",
  approved: "green",
  rejected: "red",
  cancelled: "default",
  completed: "blue",
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

        const list = res.data || [];
        console.log("My event history:", list); // debug structure từ BE
        setHistory(list);
      } catch (err) {
        console.error("Get history error:", err);
        const msg =
          err?.response?.data?.message ||
          err?.message ||
          "Không tải được lịch sử sự kiện";
        messageApi.error(msg);
      } finally {
        setLoading(false);
      }
    };

    // chỉ Volunteer mới có tab này, nhưng check thêm cho chắc
    if (authUser && role === "Volunteer") {
      fetchHistory();
    }
  }, [authUser, role, messageApi]);

  if (!authUser) {
    return (
      <Card title="Lịch sử tham gia">
        <Empty description="Bạn cần đăng nhập để xem lịch sử tham gia sự kiện." />
      </Card>
    );
  }

  if (role !== "Volunteer") {
    return (
      <Card title="Lịch sử tham gia">
        <Empty description="Chức năng này chỉ dành cho tài khoản Volunteer." />
      </Card>
    );
  }

  // Helper lấy status từ 1 record (do BE có thể đặt tên khác nhau)
  const getStatusFromRecord = (record) =>
    record.status || record.registration_status || record.reg_status || "";

  const columns = [
    {
      title: "Sự kiện",
      dataIndex: "title",
      key: "title",
      render: (_, record) => (
        <Text strong>{record.title || record.event_title}</Text>
      ),
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_, record) => {
        const start = record.start_date || record.event_start_date;
        const end = record.end_date || record.event_end_date;
        if (!start || !end) return "(không rõ)";

        return `${new Date(start).toLocaleString(
          "vi-VN"
        )} - ${new Date(end).toLocaleString("vi-VN")}`;
      },
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      filters: [
        { text: "Pending", value: "pending" },
        { text: "Approved", value: "approved" },
        { text: "Rejected", value: "rejected" },
        { text: "Cancelled", value: "cancelled" },
        { text: "Completed", value: "completed" },
      ],
      filterMultiple: false,
      onFilter: (value, record) => {
        const status = getStatusFromRecord(record);
        return status === value;
      },
      render: (_, record) => {
        const status = getStatusFromRecord(record);
        if (!status) return "-";
        return (
          <Tag
            color={statusColorMap[status] || "default"}
            style={{ textTransform: "capitalize" }}
          >
            {status}
          </Tag>
        );
      },
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registration_date",
      key: "registration_date",
      render: (val, record) => {
        const date = val || record.reg_date;
        return date ? new Date(date).toLocaleString("vi-VN") : "-";
      },
    },
  ];

  return (
    <Card title="Lịch sử tham gia sự kiện">
      {loading ? (
        <div style={{ textAlign: "center", padding: 24 }}>
          <Spin />
        </div>
      ) : !history.length ? (
        <Empty description="Bạn chưa tham gia sự kiện nào." />
      ) : (
        <Table
          rowKey={(record) => record.registration_id || record.event_id}
          columns={columns}
          dataSource={history}
          pagination={false}
          onRow={(record) => ({
            onClick: () => {
              const eventId = record.event_id;
              if (eventId) navigate(`/events/${eventId}`);
            },
          })}
        />
      )}
    </Card>
  );
};

export default History;
