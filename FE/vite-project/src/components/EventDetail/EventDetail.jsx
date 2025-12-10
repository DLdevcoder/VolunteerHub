import "./EventDetail.css";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Card, Typography, Spin, Empty, Tabs, Button, Space } from "antd";

import {
  eventDetailSelector,
  eventDetailLoadingSelector,
} from "../../redux/selectors/eventSelectors";
import { fetchEventDetailThunk } from "../../redux/slices/eventSlice";

import {
  getMyRegistrationStatusThunk,
  cancelRegistrationThunk,
  registerForEventThunk,
} from "../../redux/slices/registrationSlice";

import EventPostsTab from "./EventPostsTab";
import EventParticipantsTab from "./EventParticipantsTab";
import EventVolunteersListTab from "./EventVolunteersListTab";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

const { Title, Text, Paragraph } = Typography;

// Helper format thời gian (giống EventCard)
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
  const messageApi = useGlobalMessage();

  const event = useSelector(eventDetailSelector);
  const detailLoading = useSelector(eventDetailLoadingSelector);
  const authUser = useSelector((state) => state.auth.user);

  const [cancelLoading, setCancelLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  // ----- registration status cho event này -----
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

  // ----- helper role -----
  const isManager = useMemo(() => {
    if (!authUser || !event) return false;
    return authUser.user_id === event.manager_id;
  }, [authUser, event]);

  const isVolunteer = authUser?.role_name === "Volunteer";

  // Quy tắc xem post:
  // - Manager: luôn được xem
  // - Volunteer: chỉ khi backend cho phép (approved/completed)
  const canViewPosts = isManager || (isVolunteer && canAccessPostsFlag);

  // ----- load event detail + registration status -----
  useEffect(() => {
    if (!event_id) return;

    dispatch(fetchEventDetailThunk(event_id));

    if (authUser && authUser.role_name === "Volunteer") {
      dispatch(getMyRegistrationStatusThunk(event_id));
    }
  }, [dispatch, event_id, authUser?.user_id, authUser?.role_name, authUser]);

  // ----- Hủy đăng ký -----
  const handleCancelRegistration = async () => {
    try {
      setCancelLoading(true);
      const res = await dispatch(cancelRegistrationThunk(event_id)).unwrap();

      const msgFromRes =
        res?.message || res?.payload?.message || res?.data?.message;
      messageApi.success(msgFromRes || "Hủy đăng ký thành công");

      // reload lại trạng thái
      dispatch(getMyRegistrationStatusThunk(event_id));
      dispatch(fetchEventDetailThunk(event_id));
    } catch (err) {
      const msgErr =
        err?.message ||
        err?.payload?.message ||
        err?.data?.message ||
        "Không thể hủy đăng ký sự kiện";
      messageApi.error(msgErr);
    } finally {
      setCancelLoading(false);
    }
  };

  // ----- Đăng ký tham gia -----
  const handleRegister = async () => {
    try {
      setRegisterLoading(true);
      const res = await dispatch(registerForEventThunk(event_id)).unwrap();

      const msgFromRes =
        res?.message || res?.payload?.message || res?.data?.message;
      messageApi.success(
        msgFromRes || "Đã gửi yêu cầu đăng ký! Vui lòng chờ duyệt."
      );

      dispatch(getMyRegistrationStatusThunk(event_id));
      dispatch(fetchEventDetailThunk(event_id));
    } catch (err) {
      const msgErr =
        err?.message ||
        err?.payload?.message ||
        err?.data?.message ||
        "Không thể đăng ký sự kiện";
      messageApi.error(msgErr);
    } finally {
      setRegisterLoading(false);
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

  // Khi nào hiện nút "Hủy tham gia"
  const canShowCancelButton =
    isVolunteer && ["pending", "approved"].includes(registrationStatus);

  // Khi nào hiện nút "Đăng ký tham gia"
  // - chưa có đăng ký
  // - hoặc đã bị từ chối / đã hủy trước đó
  const canShowRegisterButton =
    isVolunteer &&
    (!hasRegistration ||
      ["rejected", "cancelled"].includes(registrationStatus));

  // =========================================================
  //  CONTENT BELOW INFO BLOCK
  // =========================================================

  // Nội dung bên trong tab "Bài viết" đối với Volunteer
  const renderVolunteerPostsTabContent = () => {
    if (!hasRegistration) {
      return (
        <Empty description="Bạn cần đăng ký tham gia sự kiện để xem bài viết và danh sách tình nguyện viên." />
      );
    }

    switch (registrationStatus) {
      case "pending":
        return (
          <Empty description="Đăng ký của bạn đang chờ duyệt. Bạn sẽ xem được bài viết sau khi được chấp thuận." />
        );
      case "rejected":
        return (
          <Empty description="Đăng ký của bạn đã bị từ chối, nên bạn không thể xem bài viết của sự kiện này." />
        );
      case "cancelled":
        return (
          <Empty description="Bạn đã hủy đăng ký sự kiện này. Hãy đăng ký lại nếu muốn tham gia và xem bài viết." />
        );
      default:
        break;
    }

    if (canViewPosts) {
      return (
        <EventPostsTab
          eventId={event_id}
          event={event}
          authUser={authUser}
          canViewPosts
          canCreatePost
        />
      );
    }

    return (
      <Empty description="Bạn không có quyền xem các bài viết của sự kiện này." />
    );
  };

  const renderTabsOrInfo = () => {
    // 1. Chưa đăng nhập
    if (!authUser) {
      return (
        <Card bordered={false}>
          <Empty description="Bạn cần đăng nhập và đăng ký tham gia sự kiện để xem chi tiết nội dung." />
        </Card>
      );
    }

    // 2. Manager: 3 tab
    if (isManager) {
      const items = [
        {
          key: "posts",
          label: "Bài viết",
          children: (
            <EventPostsTab
              eventId={event_id}
              event={event}
              authUser={authUser}
              canViewPosts
              canCreatePost
            />
          ),
        },
        {
          key: "volunteers",
          label: "Danh sách tình nguyện viên",
          children: <EventVolunteersListTab eventId={event_id} />,
        },
        {
          key: "volunteerManagement",
          label: "Quản lý người tham gia",
          children: <EventParticipantsTab eventId={event_id} />,
        },
      ];

      return (
        <Card bordered={false}>
          <Tabs defaultActiveKey="posts" items={items} />
        </Card>
      );
    }

    // 3. Volunteer (đã đăng nhập)
    if (isVolunteer) {
      if (!hasRegistration) {
        return (
          <Card bordered={false}>
            <Empty description="Bạn cần đăng ký tham gia sự kiện để xem bài viết và danh sách tình nguyện viên." />
          </Card>
        );
      }

      const items = [
        {
          key: "posts",
          label: "Bài viết",
          children: renderVolunteerPostsTabContent(),
        },
        {
          key: "volunteers",
          label: "Danh sách tình nguyện viên",
          children: <EventVolunteersListTab eventId={event_id} />,
        },
      ];

      return (
        <Card bordered={false}>
          <Tabs defaultActiveKey="volunteers" items={items} />
        </Card>
      );
    }

    // 4. Role khác
    return (
      <Card bordered={false}>
        <Empty description="Bạn không có quyền xem nội dung chi tiết của sự kiện này." />
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

            {/* Nút hành động cho Volunteer */}
            {(canShowCancelButton || canShowRegisterButton) && (
              <Space style={{ marginTop: 8 }}>
                {canShowCancelButton && (
                  <Button
                    danger
                    size="small"
                    loading={cancelLoading}
                    onClick={handleCancelRegistration}
                  >
                    Hủy tham gia
                  </Button>
                )}

                {canShowRegisterButton && (
                  <Button
                    type="primary"
                    size="small"
                    loading={registerLoading}
                    onClick={handleRegister}
                  >
                    Đăng ký tham gia
                  </Button>
                )}
              </Space>
            )}
          </div>
        )}
      </Card>

      {/* ======= Bên dưới: Tabs tuỳ theo role + status ======= */}
      {renderTabsOrInfo()}
    </div>
  );
};

export default EventDetail;
