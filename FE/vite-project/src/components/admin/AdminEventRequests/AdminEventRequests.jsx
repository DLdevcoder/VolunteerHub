import "../../../../public/style/EventTableShared.css";
import "./AdminEventRequests.css";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Button,
  Space,
  Select,
  Input,
  Modal,
  Typography,
  Tooltip,
  Tag,
} from "antd";
import {
  DownloadOutlined,
  CheckOutlined,
  StopOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";

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

const renderStatusTag = (status) => {
  switch (status) {
    case "approved":
      return (
        <Tag className="status-tag" color="green">
          Đã duyệt
        </Tag>
      );
    case "pending":
      return (
        <Tag className="status-tag" color="orange">
          Chờ duyệt
        </Tag>
      );
    case "rejected":
      return (
        <Tag className="status-tag" color="red">
          Từ chối
        </Tag>
      );
    default:
      return <Tag className="status-tag">{status || "Không rõ"}</Tag>;
  }
};

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

  const [exportingEvents, setExportingEvents] = useState(false);

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
    if (listError) messageApi.error(listError);
  }, [listError, messageApi]);

  useEffect(() => {
    if (actionError) messageApi.error(actionError);
  }, [actionError, messageApi]);

  const handleTableChange = (pag) => {
    setPageSize(pag.pageSize);
    loadData(pag.current, pag.pageSize);
  };

  const handleExportEvents = async () => {
    try {
      setExportingEvents(true);
      messageApi.loading({ content: "Đang tạo file...", key: "exportMsg" });

      const response = await exportApi.exportEvents("csv");
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `events_report_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);

      messageApi.success({
        content: "Xuất dữ liệu thành công!",
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
      await dispatch(approveEventThunk(eventId)).unwrap();
      messageApi.success("Đã duyệt sự kiện thành công");
      loadData(pagination.page || 1, pageSize);
    } catch (err) {
      messageApi.error(err?.message || "Không thể duyệt sự kiện");
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

    try {
      setRowLoadingId(rejectingEvent.event_id);
      await dispatch(
        rejectEventThunk({ eventId: rejectingEvent.event_id, reason })
      ).unwrap();

      messageApi.success("Đã từ chối sự kiện");
      setRejectModalOpen(false);
      setRejectingEvent(null);
      setRejectReason("");
      loadData(pagination.page || 1, pageSize);
    } catch (err) {
      messageApi.error(err?.message || "Không thể từ chối sự kiện");
    } finally {
      setRowLoadingId(null);
    }
  };

  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (text) => (
        <Text strong style={{ fontSize: 15, color: "#333", fontWeight: 700 }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Người tạo",
      dataIndex: "manager_name",
      key: "manager_name",
      width: 180,
      render: (text) => (
        <span style={{ color: "#555" }}>
          {/* <UserOutlined style={{ marginRight: 6, color: "#888" }} /> */}
          {text}
        </span>
      ),
    },
    {
      title: "Thời gian diễn ra",
      key: "time",
      width: 280,
      render: (_, record) => (
        <div
          style={{
            fontSize: 13,
            color: "#555",
            display: "flex",
            alignItems: "flex-start",
          }}
        >
          {/* <CalendarOutlined
            style={{
              marginRight: 8,
              marginTop: 3,
              color: "#3674B5",
              flexShrink: 0,
            }}
          /> */}
          <span>
            {formatDateTime(record.start_date)} -{" "}
            {formatDateTime(record.end_date)}
          </span>
        </div>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "approval_status",
      key: "approval_status",
      width: 140,
      align: "center",
      render: (status) => renderStatusTag(status),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      align: "center",
      render: (_, record) => {
        const isApproved = record.approval_status === "approved";
        const isRejected = record.approval_status === "rejected";
        const isRowLoading = rowLoadingId === record.event_id;

        return (
          <Space>
            <Tooltip title="Duyệt sự kiện">
              <Button
                type="primary"
                size="small"
                icon={<CheckOutlined />}
                disabled={isApproved}
                loading={isRowLoading}
                onClick={() => handleApprove(record.event_id)}
              >
                Duyệt
              </Button>
            </Tooltip>

            <Tooltip title="Từ chối">
              <Button
                danger
                size="small"
                icon={<StopOutlined />}
                disabled={isRejected}
                loading={isRowLoading}
                onClick={() => openRejectModal(record)}
              >
                Hủy
              </Button>
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  const pag = pagination || {};

  return (
    <div className="event-table-container">
      {/* HEADER */}
      <div className="event-table-header" style={{ display: "block" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={3} style={{ color: "#3674B5", margin: 0 }}>
              Yêu cầu duyệt sự kiện
            </Title>
          </div>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExportEvents}
            loading={exportingEvents}
            style={{borderRadius: 6, background: "#3674B5", color: "#fff"}}
          >
            Xuất Excel
          </Button>
        </div>

        {/* FILTER BAR */}
        <div className="admin-filter-bar">
          <div className="filter-group">
            <FilterOutlined style={{ color: "#888" }} />
            <span className="filter-label">Trạng thái:</span>
            <Select
              style={{ width: 140 }}
              value={approvalFilter}
              onChange={setApprovalFilter}
            >
              <Option value="">Tất cả</Option>
              <Option value="pending">Chờ duyệt</Option>
              <Option value="approved">Đã duyệt</Option>
              <Option value="rejected">Đã từ chối</Option>
            </Select>
          </div>

          <div className="filter-group" style={{ flex: 1 }}>
            <SearchOutlined style={{ color: "#888" }} />
            <span className="filter-label">Tìm kiếm:</span>
            <Input
              allowClear
              placeholder="Nhập tên sự kiện..."
              style={{ maxWidth: 300, borderRadius: 6 }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onPressEnter={() => loadData(1, pageSize)}
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
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
      />

      {/* REJECT MODAL */}
      <Modal
        className="reject-modal"
        title={<span className="reject-modal-title">Từ chối sự kiện</span>}
        open={rejectModalOpen}
        onOk={handleRejectConfirm}
        onCancel={() => setRejectModalOpen(false)}
        okText="Xác nhận"
        cancelText="Hủy bỏ"
        okButtonProps={{
          danger: true,
          loading: rowLoadingId === rejectingEvent?.event_id,
        }}
      >
        <p style={{ marginBottom: 10 }}>
          Bạn đang từ chối sự kiện: <strong>{rejectingEvent?.title}</strong>
        </p>

        <Input.TextArea
          rows={4}
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={500}
          showCount
          placeholder="Vui lòng nhập lý do từ chối để Manager chỉnh sửa..."
          className="reject-reason-textarea"
        />
      </Modal>
    </div>
  );
};

export default AdminEventRequests;
