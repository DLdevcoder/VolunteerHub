// src/components/Profile/Profile.jsx
import { useSelector } from "react-redux";
import { Card, Descriptions, Avatar } from "antd";
import { Navigate } from "react-router-dom";
import "./Profile.css";

const Profile = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  // If not logged in, redirect to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Backend fields: full_name, email, phone, avatar_url, role_name, status, created_at
  return (
    <div className="profile-container">
      <Card className="profile-card">
        <div className="profile-header">
          <Avatar
            size={80}
            src={
              user.avatar_url ||
              "https://ui-avatars.com/api/?name=" + user.full_name
            }
          />
          <div className="profile-header-info">
            <h2>{user.full_name}</h2>
            <p>{user.email}</p>
            <p>{user.role_name}</p>
          </div>
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Full name">
            {user.full_name}
          </Descriptions.Item>
          <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">
            {user.phone || "Not provided"}
          </Descriptions.Item>
          <Descriptions.Item label="Role">{user.role_name}</Descriptions.Item>
          <Descriptions.Item label="Status">{user.status}</Descriptions.Item>
          <Descriptions.Item label="Joined at">
            {user.created_at
              ? new Date(user.created_at).toLocaleString()
              : "N/A"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
};

export default Profile;
