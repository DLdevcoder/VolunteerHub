// src/components/manager/ManagerMyEvents/ManagerMyEvents.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, message, Card } from "antd";

import { fetchManagerEvents } from "../../../redux/slices/eventSlice";
import {
  managerEventsSelector,
  managerEventsPaginationSelector,
  managerEventsLoadingSelector,
  managerEventsErrorSelector,
} from "../../../redux/selectors/eventSelectors";

const ManagerMyEvents = () => {
  const dispatch = useDispatch();

  const events = useSelector(managerEventsSelector);
  const pagination = useSelector(managerEventsPaginationSelector);
  const loading = useSelector(managerEventsLoadingSelector);
  const error = useSelector(managerEventsErrorSelector);

  const [pageSize, setPageSize] = useState(10);

  const loadData = (page = 1, limit = pageSize) => {
    dispatch(
      fetchManagerEvents({
        page,
        limit,
      })
    );
  };

  useEffect(() => {
    loadData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
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

  const pag = pagination || {};

  return (
    <Card title="Event của tôi" bordered={false}>
      <Table
        rowKey="event_id"
        loading={loading}
        columns={columns}
        dataSource={events}
        pagination={{
          current: pag.page || 1,
          pageSize,
          total: pag.total || 0,
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default ManagerMyEvents;
