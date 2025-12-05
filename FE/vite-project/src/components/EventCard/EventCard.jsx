// src/components/EventCard/EventCard.jsx
import { Card, Tag, Button, Space } from "antd";
import { IoIosTime } from "react-icons/io";
import { FaLocationDot } from "react-icons/fa6";
import { FaUserFriends } from "react-icons/fa";
import "./EventCard.css";

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

const EventCard = ({
  event,
  onRegister,
  onCancel,
  registeringId,
  userRole,
  onClickCard,
}) => {
  const {
    event_id,
    title,
    description,
    location,
    start_date,
    end_date,
    category_name,
    target_participants,
    current_participants,
  } = event;

  const participantsText =
    target_participants && target_participants > 0
      ? `${current_participants}/${target_participants}`
      : `${current_participants} người tham gia`;

  const canRegister = userRole === "Volunteer";

  const handleCardClick = () => {
    if (onClickCard) onClickCard(event_id);
  };

  const handleRegisterClick = (e) => {
    e.stopPropagation();
    if (onRegister) onRegister(event_id);
  };

  const handleCancelClick = (e) => {
    e.stopPropagation();
    if (onCancel) onCancel(event_id);
  };

  return (
    <Card
      hoverable
      className="card-container"
      onClick={handleCardClick}
      style={{ cursor: onClickCard ? "pointer" : "default" }}
    >
      <div className="card-header-container">
        <div className="header-title">{title}</div>
        <div className="header-tag">
          {category_name && <Tag color="blue">{category_name}</Tag>}
        </div>
      </div>
      <div className="card-content-container">
        <div className="date">
          <div className="date-icon">
            <IoIosTime />
          </div>
          <div className="date-content">
            {formatDateRange(start_date, end_date)}
          </div>
        </div>
        <div className="location">
          <div className="location-icon">
            <FaLocationDot />
          </div>
          <div className="location-content">{location}</div>
        </div>
        <div className="description">{description}</div>
        <div className="register-container">
          <div className="participants">
            <div className="participants-icon">
              <FaUserFriends />
            </div>
            <div className="participants-content">{participantsText}</div>
          </div>
          <div className="buttons">
            {canRegister && (
              <Space>
                <Button
                  type="primary"
                  size="small"
                  onClick={handleRegisterClick}
                  loading={registeringId === event_id}
                >
                  Đăng ký
                </Button>

                {onCancel && (
                  <Button
                    size="small"
                    danger
                    onClick={handleCancelClick}
                    loading={registeringId === `cancel-${event_id}`}
                  >
                    Hủy
                  </Button>
                )}
              </Space>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EventCard;
