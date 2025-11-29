// src/components/EventCard.jsx
import { Card, Tag, Button, Space, Typography } from "antd";

const { Text, Title } = Typography;

function formatDateRange(start, end) {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);

  const pad = (n) => n.toString().padStart(2, "0");
  const fmt = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;

  return `${fmt(s)} - ${fmt(e)}`;
}

const EventCard = ({
  event,
  onRegister,
  onCancel,
  registeringId,
  userRole,
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

  return (
    <Card hoverable bodyStyle={{ padding: 16 }}>
      <Space direction="vertical" size={8} style={{ width: "100%" }}>
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            {title}
          </Title>
          {category_name && <Tag color="blue">{category_name}</Tag>}
        </Space>

        <Text type="secondary">⏰ {formatDateRange(start_date, end_date)}</Text>
        <Text>📍 {location}</Text>

        <Text type="secondary" ellipsis={{ rows: 3, expandable: true }}>
          {description}
        </Text>

        <Space
          style={{ marginTop: 8, justifyContent: "space-between" }}
          align="center"
        >
          <Text strong>👥 {participantsText}</Text>

          {canRegister && (
            <Space>
              <Button
                type="primary"
                size="small"
                onClick={() => onRegister(event_id)}
                loading={registeringId === event_id}
              >
                Đăng ký
              </Button>

              {onCancel && (
                <Button
                  size="small"
                  danger
                  onClick={() => onCancel(event_id)}
                  loading={registeringId === `cancel-${event_id}`}
                >
                  Hủy
                </Button>
              )}
            </Space>
          )}
        </Space>
      </Space>
    </Card>
  );
};

export default EventCard;
