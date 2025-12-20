import "./EventDetail.css";
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Typography,
  Spin,
  Empty,
  Tabs,
  Button,
  Tag,
  Row,
  Col,
  Divider,
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
  TeamOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

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

const { Title, Paragraph } = Typography;

const formatDateRange = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);

  const pad = (n) => n.toString().padStart(2, "0");
  const fmt = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

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

  const registrationStatus = registrationState.status;
  const hasRegistration = registrationState.hasRegistration;
  const canAccessPostsFlag = registrationState.canAccessPosts;

  const isManager = useMemo(() => {
    if (!authUser || !event) return false;
    return authUser.user_id === event.manager_id;
  }, [authUser, event]);

  const isVolunteer = authUser?.role_name === "Volunteer";
  const canViewPosts = isManager || (isVolunteer && canAccessPostsFlag);

  useEffect(() => {
    if (!event_id) return;
    dispatch(fetchEventDetailThunk(event_id));
    if (authUser && authUser.role_name === "Volunteer") {
      dispatch(getMyRegistrationStatusThunk(event_id));
    }
  }, [dispatch, event_id, authUser?.user_id, authUser?.role_name, authUser]);

  const handleCancelRegistration = async () => {
    try {
      setCancelLoading(true);
      const res = await dispatch(cancelRegistrationThunk(event_id)).unwrap();
      const msgFromRes =
        res?.message || res?.payload?.message || res?.data?.message;
      messageApi.success(msgFromRes || "Hủy đăng ký thành công");
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
    if (target && target > 0) return `${current}/${target}`;
    return `${current}`;
  })();

  const canShowCancelButton =
    isVolunteer && ["pending", "approved"].includes(registrationStatus);
  const canShowRegisterButton =
    isVolunteer &&
    (!hasRegistration ||
      ["rejected", "cancelled"].includes(registrationStatus));

  const renderStatusBadge = () => {
    if (!registrationStatus) return null;

    let icon = null;
    let text = "";
    let cls = "";

    switch (registrationStatus) {
      case "pending":
        icon = <ClockCircleOutlined />;
        text = "Đang chờ duyệt";
        cls = "status-badge status-pending";
        break;
      case "approved":
        icon = <CheckCircleOutlined />;
        text = "Đã tham gia";
        cls = "status-badge status-approved";
        break;
      case "rejected":
        icon = <CloseCircleOutlined />;
        text = "Bị từ chối";
        cls = "status-badge status-rejected";
        break;
      case "cancelled":
        icon = <CloseCircleOutlined />;
        text = "Đã hủy";
        cls = "status-badge status-cancelled";
        break;
      default:
        return null;
    }

    return (
      <Tag icon={icon} className={cls}>
        {text.toUpperCase()}
      </Tag>
    );
  };

  const renderVolunteerPostsTabContent = () => {
    if (!hasRegistration)
      return (
        <Empty description="Bạn cần đăng ký tham gia sự kiện để xem bài viết." />
      );

    switch (registrationStatus) {
      case "pending":
        return (
          <Empty description="Đăng ký đang chờ duyệt. Vui lòng quay lại sau." />
        );
      case "rejected":
        return (
          <Empty description="Đăng ký bị từ chối. Không thể xem bài viết." />
        );
      case "cancelled":
        return <Empty description="Bạn đã hủy đăng ký." />;
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
    return <Empty description="Không có quyền xem bài viết." />;
  };

  const renderTabsOrInfo = () => {
    if (!authUser) {
      return (
        <Card className="content-card">
          <Empty description="Bạn cần đăng nhập để xem chi tiết." />
        </Card>
      );
    }

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
          label: "DS Tình nguyện viên",
          children: <EventVolunteersListTab eventId={event_id} />,
        },
        {
          key: "volunteerManagement",
          label: "Quản lý tham gia",
          children: <EventParticipantsTab eventId={event_id} />,
        },
      ];
      return (
        <Card className="content-card">
          <Tabs defaultActiveKey="posts" items={items} />
        </Card>
      );
    }

    if (isVolunteer) {
      if (!hasRegistration) {
        return (
          <Card className="content-card">
            <Empty description="Đăng ký tham gia để xem nội dung chi tiết." />
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
          label: "DS Tình nguyện viên",
          children: <EventVolunteersListTab eventId={event_id} />,
        },
      ];

      return (
        <Card className="content-card">
          <Tabs defaultActiveKey="posts" items={items} />
        </Card>
      );
    }

    return (
      <Card className="content-card">
        <Empty description="Không có quyền truy cập." />
      </Card>
    );
  };

  return (
    <div className="event-detail-page">
      <Card className="info-card" bordered={false}>
        {detailLoading && !event ? (
          <div className="loading-box">
            <Spin size="large" />
          </div>
        ) : !event ? (
          <Empty description="Không tìm thấy sự kiện" />
        ) : (
          <div className="event-detail-wrapper">
            <div className="event-header">
              <div className="header-left">
                <Title level={2} className="event-title">
                  {event.title}
                </Title>
                {renderStatusBadge()}
              </div>
            </div>

            <Divider className="divider-soft" />

            <Row gutter={[20, 20]} className="meta-info-row">
              <Col xs={24} md={8}>
                <div className="meta-item">
                  <div className="meta-icon-wrap">
                    <CalendarOutlined className="meta-icon" />
                  </div>
                  <div className="meta-text">
                    <div className="meta-label">Thời gian</div>
                    <div className="meta-value">
                      {formatDateRange(event.start_date, event.end_date)}
                    </div>
                  </div>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div className="meta-item ">
                  <div className="meta-icon-wrap">
                    <EnvironmentOutlined className="meta-icon" />
                  </div>
                  <div className="meta-text">
                    <div className="meta-label">Địa điểm</div>
                    <div className="meta-value">{event.location}</div>
                  </div>
                </div>
              </Col>

              <Col xs={24} md={8}>
                <div className="meta-item">
                  <div className="meta-icon-wrap">
                    <TeamOutlined className="meta-icon" />
                  </div>
                  <div className="meta-text">
                    <div className="meta-label">Người tham gia</div>
                    <div className="meta-value highlight">
                      {participantsText} <span className="meta-sub"></span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>

            {event.description && (
              <div className="description-box">
                <div className="desc-label">
                  <InfoCircleOutlined /> Mô tả sự kiện
                </div>
                <Paragraph className="desc-content">
                  {event.description}
                </Paragraph>
              </div>
            )}

            {(canShowCancelButton || canShowRegisterButton) && (
              <div className="action-area">
                {canShowCancelButton && (
                  <Button
                    danger
                    size="large"
                    className="action-btn action-btn-danger"
                    loading={cancelLoading}
                    onClick={handleCancelRegistration}
                  >
                    Hủy tham gia
                  </Button>
                )}

                {canShowRegisterButton && (
                  <Button
                    type="primary"
                    size="large"
                    className="action-btn action-btn-primary"
                    loading={registerLoading}
                    onClick={handleRegister}
                  >
                    Đăng ký tham gia ngay
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <div className="tabs-section">{renderTabsOrInfo()}</div>
    </div>
  );
};

export default EventDetail;
