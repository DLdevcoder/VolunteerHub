import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Row,
  Col,
  Spin,
  Empty,
  Pagination,
  Typography,
  DatePicker,
  Select,
  Space,
} from "antd";

import EventCard from "../EventCard/EventCard";
import {
  fetchActiveEvents,
  fetchEventCategories,
} from "../../redux/slices/eventSlice";
import {
  activeEventsSelector,
  activeEventsPaginationSelector,
  activeEventsLoadingSelector,
  activeEventsErrorSelector,
  eventCategoriesSelector,
  eventCategoriesLoadingSelector,
} from "../../redux/selectors/eventSelectors";
import {
  registerForEventThunk,
  cancelRegistrationThunk,
} from "../../redux/slices/registrationSlice";
import { volunteerRegisteringIdSelector } from "../../redux/selectors/registrationSelectors";

import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

const DEFAULT_LIMIT = 9;

const Events = () => {
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const items = useSelector(activeEventsSelector);
  const pagination = useSelector(activeEventsPaginationSelector);
  const loading = useSelector(activeEventsLoadingSelector);
  const error = useSelector(activeEventsErrorSelector);

  const categories = useSelector(eventCategoriesSelector);
  const categoriesLoading = useSelector(eventCategoriesLoadingSelector);

  const { user, token } = useSelector((state) => state.auth);
  const userRole = user?.role_name;
  const isLoggedIn = !!token;

  const registeringId = useSelector(volunteerRegisteringIdSelector);

  const [page, setPage] = useState(1);
  const [categoryId, setCategoryId] = useState(null);
  const [dateRange, setDateRange] = useState(null);

  // 1) Load categories once
  useEffect(() => {
    dispatch(fetchEventCategories());
  }, [dispatch]);

  // 2) Build params (stable) so we can reuse in many places
  const params = useMemo(() => {
    const p = { page, limit: DEFAULT_LIMIT };

    if (categoryId) p.category_id = categoryId;

    if (dateRange && dateRange.length === 2) {
      const [start, end] = dateRange;
      if (start && end) {
        p.start_date_from = start.startOf("day").toISOString();
        p.start_date_to = end.endOf("day").toISOString();
      }
    }

    return p;
  }, [page, categoryId, dateRange]);

  // 3) Load events whenever params change
  useEffect(() => {
    dispatch(fetchActiveEvents(params));
  }, [dispatch, params]);

  // 4) Show list error ONLY ONCE per distinct message (avoid replay on navigation)
  const lastListErrorRef = useRef(null);
  useEffect(() => {
    if (!error) return;
    if (lastListErrorRef.current === error) return; // prevent duplicates
    lastListErrorRef.current = error;

    messageApi.error(error);
  }, [error, messageApi]);

  const handleRegister = async (eventId) => {
    if (!isLoggedIn) {
      messageApi.info("Bạn cần đăng nhập để đăng ký sự kiện.");
      return;
    }

    try {
      const result = await dispatch(registerForEventThunk(eventId)).unwrap();
      messageApi.success(result?.message || "Đăng ký sự kiện thành công");

      // refresh list immediately (not relying on setPage(prev => prev))
      dispatch(fetchActiveEvents(params));
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err?.message || "Không thể đăng ký sự kiện";
      messageApi.error(msg);
    }
  };

  const handleCancel = async (eventId) => {
    try {
      const result = await dispatch(cancelRegistrationThunk(eventId)).unwrap();
      messageApi.success(result?.message || "Hủy đăng ký thành công");

      // refresh list immediately
      dispatch(fetchActiveEvents(params));
    } catch (err) {
      const msg =
        typeof err === "string"
          ? err
          : err?.message || "Không thể hủy đăng ký sự kiện";
      messageApi.error(msg);
    }
  };

  const handleCategoryChange = (value) => {
    setCategoryId(value || null);
    setPage(1);
  };

  const handleDateChange = (dates) => {
    setDateRange(dates);
    setPage(1);
  };

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        Events
      </Title>

      <Space
        style={{
          marginBottom: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
        wrap
      >
        <Space wrap>
          <Select
            style={{ minWidth: 200 }}
            placeholder="Lọc theo danh mục"
            allowClear
            loading={categoriesLoading}
            value={categoryId || undefined}
            onChange={handleCategoryChange}
          >
            {categories.map((cat) => (
              <Option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </Option>
            ))}
          </Select>

          <RangePicker
            onChange={handleDateChange}
            value={dateRange}
            showTime={false}
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
          />
        </Space>
      </Space>

      {loading ? (
        <div
          style={{ display: "flex", justifyContent: "center", paddingTop: 40 }}
        >
          <Spin size="large" />
        </div>
      ) : !items || items.length === 0 ? (
        <Empty description="Không có sự kiện nào" />
      ) : (
        <>
          <Row gutter={[16, 16]} align="stretch">
            {items.map((ev) => (
              <Col key={ev.event_id} xs={24} md={12} lg={8}>
                <EventCard
                  event={ev}
                  onRegister={handleRegister}
                  onCancel={handleCancel}
                  registeringId={registeringId}
                  userRole={userRole}
                />
              </Col>
            ))}
          </Row>

          {pagination?.total > pagination?.limit && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginTop: 16,
              }}
            >
              <Pagination
                current={pagination.page || page}
                pageSize={pagination.limit || DEFAULT_LIMIT}
                total={pagination.total}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Events;
