// src/pages/EventDetail/EventDetail.jsx
import "./EventDetail.css";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Typography,
  Spin,
  Empty,
  Tabs,
  Button,
  Space,
  message,
} from "antd";

import {
  eventDetailSelector,
  eventDetailLoadingSelector,
} from "../../redux/selectors/eventSelectors";
import { fetchEventDetailThunk } from "../../redux/slices/eventSlice";

import {
  getMyRegistrationStatusThunk,
  cancelRegistrationThunk,
} from "../../redux/slices/registrationSlice";

import EventPostsTab from "./EventPostsTab";
import EventParticipantsTab from "./EventParticipantsTab";

const { Title, Text, Paragraph } = Typography;

// same format helper as EventCard
const formatDateRange = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);

  const pad = (n) => n.toString().padStart(2, "0");
  const fmt = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;

  return `${fmt(s)} - ${fmt(e)}`;
};

const EventDetail = () => {
  const { event_id } = useParams();
  const dispatch = useDispatch();

  const event = useSelector(eventDetailSelector);
  const detailLoading = useSelector(eventDetailLoadingSelector);
  const authUser = useSelector((state) => state.auth.user);

  const [activeTab, setActiveTab] = useState("posts");
  const [cancelLoading, setCancelLoading] = useState(false);

  // ----- registration status for this event -----
  const defaultRegState = {
    loading: false,
    hasRegistration: false,
    status: null,
    canAccessPosts: false,
  };

  const registrationState = useSelector((state) => {
    const map = state.registration?.volunteer?.byEventStatus || {};
    return map[event_id] || defaultRegState;
  });

  const registrationStatus = registrationState.status; // pending | approved | completed | rejected | cancelled | null
  const hasRegistration = registrationState.hasRegistration;
  const canAccessPostsFlag = registrationState.canAccessPosts;

  // ----- role helpers -----
  const isManager = useMemo(() => {
    if (!authUser || !event) return false;
    return authUser.user_id === event.manager_id;
  }, [authUser, event]);

  const isVolunteer = authUser?.role_name === "Volunteer";

  // Final "can view posts" rule:
  //  - Manager: always
  //  - Volunteer: only when backend says canAccessPosts (approved/completed)
  const canViewPosts = isManager || (isVolunteer && canAccessPostsFlag);

  // ----- load event detail + my registration status -----
  useEffect(() => {
    if (!event_id) return;

    dispatch(fetchEventDetailThunk(event_id));

    // only Volunteer needs per-event registration status
    if (authUser && authUser.role_name === "Volunteer") {
      dispatch(getMyRegistrationStatusThunk(event_id));
    }
  }, [dispatch, event_id, authUser?.user_id, authUser?.role_name]);

  // ----- cancel registration -----
  const handleCancelRegistration = async () => {
    try {
      setCancelLoading(true);
      await dispatch(cancelRegistrationThunk(event_id)).unwrap();
      message.success("Hủy đăng ký thành công");

      // reload registration status + event detail
      dispatch(getMyRegistrationStatusThunk(event_id));
      dispatch(fetchEventDetailThunk(event_id));
    } catch (err) {
      const msg = err?.message || "Không thể hủy đăng ký sự kiện";
      message.error(msg);
    } finally {
      setCancelLoading(false);
    }
  };

  const participantsText = (() => {
    if (!event) return "";
    const current = event.current_participants ?? 0;
    const target = event.target_participants;

    if (target && target > 0) {
      return `${current}/${target} người tham gia`;
    }
    return `${current} người tham gia`;
  })();

  const canShowCancelButton =
    isVolunteer && ["pending", "approved"].includes(registrationStatus);

  // =========================================================
  //  CONTENT BELOW INFO BLOCK
  // =========================================================
  const renderTabsOrInfo = () => {
    // 1. Chưa đăng nhập -> chỉ xem info, không xem bài viết
    if (!authUser) {
      return (
        <Card bordered={false}>
          <Empty description="Bạn cần đăng nhập và đăng ký tham gia sự kiện để xem bài viết." />
        </Card>
      );
    }

    // 2. Manager: luôn xem được cả 2 tab
    if (isManager) {
      return (
        <Card bordered={false}>
          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <Tabs.TabPane tab="Bài viết" key="posts">
              <EventPostsTab
                eventId={event_id}
                event={event}
                authUser={authUser}
                canViewPosts={true}
                canCreatePost={true}
              />
            </Tabs.TabPane>

            <Tabs.TabPane tab="Người tham gia" key="participants">
              <EventParticipantsTab eventId={event_id} />
            </Tabs.TabPane>
          </Tabs>
        </Card>
      );
    }

    // 3. Volunteer (đã đăng nhập)
    if (isVolunteer) {
      // Chưa hề đăng ký
      if (!hasRegistration) {
        return (
          <Card bordered={false}>
            <Empty description="Bạn cần đăng ký tham gia sự kiện và được chấp thuận để xem các bài viết." />
          </Card>
        );
      }

      // Đang chờ duyệt
      if (registrationStatus === "pending") {
        return (
          <Card bordered={false}>
            <Empty description="Đăng ký của bạn đang chờ duyệt. Bạn sẽ xem được bài viết sau khi được chấp thuận." />
          </Card>
        );
      }

      // Bị từ chối
      if (registrationStatus === "rejected") {
        return (
          <Card bordered={false}>
            <Empty description="Đăng ký của bạn đã bị từ chối, nên bạn không thể xem bài viết của sự kiện này." />
          </Card>
        );
      }

      // Đã hủy
      if (registrationStatus === "cancelled") {
        return (
          <Card bordered={false}>
            <Empty description="Bạn đã hủy đăng ký sự kiện này. Hãy đăng ký lại nếu muốn tham gia và xem bài viết." />
          </Card>
        );
      }

      // Được duyệt / đã hoàn thành -> xem được bài viết
      if (canViewPosts) {
        return (
          <Card bordered={false}>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <Tabs.TabPane tab="Bài viết" key="posts">
                <EventPostsTab
                  eventId={event_id}
                  event={event}
                  authUser={authUser}
                  canViewPosts={true}
                  canCreatePost={true}
                />
              </Tabs.TabPane>

              {/* Volunteer không xem tab người tham gia */}
              <Tabs.TabPane tab="Người tham gia" key="participants" disabled>
                <Empty description="Chỉ Quản lý sự kiện mới xem được danh sách người tham gia." />
              </Tabs.TabPane>
            </Tabs>
          </Card>
        );
      }

      // fallback an toàn
      return (
        <Card bordered={false}>
          <Empty description="Bạn không có quyền xem các bài viết của sự kiện này." />
        </Card>
      );
    }

    // Role khác (nếu có) => xử lý giống chưa đăng nhập
    return (
      <Card bordered={false}>
        <Empty description="Bạn không có quyền xem các bài viết của sự kiện này." />
      </Card>
    );
  };

  return (
    <div className="event-detail-page">
      {/* ======= Top info block ======= */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        {detailLoading && !event ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : !event ? (
          <Empty description="Không tìm thấy sự kiện" />
        ) : (
          <div className="event-detail-summary">
            <Title level={3} style={{ marginBottom: 4 }}>
              {event.title}
            </Title>

            <div style={{ marginBottom: 8 }}>
              <Text strong>Thời gian: </Text>
              <Text>{formatDateRange(event.start_date, event.end_date)}</Text>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text strong>Địa điểm: </Text>
              <Text>{event.location}</Text>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text strong>Người tham gia: </Text>
              <Text>{participantsText}</Text>
            </div>

            {event.description && (
              <Paragraph style={{ marginTop: 8 }}>
                {event.description}
              </Paragraph>
            )}

            {/* Nút Hủy tham gia (Volunteer đã đăng ký) */}
            {canShowCancelButton && (
              <Space style={{ marginTop: 8 }}>
                <Button
                  danger
                  size="small"
                  loading={cancelLoading}
                  onClick={handleCancelRegistration}
                >
                  Hủy tham gia
                </Button>
              </Space>
            )}
          </div>
        )}
      </Card>

      {/* ======= Below: Tabs or info depending on role + status ======= */}
      {renderTabsOrInfo()}
    </div>
  );
};

export default EventDetail;
