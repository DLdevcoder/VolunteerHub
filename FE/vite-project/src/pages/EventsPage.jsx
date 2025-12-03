import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Spin, Empty, Pagination, message, Typography } from "antd";

import EventCard from "../components/EventCard/EventCard";
import { fetchActiveEvents } from "../redux/slices/eventSlice";
import {
  registerForEventThunk,
  cancelRegistrationThunk,
} from "../redux/slices/registrationSlice";
import {
  volunteerRegisteringIdSelector,
  volunteerRegistrationErrorSelector,
} from "../redux/selectors/registrationSelectors";

const { Title } = Typography;

const DEFAULT_LIMIT = 9; // 3 cột x 3 hàng

const EventsPage = () => {
  const dispatch = useDispatch();

  // ======= EVENTS STATE (from eventSlice) =======
  const { items, pagination, loading, error } = useSelector(
    (state) => state.events
  );

  // ======= AUTH STATE (to know role) =======
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role_name;

  // ======= REGISTRATION STATE (from registrationSlice via selectors) =======
  const registeringId = useSelector(volunteerRegisteringIdSelector);
  const registrationError = useSelector(volunteerRegistrationErrorSelector);

  const [page, setPage] = useState(1);

  // Load events when first mount + when page changes
  useEffect(() => {
    dispatch(
      fetchActiveEvents({
        page,
        limit: DEFAULT_LIMIT,
      })
    );
  }, [dispatch, page]);

  // Show errors from eventSlice
  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  // Show errors from registrationSlice (volunteer)
  useEffect(() => {
    if (registrationError) {
      message.error(registrationError);
    }
  }, [registrationError]);

  // ======= HANDLERS =======

  const handleRegister = async (eventId) => {
    try {
      const result = await dispatch(registerForEventThunk(eventId)).unwrap();

      // result: { eventId, message }
      message.success(result?.message || "Đăng ký sự kiện thành công");

      // Reload events to update participants count
      dispatch(
        fetchActiveEvents({
          page,
          limit: DEFAULT_LIMIT,
        })
      );
    } catch (err) {
      const msg = err?.message || "Không thể đăng ký sự kiện";
      message.error(msg);
    }
  };

  const handleCancel = async (eventId) => {
    try {
      const result = await dispatch(cancelRegistrationThunk(eventId)).unwrap();

      message.success(result?.message || "Hủy đăng ký thành công");

      // Optionally reload events to update participants
      dispatch(
        fetchActiveEvents({
          page,
          limit: DEFAULT_LIMIT,
        })
      );
    } catch (err) {
      const msg = err?.message || "Không thể hủy đăng ký sự kiện";
      message.error(msg);
    }
  };

  // ======= RENDER =======

  return (
    <div style={{ padding: 24 }}>
      <Title level={3} style={{ marginBottom: 16 }}>
        Events
      </Title>

      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            paddingTop: 40,
          }}
        >
          <Spin size="large" />
        </div>
      ) : !items || items.length === 0 ? (
        <Empty description="Không có sự kiện nào" />
      ) : (
        <>
          {/* 3 cột card: mobile 1, tablet 2, desktop 3 */}
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

export default EventsPage;
