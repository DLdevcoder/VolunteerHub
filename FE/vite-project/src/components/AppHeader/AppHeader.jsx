import "./AppHeader.css";
import { Input, Avatar, Badge, Dropdown, List, Spin } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { SlLogout } from "react-icons/sl";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
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
import { useEffect } from "react";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

const AppHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const user = useSelector(meSelector);
  const { token } = useSelector((state) => state.auth);

  const unreadCount = useSelector(unreadCountSelector);
  const recent = useSelector(recentNotificationsSelector);
  const loadingRecent = useSelector(loadingRecentNotificationsSelector);

  useEffect(() => {
    if (!token) return;
    dispatch(fetchUnreadCountThunk());
    dispatch(fetchRecentNotificationsThunk(5));
  }, [token, dispatch]);

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
      dispatch(markNotificationReadThunk(item.notification_id));
    }
    // sau này có thể điều hướng dựa trên item.url nếu BE trả về
  };

  const handleGoToNotificationsPage = () => {
    navigate("/notifications");
  };

  const notificationOverlay = (
    <div className="header-notification-dropdown">
      {loadingRecent ? (
        <div style={{ padding: 12, textAlign: "center" }}>
          <Spin size="small" />
        </div>
      ) : (
        <>
          <List
            size="small"
            dataSource={recent}
            locale={{ emptyText: "Không có thông báo" }}
            renderItem={(item) => {
              // Dùng title/body từ BE
              let notifTitle = item.title || "Thông báo mới";
              let notifMessage = item.body || "";

              // Fallback: payload.message nếu body không có
              if (!notifMessage) {
                try {
                  const payload =
                    typeof item.payload === "string"
                      ? JSON.parse(item.payload || "{}")
                      : item.payload || {};
                  notifMessage = payload.message || "";
                } catch {
                  // ignore parse error
                }
              }

              return (
                <List.Item
                  className={item.is_read ? "notif-item read" : "notif-item"}
                  onClick={() => handleNotificationClick(item)}
                >
                  <div className="notif-content">
                    <div className="notif-title">{notifTitle}</div>
                    <div className="notif-message">{notifMessage}</div>
                  </div>
                </List.Item>
              );
            }}
          />

          <div
            className="notif-footer-view-all"
            style={{
              padding: "8px 12px",
              borderTop: "1px solid #f0f0f0",
              textAlign: "center",
              cursor: "pointer",
              fontWeight: 500,
            }}
            onClick={handleGoToNotificationsPage}
          >
            Tất cả thông báo
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="appHeader-container">
      <div className="appHeader-logo">VolunteerHub</div>

      {/* <div className="appHeader-search-input">
        <Input.Search
          className="search-input"
          placeholder="Search for events or organizations"
          enterButton
        />
      </div> */}

      <div className="appHeader-noti-and-ava-wrapper">
        <div className="appHeader-notification-icon">
          <Dropdown trigger={["click"]} popupRender={() => notificationOverlay}>
            <Badge count={unreadCount} size="small">
              <Avatar size="large" icon={<BellOutlined />} />
            </Badge>
          </Dropdown>
        </div>

        <div className="appHeader-avatar-wrapper">
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                { key: "1", label: "Profile" },
                {
                  key: "2",
                  label: "Logout",
                  icon: <SlLogout />,
                  danger: true,
                },
              ],
              onClick: handleAvatarDropdownClicked,
            }}
          >
            <img src={user?.avatar_url || "images/avatar.png"} alt="avatar" />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
