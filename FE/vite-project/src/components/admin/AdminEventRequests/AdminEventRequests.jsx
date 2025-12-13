import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, Table, Tag, Button, Space, Select, Input, Modal } from "antd";
import { DownloadOutlined } from "@ant-design/icons"; // Import icon Download

import {
  fetchAdminEvents,
  approveEventThunk,
  rejectEventThunk,
} from "../../../redux/slices/eventSlice";

import {
  adminEventsSelector,
  adminEventsPaginationSelector,
  adminEventsLoadingSelector,
  adminEventsErrorSelector,
  adminActionErrorSelector,
} from "../../../redux/selectors/eventSelectors";

import useGlobalMessage from "../../../utils/hooks/useGlobalMessage";
import exportApi from "../../../../apis/exportApi";

const { Option } = Select;

const AdminEventRequests = () => {
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const events = useSelector(adminEventsSelector);
  const pagination = useSelector(adminEventsPaginationSelector);
  const loading = useSelector(adminEventsLoadingSelector);
  const listError = useSelector(adminEventsErrorSelector);
  const actionError = useSelector(adminActionErrorSelector);

  const [approvalFilter, setApprovalFilter] = useState("pending");
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [rowLoadingId, setRowLoadingId] = useState(null);

  // Export state
  const [exportingEvents, setExportingEvents] = useState(false);

  // Modal reject
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingEvent, setRejectingEvent] = useState(null);

  const loadData = (page = 1, limit = pageSize) => {
    dispatch(
      fetchAdminEvents({
        page,
        limit,
        approval_status: approvalFilter || undefined,
        search: search || undefined,
      })
    );
  };

  useEffect(() => {
    loadData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, approvalFilter, search]);

  useEffect(() => {
    if (listError) {
      messageApi.error(listError);
    }
  }, [listError, messageApi]);

  useEffect(() => {
    if (actionError) {
      messageApi.error(actionError);
    }
  }, [actionError, messageApi]);

  const handleTableChange = (pag) => {
    setPageSize(pag.pageSize);
    loadData(pag.current, pag.pageSize);
  };

  // Logic export sự kiện (Đã chuyển từ Dashboard sang)
  const handleExportEvents = async () => {
    try {
      setExportingEvents(true);
      messageApi.loading({
        content: "Đang tạo file báo cáo sự kiện...",
        key: "exportMsg",
      });
      
      const response = await exportApi.exportEvents("csv");
      
      // Tạo blob và link download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `events_report_${new Date().toISOString().slice(0, 10)}.csv`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      messageApi.success({
        content: "Tải danh sách sự kiện thành công!",
        key: "exportMsg",
      });
    } catch (error) {
      console.error(error);
      messageApi.error({ content: "Lỗi xuất dữ liệu.", key: "exportMsg" });
    } finally {
      setExportingEvents(false);
    }
  };

  const handleApprove = async (eventId) => {
    try {
      setRowLoadingId(eventId);
      const res = await dispatch(approveEventThunk(eventId)).unwrap();

      const msgFromRes =
        res?.message || res?.payload?.message || res?.data?.message;
      messageApi.success(msgFromRes || "Duyệt sự kiện thành công");

      loadData(pagination.page || 1, pageSize);
    } catch (err) {
      const errMsg =
        err?.message ||
        err?.payload?.message ||
        err?.data?.message ||
        "Không thể duyệt sự kiện";
      messageApi.error(errMsg);
    } finally {
      setRowLoadingId(null);
    }
  };

  const openRejectModal = (record) => {
    setRejectingEvent(record);
    setRejectReason("");
    setRejectModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    const reason = rejectReason.trim();
    if (!reason || reason.length < 5) {
      messageApi.warning("Lý do cần ít nhất 5 ký tự");
      return;
    }
    if (!rejectingEvent) return;

    const eventId = rejectingEvent.event_id;

    try {
      setRowLoadingId(eventId);
      const res = await dispatch(
        rejectEventThunk({ eventId, reason })
      ).unwrap();

      const msgFromRes =
        res?.message || res?.payload?.message || res?.data?.message;
      messageApi.success(msgFromRes || "Từ chối sự kiện thành công");

      setRejectModalOpen(false);
      setRejectingEvent(null);
      setRejectReason("");

      loadData(pagination.page || 1, pageSize);
    } catch (err) {
      const errMsg =
        err?.message ||
        err?.payload?.message ||
        err?.data?.message ||
        "Không thể từ chối sự kiện";
      messageApi.error(errMsg);
    } finally {
      setRowLoadingId(null);
    }
  };

  const handleRejectCancel = () => {
    setRejectModalOpen(false);
    setRejectingEvent(null);
    setRejectReason("");
  };

  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Manager",
      dataIndex: "manager_name",
      key: "manager_name",
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
      title: "Trạng thái duyệt",
      dataIndex: "approval_status",
      key: "approval_status",
      render: (status) => {
        let color = "default";
        if (status === "approved") color = "green";
        else if (status === "pending") color = "gold";
        else if (status === "rejected") color = "red";
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            disabled={record.approval_status === "approved"}
            loading={rowLoadingId === record.event_id}
            onClick={() => handleApprove(record.event_id)}
          >
            Approve
          </Button>
          <Button
            danger
            size="small"
            disabled={record.approval_status === "rejected"}
            loading={rowLoadingId === record.event_id}
            onClick={() => openRejectModal(record)}
          >
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  const pag = pagination || {};

  return (
    <Card
      title="Event requests"
      extra={
        <Space>
          {/* Nút Export đặt ở đây */}
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportEvents}
            loading={exportingEvents}
          >
            Export CSV
          </Button>
          
          <div style={{ width: 1, height: 20, background: '#f0f0f0', margin: '0 8px' }} /> {/* Đường kẻ ngăn cách nhẹ */}

          <span>Trạng thái:</span>
          <Select
            style={{ width: 160 }}
            value={approvalFilter}
            onChange={setApprovalFilter}
          >
            <Option value="">All</Option>
            <Option value="pending">Pending</Option>
            <Option value="approved">Approved</Option>
            <Option value="rejected">Rejected</Option>
          </Select>

          <Input.Search
            allowClear
            placeholder="Tìm kiếm theo tên"
            style={{ width: 220 }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onSearch={() => loadData(1, pageSize)}
          />
        </Space>
      }
    >
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

      <Modal
        title={
          rejectingEvent
            ? `Từ chối sự kiện: ${rejectingEvent.title}`
            : "Từ chối sự kiện"
        }
        open={rejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={handleRejectCancel}
        okText="Xác nhận từ chối"
        cancelText="Hủy"
        confirmLoading={
          rejectingEvent && rowLoadingId === rejectingEvent.event_id
        }
      >
        <p>Nhập lý do từ chối:</p>
        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={500}
          showCount
          placeholder="Ví dụ: Nội dung sự kiện chưa rõ ràng, cần bổ sung..."
          style={{ marginTop: 4, marginBottom: 24 }}
        />
      </Modal>
    </Card>
  );
};

export default AdminEventRequests;