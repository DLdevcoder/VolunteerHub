import "./Events.css"; // Nhớ import CSS
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

const DEFAULT_LIMIT = 10; // Tăng limit lên chút vì list view tốn ít chỗ dọc hơn

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

  // 2) Build params
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

  // 3) Load events
  useEffect(() => {
    dispatch(fetchActiveEvents(params));
  }, [dispatch, params]);

  // 4) Show list error
  const lastListErrorRef = useRef(null);
  useEffect(() => {
    if (!error) return;
    if (lastListErrorRef.current === error) return;
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
      dispatch(fetchActiveEvents(params));
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Lỗi đăng ký";
      messageApi.error(msg);
    }
  };

  const handleCancel = async (eventId) => {
    try {
      const result = await dispatch(cancelRegistrationThunk(eventId)).unwrap();
      messageApi.success(result?.message || "Hủy đăng ký thành công");
      dispatch(fetchActiveEvents(params));
    } catch (err) {
      const msg = typeof err === "string" ? err : err?.message || "Lỗi hủy đăng ký";
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
    <div className="events-page-wrapper">
      <div className="events-header">
        <Title level={2} style={{ color: "#3674B5", margin: 0 }}>
          Danh sách sự kiện
        </Title>
      </div>

      {/* FILTER BAR */}
      <div className="events-filter-bar">
        <div className="filter-item">
          <span className="filter-label">Danh mục:</span>
          <Select
            style={{ width: 220 }}
            placeholder="Tất cả danh mục"
            allowClear
            loading={categoriesLoading}
            value={categoryId || undefined}
            onChange={handleCategoryChange}
            size="large"
          >
            {categories.map((cat) => (
              <Option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </Option>
            ))}
          </Select>
        </div>

        <div className="filter-item">
          <span className="filter-label">Thời gian:</span>
          <RangePicker
            onChange={handleDateChange}
            value={dateRange}
            showTime={false}
            format="DD/MM/YYYY"
            placeholder={["Từ ngày", "Đến ngày"]}
            size="large"
            style={{ width: 280 }}
          />
        </div>
      </div>

      {/* EVENTS LIST */}
      <div className="events-list-container">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : !items || items.length === 0 ? (
          <Empty description="Hiện chưa có sự kiện nào" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <>
            <Row gutter={[0, 16]}> {/* Gutter dọc 16px, ngang 0 */}
              {items.map((ev) => (
                // Quan trọng: span=24 để thẻ chiếm hết chiều ngang -> Hiển thị dạng List
                <Col key={ev.event_id} span={24}>
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
              <div className="pagination-wrapper">
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
    </div>
  );
};

export default Events;