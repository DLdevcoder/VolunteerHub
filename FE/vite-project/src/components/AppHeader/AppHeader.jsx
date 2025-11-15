import "./AppHeader.css";
import { Input, Button, Avatar, Badge, Dropdown } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { SlLogout } from "react-icons/sl";

const AppHeader = () => {
  return (
    <div className="appHeader-container">
      <div className="appHeader-logo">VolunteerHub</div>
      <div className="appHeader-search-input">
        <Input.Search
          className="search-input"
          placeholder="Search for events or organizations"
          enterButton
        />
        {/* <Button type="primary">Search</Button> */}
      </div>
      <div className="appHeader-noti-and-ava-wrapper">
        <div className="appHeader-notification-icon">
          <Badge count={5} size="large">
            <Avatar size="large" icon={<BellOutlined />} />
          </Badge>
        </div>
        <div className="appHeader-avatar-wrapper">
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                {
                  key: "1",
                  label: "Profile",
                },
                { key: "2", label: "Logout", icon: <SlLogout />, danger: true },
              ],
            }}
          >
            <img src="images/avatar.png" />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
