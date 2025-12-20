import "../../../../public/style/EventTableShared.css";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Table,
  message,
  Button,
  Typography,
  Space,
  Tag,
  DatePicker,
} from "antd";
import { EditOutlined, PlusOutlined } from "@ant-design/icons";

import { fetchManagerEvents } from "../../../redux/slices/eventSlice";
import {
  managerEventsSelector,
  managerEventsPaginationSelector,
  managerEventsLoadingSelector,
  managerEventsErrorSelector,
} from "../../../redux/selectors/eventSelectors";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

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

const getStatusTag = (status) => {
  switch (status) {
    case "approved":
      return { color: "green", label: "Đã duyệt" };
    case "pending":
      return { color: "orange", label: "Chờ duyệt" };
    case "rejected":
      return { color: "red", label: "Từ chối" };
    default:
      return { color: "default", label: status || "Nháp" };
  }
};

// record intersects filter range
const overlapsRange = (recordStart, recordEnd, filterStart, filterEnd) => {
  if (!filterStart || !filterEnd) return true;
  const rs = recordStart ? new Date(recordStart).getTime() : 0;
  const re = recordEnd ? new Date(recordEnd).getTime() : 0;
  const fs = filterStart.getTime();
  const fe = filterEnd.getTime();
  return rs <= fe && re >= fs;
};

