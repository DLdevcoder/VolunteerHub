// src/components/AppHeader/AppHeader.jsx
import "./AppHeader.css";
import { Badge, Dropdown, List, Spin, Typography } from "antd";
import { BellOutlined, UserOutlined, LogoutOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import authSlice from "../../redux/slices/authSlice";
import { meSelector } from "../../redux/selectors/userSelectors";
import {
  unreadCountSelector,
  recentNotificationsSelector,
  loadingRecentNotificationsSelector,
} from "../../redux/selectors/notificationSelectors";
import {
  fetchUnreadCountThunk,
  fetchRecentNotificationsThunk,
  markNotificationReadThunk,
} from "../../redux/slices/notificationSlice";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

const { Text } = Typography;

const AppHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const user = useSelector(meSelector);
  const { token } = useSelector((state) => state.auth);

  const unreadCount = useSelector(unreadCountSelector);
  const recent = useSelector(recentNotificationsSelector);
  const loadingRecent = useSelector(loadingRecentNotificationsSelector);

  const [avatarSrc, setAvatarSrc] = useState("");

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarSrc(user.avatar_url);
    } else {
      setAvatarSrc("/images/avatar.png");
    }
  }, [user]);

  const syncHeaderNotifications = () => {
    if (!token) return;
    dispatch(fetchUnreadCountThunk());
    dispatch(fetchRecentNotificationsThunk(5));
  };

  useEffect(() => {
    if (!token) return;
    syncHeaderNotifications();
  }, [token]);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleSwMessage = (event) => {
      const data = event.data;
      if (!data || data.type !== "NEW_NOTIFICATION") return;
      syncHeaderNotifications();
    };

    navigator.serviceWorker.addEventListener("message", handleSwMessage);
    return () =>
      navigator.serviceWorker.removeEventListener("message", handleSwMessage);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const id = setInterval(() => syncHeaderNotifications(), 5000);
    return () => clearInterval(id);
  }, [token]);

  const handleAvatarDropdownClicked = ({ key }) => {
    if (key === "1") {
      navigate("/profile");
    } else if (key === "2") {
      dispatch(authSlice.actions.logout());
      messageApi.success("Đăng xuất thành công");
      navigate("/login");
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.is_read) {
      dispatch(markNotificationReadThunk(item.notification_id)).then(() =>
        syncHeaderNotifications()
      );
    }
  };

  const handleGoToNotificationsPage = () => {
    navigate("/notifications");
  };

  const handleImageError = () => {
    setAvatarSrc("/images/avatar.png");
  };

  const notificationOverlay = (
    <div className="header-notification-dropdown">
      <div className="notif-header">
        <Text strong>Thông báo</Text>
      </div>

      {loadingRecent ? (
        <div className="notif-loading">
          <Spin size="small" />
        </div>
      ) : (
        <>
          <List
            className="notif-list"
            size="small"
            dataSource={recent}
            locale={{ emptyText: "Không có thông báo mới" }}
            renderItem={(item) => {
              let notifTitle = item.title || "Thông báo hệ thống";
              let notifMessage = item.body || "";

              if (!notifMessage) {
                try {
                  const payload =
                    typeof item.payload === "string"
                      ? JSON.parse(item.payload || "{}")
                      : item.payload || {};
                  notifMessage = payload.message || "";
                } catch {}
              }

              return (
                <List.Item
                  className={`notif-item ${
                    item.is_read ? "read" : "unread"
                  }`}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="notif-content">
                    <div className="notif-title text-ellipsis">
                      {notifTitle}
                    </div>
                    <div className="notif-body text-ellipsis-multiline">
                      {notifMessage}
                    </div>
                    <div className="notif-time">
                      {item.created_at
                        ? new Date(item.created_at).toLocaleDateString("vi-VN")
                        : ""}
                    </div>
                  </div>
                  {!item.is_read && <div className="notif-dot" />}
                </List.Item>
              );
            }}
          />
          <div
            className="notif-footer"
            onClick={handleGoToNotificationsPage}
          >
            Xem tất cả thông báo
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="appHeader-container">
      <div
        className="appHeader-logo"
        onClick={() => navigate("/dashboard")}
      >
        VolunteerHub
      </div>

      <div className="appHeader-right">
        <Dropdown
          trigger={["click"]}
          dropdownRender={() => notificationOverlay}
          placement="bottomRight"
          overlayClassName="notif-dropdown-root"
        >
          <div className="header-icon-btn">
            <Badge count={unreadCount} size="small" offset={[-2, 2]}>
              <BellOutlined style={{ fontSize: 20, color: "#555" }} />
            </Badge>
          </div>
        </Dropdown>

        <Dropdown
          trigger={["click"]}
          placement="bottomRight"
          menu={{
            items: [
              {
                key: "1",
                label: "Hồ sơ cá nhân",
                icon: <UserOutlined />,
              },
              {
                type: "divider",
              },
              {
                key: "2",
                label: "Đăng xuất",
                icon: <LogoutOutlined />,
                danger: true,
              },
            ],
            onClick: handleAvatarDropdownClicked,
          }}
        >
          <div className="appHeader-avatar-wrapper">
            <img
              src={avatarSrc}
              alt="avatar"
              onError={handleImageError}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        </Dropdown>
      </div>
    </div>
  );
};

export default AppHeader;
