// src/pages/EventDetail/EventParticipantsTab.jsx
import "./EventDetail.css"; // IMPORT CSS
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Button,
  Space,
  Typography,
  Spin,
  Empty,
  Select,
  Modal,
  Input,
} from "antd";
import {
  CheckOutlined,
  CloseOutlined,
  CheckCircleOutlined,
  FilterOutlined,
} from "@ant-design/icons";

import {
  getEventRegistrationsThunk,
  approveRegistrationThunk,
  rejectRegistrationThunk,
  completeRegistrationThunk,
} from "../../redux/slices/registrationSlice";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

const { Text } = Typography;
const { TextArea } = Input;

const statusLabelMap = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  cancelled: "Đã hủy",
  completed: "Hoàn thành",
};

const EventParticipantsTab = ({ eventId }) => {
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const [statusFilter, setStatusFilter] = useState("all");

  // modal reject state
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const eventState = useSelector((state) => state.registration.manager.byEvent[eventId]) || {};
  const updatingId = useSelector((state) => state.registration.manager.updatingId);

  const { items = [], loading = false, error } = eventState;

  useEffect(() => {
    if (!eventId) return;
    dispatch(getEventRegistrationsThunk(eventId));
  }, [dispatch, eventId]);

  useEffect(() => {
    if (error) {
      messageApi.error(error);
    }
  }, [error, messageApi]);

  // --- Handlers ---
  const handleApprove = async (record) => {
    try {
      await dispatch(approveRegistrationThunk({ registrationId: record.registration_id, eventId })).unwrap();
      messageApi.success("Đã duyệt đăng ký");
    } catch (err) {
      messageApi.error(err?.message || "Lỗi khi duyệt");
    }
  };

  const openRejectModal = (record) => {
    setRejectTarget(record);
    setRejectReason("");
    setRejectModalVisible(true);
  };

  const handleConfirmReject = async () => {
    const reason = rejectReason.trim();
    if (!reason || reason.length < 5) {
      messageApi.warning("Lý do từ chối cần ít nhất 5 ký tự");
      return;
    }
    if (!rejectTarget) return;

    try {
      setRejectSubmitting(true);
      await dispatch(rejectRegistrationThunk({ registrationId: rejectTarget.registration_id, eventId, reason })).unwrap();
      messageApi.success("Đã từ chối đăng ký");
      setRejectModalVisible(false);
      setRejectTarget(null);
      setRejectReason("");
    } catch (err) {
      messageApi.error(err?.message || "Lỗi khi từ chối");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleCancelRejectModal = () => {
    setRejectModalVisible(false);
    setRejectTarget(null);
    setRejectReason("");
  };

  const handleComplete = async (record) => {
    try {
      await dispatch(completeRegistrationThunk({ registrationId: record.registration_id, eventId })).unwrap();
      messageApi.success("Đã xác nhận hoàn thành");
    } catch (err) {
      messageApi.error(err?.message || "Lỗi khi xác nhận");
    }
  };

  // --- Columns ---
  const columns = [
    {
      title: "Tình nguyện viên",
      dataIndex: "full_name",
      key: "full_name",
      render: (text, record) => (
        <div>
          <div style={{ fontWeight: 600, color: "#333", fontSize: 15 }}>{text}</div>
          <div style={{ fontSize: 13, color: "#666" }}>{record.email}</div>
          {record.phone && <div style={{ fontSize: 13, color: "#888" }}>{record.phone}</div>}
        </div>
      ),
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registration_date",
      key: "registration_date",
      width: 160,
      render: (val) => val ? new Date(val).toLocaleDateString("vi-VN") : "-",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status) => (
        // SỬA: Dùng thẻ span với class custom thay vì Antd Tag
        <span className={`custom-status-tag tag-${status}`}>
          {statusLabelMap[status] || status}
        </span>
      ),
    },
    {
      title: "Ghi chú / Lý do",
      dataIndex: "rejection_reason",
      key: "rejection_reason",
      ellipsis: true,
      render: (text) => text || <span style={{ color: "#ccc" }}>--</span>
    },
    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: 220,
      render: (_, record) => {
        const status = record.status;
        return (
          <Space>
            {status === "pending" && (
              <>
                {/* Nút Duyệt: Outline Blue */}
                <Button
                  size="small"
                  icon={<CheckOutlined />}
                  onClick={() => handleApprove(record)}
                  loading={updatingId === record.registration_id}
                  style={{
                    backgroundColor: '#52c41a',
                    borderColor: '#52c41a',
                    color: '#fff',
                    fontWeight: 700,
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: '14px',
                    padding: '0 12px',
                    height: '32px',
                    borderRadius: '6px',
                    transition: 'all 0.3s',
                    width: '90px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#73d13d';
                    e.currentTarget.style.borderColor = '#73d13d';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#52c41a';
                    e.currentTarget.style.borderColor = '#52c41a';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  className="btn-outline-action btn-approve"
                >
                  Duyệt
                </Button>

                {/* Nút Từ chối: Outline Red */}
                <Button
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => openRejectModal(record)}
                  loading={updatingId === record.registration_id}
                  style={{
                    backgroundColor: '#ff4d4f',
                    borderColor: '#ff4d4f',
                    color: '#fff',
                    fontWeight: 700,
                    fontFamily: "'Roboto', sans-serif",
                    fontSize: '14px',
                    padding: '0 12px',
                    height: '32px',
                    borderRadius: '6px',
                    transition: 'all 0.3s',
                    width: '90px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff7875';
                    e.currentTarget.style.borderColor = '#ff7875';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#ff4d4f';
                    e.currentTarget.style.borderColor = '#ff4d4f';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                  className="btn-outline-action btn-reject"
                >
                  Từ chối
                </Button>
              </>
            )}

            {status === "approved" && (
              // Nút Hoàn thành: Outline Green
              <Button
                size="small"
                icon={<CheckCircleOutlined />}
                onClick={() => handleComplete(record)}
                loading={updatingId === record.registration_id}
                className="btn-outline-action btn-complete"
              >
                Hoàn thành
              </Button>
            )}

            {status === "completed" && (
              <span style={{ color: "#52c41a", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                <CheckCircleOutlined /> Đã hoàn thành
              </span>
            )}
          </Space>
        );
      },
    },
  ];

  if (loading && !items.length) {
    return <div style={{ textAlign: "center", padding: 40 }}><Spin size="large" /></div>;
  }

  const filteredItems = statusFilter === "all" ? items : items.filter((r) => r.status === statusFilter);

  return (
    <div className="participants-tab-container">
      {/* Filter Bar */}
      <div className="participants-filter-bar">
        <Space>
          <FilterOutlined style={{ color: "#888" }} />
          <Text strong style={{ color: "#555" }}>Trạng thái:</Text>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 180 }}
            options={[
              { value: "all", label: "Tất cả" },
              { value: "pending", label: "Chờ duyệt" },
              { value: "approved", label: "Đã duyệt" },
              { value: "rejected", label: "Bị từ chối" },
              { value: "completed", label: "Đã hoàn thành" },
              { value: "cancelled", label: "Đã hủy" },
            ]}
          />
        </Space>

        <div style={{ marginLeft: "auto", color: "#888" }}>
          Tổng số: <strong>{filteredItems.length}</strong>
        </div>
      </div>

      <Table
        className="participants-table"
        rowKey="registration_id"
        columns={columns}
        dataSource={filteredItems}
        pagination={{ pageSize: 5 }}
        locale={{ emptyText: <Empty description="Không có dữ liệu" /> }}
      />

      {/* Modal Reject */}
      <Modal
        open={rejectModalVisible}
        title="Từ chối đăng ký"
        onCancel={handleCancelRejectModal}
        footer={
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '12px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #f0f0f0'
          }}>
            <Button
              onClick={handleCancelRejectModal}
              style={{ minWidth: '80px' }}
            >
              Hủy
            </Button>
            <Button
              type="primary"
              danger
              loading={rejectSubmitting}
              onClick={handleConfirmReject}
              style={{ minWidth: '140px' }}
            >
              Xác nhận từ chối
            </Button>
          </div>
        }
        destroyOnClose
      >
        <p>Lý do từ chối <strong>{rejectTarget?.full_name}</strong>:</p>
        <TextArea
          rows={4}
          placeholder="Nhập lý do..."
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          maxLength={500}
          showCount
        />
      </Modal>
    </div>
  );
};

export default EventParticipantsTab;