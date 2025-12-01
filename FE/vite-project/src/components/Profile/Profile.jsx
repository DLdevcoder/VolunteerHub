import "./Profile.css";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import { fetchMeThunk } from "../../redux/slices/authSlice";
import { FaUser } from "react-icons/fa";
import { Button, Input, Divider } from "antd";

const Profile = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, loading } = useSelector(
    (state) => state.auth
  );

  useEffect(() => {
    if (token && !user) {
      dispatch(fetchMeThunk());
    }
  }, [token, user, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (loading && !user) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (!user && isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  console.log("In Profile.jsx, user: ", user);

  return (
    <div className="profile-container">
      <div className="profile-box">
        <div className="upper">
          <div className="avatar-container">
            <div className="ava-wrapper">
              <FaUser className="ava-icon" />
            </div>
          </div>
          <div className="role-and-status">
            <div className="role">Role</div>
            <div className="status">Status</div>
          </div>
        </div>
        <Divider />
        <div className="lower">
          <div className="left">
            <div className="info-item">
              <div className="item-title">Full name</div>
              <Input defaultValue={`Nguyen Dinh Quoc Huy`} disabled />
            </div>
            <div className="info-item">
              <div className="item-title">Email</div>
              <Input defaultValue={`huyndq05@gmail.com`} disabled />
            </div>
            <div className="info-item">
              <div className="item-title">Phone number</div>
              <Input defaultValue={`0932847`} disabled />
            </div>
          </div>
          <div className="right">
            <div className="info-item">
              <div className="item-title">Created at</div>
              <Input defaultValue={`2025-11-24T08:59:36.000Z`} disabled />
            </div>
            <div className="info-item">
              <div className="item-title">Updated at</div>
              <Input defaultValue={`2025-11-24T08:59:36.000Z`} disabled />
            </div>
          </div>
        </div>
        <div className="button-area">
          <Button type="primary">Chỉnh sửa thông tin cá nhân</Button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
