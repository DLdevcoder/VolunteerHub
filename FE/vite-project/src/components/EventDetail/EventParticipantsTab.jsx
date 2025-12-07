// src/pages/EventDetail/EventParticipantsTab.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Spin,
  Empty,
  message,
} from "antd";

import {
  getEventRegistrationsThunk,
  approveRegistrationThunk,
  rejectRegistrationThunk,
  completeRegistrationThunk,
} from "../../redux/slices/registrationSlice";

const { Text } = Typography;

const statusColorMap = {
  pending: "gold",
  approved: "green",
  rejected: "red",
  cancelled: "default",
  completed: "blue",
};

const EventParticipantsTab = ({ eventId }) => {
  const dispatch = useDispatch();

  const eventState =
    useSelector((state) => state.registration.manager.byEvent[eventId]) || {};
  const updatingId = useSelector(
    (state) => state.registration.manager.updatingId
  );

  const { items = [], loading = false, error } = eventState;

  useEffect(() => {
    if (!eventId) return;
    dispatch(getEventRegistrationsThunk(eventId));
  }, [dispatch, eventId]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  const handleApprove = async (record) => {
    try {
      await dispatch(
        approveRegistrationThunk({
          registrationId: record.registration_id,
          eventId,
        })
      ).unwrap();
      message.success("Đã duyệt đăng ký");
    } catch (err) {
      message.error(
        err?.message || "Không thể duyệt đăng ký. Vui lòng thử lại."
      );
    }
  };

  const handleReject = async (record) => {
    const reason = prompt("Nhập lý do từ chối (tối thiểu 5 ký tự):");
    if (!reason || reason.trim().length < 5) return;

    try {
      await dispatch(
        rejectRegistrationThunk({
          registrationId: record.registration_id,
          eventId,
          reason,
        })
      ).unwrap();
      message.success("Đã từ chối đăng ký");
    } catch (err) {
      message.error(
        err?.message || "Không thể từ chối đăng ký. Vui lòng thử lại."
      );
    }
  };

  const handleComplete = async (record) => {
    try {
      await dispatch(
        completeRegistrationThunk({
          registrationId: record.registration_id,
          eventId,
        })
      ).unwrap();
      message.success("Đã xác nhận hoàn thành cho tình nguyện viên");
    } catch (err) {
      message.error(
        err?.message || "Không thể đánh dấu hoàn thành. Vui lòng thử lại sau."
      );
    }
  };

  const columns = [
    {
      title: "Tình nguyện viên",
      dataIndex: "full_name",
      key: "full_name",
      render: (text, record) => (
        <div>
          <Text strong>{text}</Text>
          <div style={{ fontSize: 12 }}>
            <Text type="secondary">{record.email}</Text>
          </div>
          {record.phone && (
            <div style={{ fontSize: 12 }}>
              <Text type="secondary">ĐT: {record.phone}</Text>
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registration_date",
      key: "registration_date",
      render: (val) =>
        val ? new Date(val).toLocaleString("vi-VN") : "(không rõ)",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={statusColorMap[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Lý do từ chối",
      dataIndex: "rejection_reason",
      key: "rejection_reason",
      ellipsis: true,
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => {
        const status = record.status;

        const isPending = status === "pending";
        const isApproved = status === "approved";
        const isCompleted = status === "completed";

        return (
          <Space>
            {isPending && (
              <>
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleApprove(record)}
                  loading={updatingId === record.registration_id}
                >
                  Duyệt
                </Button>
                <Button
                  danger
                  size="small"
                  onClick={() => handleReject(record)}
                  loading={updatingId === record.registration_id}
                >
                  Từ chối
                </Button>
              </>
            )}

            {isApproved && (
              <Button
                size="small"
                onClick={() => handleComplete(record)}
                loading={updatingId === record.registration_id}
              >
                Hoàn thành
              </Button>
            )}

            {isCompleted && <Text type="secondary">Đã hoàn thành</Text>}
          </Space>
        );
      },
    },
  ];

  if (loading && !items.length) {
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (!items.length) {
    return <Empty description="Chưa có đăng ký nào cho sự kiện này" />;
  }

  return (
    <Table
      rowKey="registration_id"
      columns={columns}
      dataSource={items}
      pagination={false}
      size="middle"
    />
  );
};

export default EventParticipantsTab;
