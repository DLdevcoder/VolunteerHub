// src/pages/Manager/Events/ManagerMyEvents/ManagerMyEvents.jsx
import { useEffect } from "react";
import { Table, Tag, message, Card } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { fetchManagerEvents } from "../../../redux/slices/eventSlice";

const ManagerMyEvents = () => {
  const dispatch = useDispatch();

  const { myEvents, myEventsPagination, myEventsLoading, myEventsError } =
    useSelector((state) => state.events);

  const fetchData = (page = 1, pageSize = 10) => {
    dispatch(
      fetchManagerEvents({
        page,
        limit: pageSize,
      })
    );
  };

  useEffect(() => {
    fetchData(1, 10);
  }, []);

  // Show error from slice
  useEffect(() => {
    if (myEventsError) {
      message.error(myEventsError);
    }
  }, [myEventsError]);

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
        loading={myEventsLoading}
        columns={columns}
        dataSource={myEvents}
        pagination={{
          current: myEventsPagination.page,
          pageSize: myEventsPagination.limit,
          total: myEventsPagination.total,
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default ManagerMyEvents;
