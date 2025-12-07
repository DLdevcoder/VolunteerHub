// src/components/EventCard/EventCard.jsx
import { Card, Tag, Button } from "antd";
import { IoIosTime } from "react-icons/io";
import { FaLocationDot } from "react-icons/fa6";
import { FaUserFriends } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
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

const EventCard = ({ event, onRegister, registeringId, userRole }) => {
  const navigate = useNavigate();

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
    // 🔹 2 field mới từ backend:
    has_available_slots,
    user_registration_status,
  } = event;

  const participantsText =
    target_participants && target_participants > 0
      ? `${current_participants}/${target_participants}`
      : `${current_participants ?? 0} người tham gia`;

  const now = new Date();
  const hasStarted = start_date && new Date(start_date) <= now;

  let buttonText = "Đăng ký";
  let disabled = false;

  if (hasStarted) {
    buttonText = "Đã bắt đầu";
    disabled = true;
  } else {
    switch (user_registration_status) {
      case "pending":
        buttonText = "Đang chờ duyệt";
        disabled = true;
        break;
      case "approved":
        buttonText = "Đã tham gia";
        disabled = true;
        break;
      case "completed":
        buttonText = "Đã hoàn thành";
        disabled = true;
        break;
      case "rejected":
        buttonText = "Bị từ chối";
        disabled = true;
        break;
      case "cancelled":
        if (has_available_slots === false) {
          buttonText = "Đã đủ người";
          disabled = true;
        } else {
          buttonText = "Đăng ký lại";
          disabled = false;
        }
        break;
      default:
        if (has_available_slots === false) {
          buttonText = "Đã đủ người";
          disabled = true;
        } else {
          buttonText = "Đăng ký";
          disabled = false;
        }
        break;
    }
  }

  // Hiển thị nút cho Volunteer + user chưa login
  const showButton = !userRole || userRole === "Volunteer";

  const handleCardClick = () => {
    navigate(`/events/${event_id}`);
  };

  const handleRegisterClick = (e) => {
    e.stopPropagation();
    if (!disabled && onRegister) {
      onRegister(event_id);
    }
  };

  return (
    <Card hoverable className="card-container" onClick={handleCardClick}>
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
            {showButton && (
              <Button
                type="primary"
                size="small"
                onClick={handleRegisterClick}
                loading={registeringId === event_id}
                disabled={disabled}
              >
                {buttonText}
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default EventCard;
