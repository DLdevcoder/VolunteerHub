import "./AppHeader.css";
import { Input, Avatar, Badge, Dropdown } from "antd";
import { BellOutlined } from "@ant-design/icons";
import { SlLogout } from "react-icons/sl";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import authSlice from "../../redux/slices/authSlice";
import { meSelector } from "../../redux/selectors/userSelectors";

const AppHeader = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector(meSelector);
  console.log("in app header, user = ", user);

  const handleDropdownClicked = ({ key }) => {
    if (key == 1) {
      navigate("/profile");
    } else if (key == 2) {
      dispatch(authSlice.actions.logout());
      alert("Logged out successfully!");
      navigate("/login");
    }
  };

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
              onClick: handleDropdownClicked,
            }}
          >
            <img src={user.avatar_url} />
          </Dropdown>
        </div>
      </div>
    </div>
  );
};

export default AppHeader;
