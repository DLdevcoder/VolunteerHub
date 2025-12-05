// src/pages/EventsPage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Row, Col, Spin, Empty, Pagination, message, Typography } from "antd";
import { useNavigate } from "react-router-dom";

import EventCard from "../components/EventCard/EventCard";
import { fetchActiveEvents } from "../redux/slices/eventSlice";
import {
  activeEventsSelector,
  activeEventsPaginationSelector,
  activeEventsLoadingSelector,
  activeEventsErrorSelector,
} from "../redux/selectors/eventSelectors";
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
  const navigate = useNavigate();

  // ===== EVENTS STATE (from selectors) =====
  const events = useSelector(activeEventsSelector);
  const pagination = useSelector(activeEventsPaginationSelector);
  const loading = useSelector(activeEventsLoadingSelector);
  const error = useSelector(activeEventsErrorSelector);

  // ===== AUTH STATE =====
  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role_name;

  // ===== REGISTRATION STATE =====
  const registeringId = useSelector(volunteerRegisteringIdSelector);
  const registrationError = useSelector(volunteerRegistrationErrorSelector);

  const [page, setPage] = useState(1);

  useEffect(() => {
    dispatch(
      fetchActiveEvents({
        page,
        limit: DEFAULT_LIMIT,
      })
    );
  }, [dispatch, page]);

  useEffect(() => {
    if (error) {
      message.error(error);
    }
  }, [error]);

  useEffect(() => {
    if (registrationError) {
      message.error(registrationError);
    }
  }, [registrationError]);

  const handleRegister = async (eventId) => {
    try {
      const result = await dispatch(registerForEventThunk(eventId)).unwrap();
      message.success(result?.message || "Đăng ký sự kiện thành công");
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

  const handleViewDetail = (eventId) => {
    navigate(`/events/${eventId}`);
  };

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
      ) : !events || events.length === 0 ? (
        <Empty description="Không có sự kiện nào" />
      ) : (
        <>
          <Row gutter={[16, 16]} align="stretch">
            {events.map((ev) => (
              <Col key={ev.event_id} xs={24} md={12} lg={8}>
                <EventCard
                  event={ev}
                  onRegister={handleRegister}
                  onCancel={handleCancel}
                  registeringId={registeringId}
                  userRole={userRole}
                  onClickCard={handleViewDetail}
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
