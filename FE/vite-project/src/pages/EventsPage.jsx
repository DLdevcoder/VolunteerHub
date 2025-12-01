// src/pages/EventsPage.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchActiveEvents } from "../redux/slices/eventSlice";
import { Row, Col, Spin, Empty, Pagination, message, Typography } from "antd";
import EventCard from "../components/EventCard/EventCard";
import registrationApi from "../../apis/registrationApi";

const { Title } = Typography;

const DEFAULT_LIMIT = 9; // 3 cột x 3 hàng

const EventsPage = () => {
  const dispatch = useDispatch();
  const { items, pagination, loading, error } = useSelector(
    (state) => state.events
  );

  // console.log("in EventPage.jsx, pagination: ", pagination);

  const { user } = useSelector((state) => state.auth);
  const userRole = user?.role_name;

  const [page, setPage] = useState(1);
  const [registeringId, setRegisteringId] = useState(null);

  // load events lần đầu + khi đổi trang
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

  const handleRegister = async (eventId) => {
    try {
      setRegisteringId(eventId);
      const res = await registrationApi.registerForEvent(eventId);
      message.success(res?.data?.message || "Đăng ký sự kiện thành công");
      // Nếu muốn cập nhật lại số người tham gia:
      dispatch(fetchActiveEvents({ page, limit: DEFAULT_LIMIT }));
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Không thể đăng ký sự kiện"
      );
    } finally {
      setRegisteringId(null);
    }
  };

  const handleCancel = async (eventId) => {
    try {
      setRegisteringId(`cancel-${eventId}`);
      const res = await registrationApi.cancelRegistration(eventId);
      message.success(res?.data?.message || "Hủy đăng ký thành công");
    } catch (err) {
      message.error(
        err?.response?.data?.message || "Không thể hủy đăng ký sự kiện"
      );
    } finally {
      setRegisteringId(null);
    }
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
                  // nếu chưa muốn cho hủy thì tạm comment:
                  onCancel={handleCancel}
                  registeringId={registeringId}
                  userRole={userRole}
                />
              </Col>
            ))}
          </Row>

          {pagination.total > pagination.limit && (
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
