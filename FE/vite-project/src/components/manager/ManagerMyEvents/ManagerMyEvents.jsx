import { useEffect, useState } from "react";
import { Table, Tag, message, Card } from "antd";
import eventApi from "../../../../apis/eventApi";

const ManagerMyEvents = () => {
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [loading, setLoading] = useState(false);

  const fetchData = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const res = await eventApi.getMyEvents({
        page,
        limit: pageSize,
      });
      // res: { success, message, data: { events, pagination } }
      if (!res?.success) {
        message.error(res?.message || "Không tải được event của bạn");
        return;
      }

      const result = res.data || {};
      const list = result.events || [];
      const apiPag = result.pagination || {};

      setEvents(list);
      setPagination({
        current: apiPag.page || page,
        pageSize: apiPag.limit || pageSize,
        total: apiPag.total || 0,
      });
    } catch (err) {
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          "Không tải được event của bạn"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(1, 10);
  }, []);

  const handleTableChange = (pag) => {
    fetchData(pag.current, pag.pageSize);
  };

  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Thời gian",
      key: "time",
      render: (_, record) => (
        <>
          {new Date(record.start_date).toLocaleString("vi-VN")} -{" "}
          {new Date(record.end_date).toLocaleString("vi-VN")}
        </>
      ),
    },
    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
    },
    {
      title: "Số lượng",
      key: "participants",
      render: (_, record) => (
        <>
          {record.current_participants}/{record.target_participants}
        </>
      ),
    },
    {
      title: "Trạng thái duyệt",
      dataIndex: "approval_status",
      key: "approval_status",
      render: (status) => {
        let color = "default";
        if (status === "approved") color = "green";
        else if (status === "pending") color = "gold";
        else if (status === "rejected") color = "red";
        return <Tag color={color}>{status || "unknown"}</Tag>;
      },
    },
  ];

  return (
    <Card title="Event của tôi" bordered={false}>
      <Table
        rowKey="event_id"
        loading={loading}
        columns={columns}
        dataSource={events}
        pagination={pagination}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default ManagerMyEvents;
