import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Tag, Button, Card, message, Space } from "antd";
import {
  fetchAdminEvents,
  approveEventThunk,
  rejectEventThunk,
} from "../../../redux/slices/eventSlice";

const AdminEventRequests = () => {
  const dispatch = useDispatch();

  const { adminEvents, adminEventsPagination, adminEventsLoading } =
    useSelector((state) => state.events);

  const [approvingId, setApprovingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);

  const loadData = (page = 1, limit = 10) => {
    dispatch(
      fetchAdminEvents({
        page,
        limit,
        approval_status: "pending", // chỉ load request chờ duyệt
      })
    );
  };

  useEffect(() => {
    loadData(1, 10);
  }, [dispatch]);

  const handleTableChange = (pag) => {
    loadData(pag.current, pag.pageSize);
  };

  const handleApprove = async (eventId) => {
    try {
      setApprovingId(eventId);
      await dispatch(approveEventThunk(eventId)).unwrap();
      message.success("Duyệt sự kiện thành công");
      // reload để bỏ khỏi danh sách pending
      loadData(1, adminEventsPagination.limit || 10);
    } catch (err) {
      message.error(err || "Không thể duyệt sự kiện");
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (eventId) => {
    const reason = window.prompt("Nhập lý do từ chối (>= 5 ký tự):");
    if (!reason || reason.trim().length < 5) {
      message.warning("Vui lòng nhập lý do tối thiểu 5 ký tự");
      return;
    }

    try {
      setRejectingId(eventId);
      await dispatch(rejectEventThunk({ eventId, reason })).unwrap();
      message.success("Từ chối sự kiện thành công");
      loadData(1, adminEventsPagination.limit || 10);
    } catch (err) {
      message.error(err || "Không thể từ chối sự kiện");
    } finally {
      setRejectingId(null);
    }
  };

  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Quản lý",
      dataIndex: "manager_name",
      key: "manager_name",
      render: (value) => value || "—",
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
      title: "Trạng thái",
      dataIndex: "approval_status",
      key: "approval_status",
      render: (status) => <Tag color="gold">{status}</Tag>,
    },
    {
      title: "Hành động",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            loading={approvingId === record.event_id}
            onClick={() => handleApprove(record.event_id)}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            loading={rejectingId === record.event_id}
            onClick={() => handleReject(record.event_id)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card title="Event requests" bordered={false}>
      <Table
        rowKey="event_id"
        loading={adminEventsLoading}
        columns={columns}
        dataSource={adminEvents}
        pagination={{
          current: adminEventsPagination.page || 1,
          pageSize: adminEventsPagination.limit || 10,
          total: adminEventsPagination.total || 0,
        }}
        onChange={handleTableChange}
      />
    </Card>
  );
};

export default AdminEventRequests;