const ManagerMyEvents = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const events = useSelector(managerEventsSelector) || [];
  const pagination = useSelector(managerEventsPaginationSelector);
  const loading = useSelector(managerEventsLoadingSelector);
  const error = useSelector(managerEventsErrorSelector);

  const [pageSize, setPageSize] = useState(10);

  // ===== Column filter states (controlled) =====
  const [statusFiltered, setStatusFiltered] = useState(null); // ["approved"] | ["pending"] | ["rejected"] | null
  const [timeFiltered, setTimeFiltered] = useState(null); // [Date, Date] | null

  const loadData = (page = 1, limit = pageSize) => {
    dispatch(fetchManagerEvents({ page, limit }));
  };

  useEffect(() => {
    loadData(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (error) message.error(error);
  }, [error]);

  const handleTableChange = (pag, filters /* , sorter */) => {
    setPageSize(pag.pageSize);

    // capture status filter from table
    // filters.approval_status will be array or null
    if ("approval_status" in filters) {
      setStatusFiltered(filters.approval_status || null);
    }

    // pagination still server-driven
    loadData(pag.current, pag.pageSize);
  };

  // ===== Client-side filtered data (for header filters) =====
  const filteredEvents = useMemo(() => {
    let list = events;

    // status
    if (statusFiltered && statusFiltered.length > 0) {
      list = list.filter((e) => statusFiltered.includes(e.approval_status));
    }

    // time range
    if (timeFiltered && timeFiltered.length === 2) {
      const [s, e] = timeFiltered;
      list = list.filter((ev) =>
        overlapsRange(ev.start_date, ev.end_date, s, e)
      );
    }

    return list;
  }, [events, statusFiltered, timeFiltered]);

  // ===== Column defs =====
  const columns = [
    {
      title: "Tên sự kiện",
      dataIndex: "title",
      key: "title",
      width: 280,
      render: (text) => (
        <Text strong className="evt-title">
          {text}
        </Text>
      ),
    },

    // TIME column filter: custom dropdown (RangePicker) -> funnel icon appears automatically
    {
      title: "Thời gian",
      key: "time",
      width: 330,
      render: (_, record) => (
        <div className="evt-time">
          <span>
            {formatDateTime(record.start_date)} -{" "}
            {formatDateTime(record.end_date)}
          </span>
        </div>
      ),
      filteredValue: timeFiltered ? ["1"] : null, // just to show filter state
      filterDropdown: ({ confirm, clearFilters }) => {
        return (
          <div style={{ padding: 12, width: 280 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>
              Lọc theo ngày
            </div>

            <RangePicker
              style={{ width: "100%" }}
              format="DD/MM/YYYY"
              value={
                timeFiltered
                  ? [
                      // AntD RangePicker expects dayjs by default, but it can accept Date in many cases.
                      // If your AntD version forces dayjs, tell me, I’ll convert properly.
                      timeFiltered[0],
                      timeFiltered[1],
                    ]
                  : null
              }
              onChange={(val) => {
                if (!val || val.length !== 2) {
                  setTimeFiltered(null);
                  return;
                }
                // val may be dayjs -> convert to Date
                const start = val[0]?.toDate ? val[0].toDate() : val[0];
                const end = val[1]?.toDate ? val[1].toDate() : val[1];
                setTimeFiltered([start, end]);
              }}
              allowClear
            />

            <div
              style={{
                display: "flex",
                gap: 8,
                marginTop: 10,
                justifyContent: "flex-end",
              }}
            >
              <Button
                size="small"
                onClick={() => {
                  setTimeFiltered(null);
                  clearFilters?.();
                  confirm();
                }}
              >
                Xoá
              </Button>
              <Button
                size="small"
                type="primary"
                onClick={() => {
                  confirm();
                }}
              >
                Áp dụng
              </Button>
            </div>
          </div>
        );
      },
    },

    {
      title: "Địa điểm",
      dataIndex: "location",
      key: "location",
      width: 300,
      render: (loc) => <span className="evt-loc">{loc}</span>,
    },
    {
      title: "Số lượng",
      key: "participants",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Space className="evt-qty">
          <span>
            <b>{record.current_participants}</b> / {record.target_participants}
          </span>
        </Space>
      ),
    },

    // STATUS column filter: built-in filters -> funnel icon appears automatically
    {
      title: "Trạng thái",
      dataIndex: "approval_status",
      key: "approval_status",
      align: "center",
      width: 140,
      filters: [
        { text: "Đã duyệt", value: "approved" },
        { text: "Chờ duyệt", value: "pending" },
        { text: "Từ chối", value: "rejected" },
      ],
      filteredValue: statusFiltered || null,
      // return true/false per row
      onFilter: (value, record) => record.approval_status === value,
      render: (status) => {
        const { color, label } = getStatusTag(status);
        return <Tag color={color}>{label}</Tag>;
      },
    },

    {
      title: "Hành động",
      key: "actions",
      align: "center",
      width: 120,
      render: (_, record) => (
        <Button
          size="small"
          icon={<EditOutlined />}
          className="btn-outline-edit"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/manager/events/${record.event_id}/edit`);
          }}
        >
          Sửa
        </Button>
      ),
    },
  ];

  const pag = pagination || {};

  return (
    <div className="event-table-page">
      <div className="event-table-container">
        <div className="event-table-header">
          <div>
            <Title
              className="event-table-title"
              level={3}
              style={{ margin: 0 }}
            >
              Sự kiện của tôi
            </Title>
            <Text className="event-table-subtitle" type="secondary">
              Quản lý các sự kiện bạn đã tạo
            </Text>
          </div>

          <Space>
            {/* optional: quick reset filters button */}
            <Button
              onClick={() => {
                setStatusFiltered(null);
                setTimeFiltered(null);
              }}
            >
              Xoá lọc
            </Button>

            <Button
              type="primary"
              icon={<PlusOutlined />}
              className="btn-create"
              onClick={() => navigate("/manager/events/create")}
            >
              Tạo mới
            </Button>
          </Space>
        </div>

        <Table
          className="shared-event-table"
          rowKey="event_id"
          loading={loading}
          columns={columns}
          dataSource={filteredEvents}
          pagination={{
            current: pag.page || 1,
            pageSize,
            // If you want correct totals with client filtering:
            // total: filteredEvents.length,
            // But if pagination is server-driven, keep backend total:
            total: pag.total || 0,
            showSizeChanger: true,
          }}
          onChange={handleTableChange}
          onRow={(record) => ({
            onClick: () => navigate(`/events/${record.event_id}`),
          })}
        />
      </div>
    </div>
  );
};

export default ManagerMyEvents;
