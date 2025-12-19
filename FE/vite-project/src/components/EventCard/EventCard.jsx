import { Button } from "antd";
import { CalendarOutlined } from "@ant-design/icons"; // Thêm icon mới
import { FaLocationDot } from "react-icons/fa6";
import { 
  FaUserFriends, 
  FaBookReader,        
  FaLeaf,              
  FaHandsHelping,      
  FaShapes             
} from "react-icons/fa"; 
import { useNavigate } from "react-router-dom";
import "./EventCard.css";

const formatFullDateTime = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const pad = (n) => n.toString().padStart(2, "0");
  const fmt = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;

  return `${fmt(s)} - ${fmt(e)}`;
};

const getCategoryInfo = (name) => {
  const lowerName = name?.toLowerCase() || "";
  if (lowerName.includes("giáo dục")) {
    return { icon: <FaBookReader />, colorClass: "ec-cat-edu", label: "Giáo dục" };
  } else if (lowerName.includes("môi trường")) {
    return { icon: <FaLeaf />, colorClass: "ec-cat-env", label: "Môi trường" };
  } else if (lowerName.includes("xã hội")) {
    return { icon: <FaHandsHelping />, colorClass: "ec-cat-soc", label: "Xã hội" };
  } else {
    return { icon: <FaShapes />, colorClass: "ec-cat-default", label: name || "Khác" };
  }
};

const EventCard = ({ event, onRegister, registeringId, userRole }) => {
  const navigate = useNavigate();

  const {
    event_id,
    title,
    location,
    start_date,
    end_date,
    category_name,
    target_participants,
    current_participants,
    has_available_slots,
    user_registration_status,
  } = event;

  const { icon, colorClass, label } = getCategoryInfo(category_name);
  const fullTimeDisplay = formatFullDateTime(start_date, end_date);
  
  const participantsText =
    target_participants > 0
      ? `${current_participants}/${target_participants}`
      : `${current_participants}`;

  const now = new Date();
  const hasStarted = start_date && new Date(start_date) <= now;
  let buttonText = "Đăng ký";
  let disabled = false;
  let btnClass = "ec-btn-default"; 

  if (hasStarted) {
    buttonText = "Đã kết thúc";
    disabled = true;
    btnClass = "ec-btn-disabled";
  } else {
    switch (user_registration_status) {
      case "pending": 
        buttonText = "Chờ duyệt"; 
        disabled = true; 
        btnClass = "ec-btn-pending";
        break;
      case "approved": 
        buttonText = "Đã tham gia"; 
        disabled = true; 
        btnClass = "ec-btn-approved";
        break;
      case "completed": 
        buttonText = "Hoàn thành"; 
        disabled = true; 
        btnClass = "ec-btn-success"; 
        break;
      case "rejected":
      case "cancelled":
        buttonText = has_available_slots === false ? "Đủ người" : "Đăng ký lại";
        disabled = has_available_slots === false;
        break;
      default:
        buttonText = has_available_slots === false ? "Hết chỗ" : "Đăng ký";
        disabled = has_available_slots === false;
        break;
    }
  }

  const showButton = !userRole || userRole === "Volunteer";
  
  const handleRegisterClick = (e) => { 
    e.stopPropagation(); 
    if (!disabled && onRegister) onRegister(event_id); 
  };

  return (
    <div id={`ec-card-${event_id}`} className="ec-item-wrapper" onClick={() => navigate(`/events/${event_id}`)}>
      <div className={`ec-category-box ${colorClass}`}>
        <div className="ec-cat-icon-large">{icon}</div>
        <span className="ec-cat-label">{label}</span>
      </div>

      <div className="ec-info-section">
        <h3 className="ec-title" title={title}>{title}</h3>
        <div className="ec-meta-column">
          <div className="ec-meta-item">
            <div className="ec-meta-icon-wrapper"><CalendarOutlined /></div> {/* Đã đổi icon ở đây */}
            <span className="ec-meta-text">{fullTimeDisplay}</span>
          </div>
          <div className="ec-meta-item">
            <div className="ec-meta-icon-wrapper"><FaLocationDot /></div>
            <span className="ec-meta-text ec-location-text" title={location}>{location}</span>
          </div>
        </div>
      </div>

      <div className="ec-action-section">
        <div className="ec-participants-badge">
          <FaUserFriends style={{ fontSize: 14, color: '#999' }} /> 
          <span>{participantsText} người</span>
        </div>

        {showButton && (
          <Button
            type="primary"
            className={`ec-action-btn ${btnClass}`}
            onClick={handleRegisterClick}
            loading={registeringId === event_id}
            disabled={disabled}
            size="middle"
          >
            {buttonText}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EventCard;