import "./Profile.css";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { FaUser } from "react-icons/fa";
import { Button, Input, Divider, Spin, Space, message, Tag } from "antd";

import { fetchMeThunk, updateMeThunk } from "../../redux/slices/userSlice";
import {
  authTokenSelector,
  authIsAuthenticatedSelector,
} from "../../redux/selectors/authSelectors.js";
import {
  meSelector,
  loadingMeSelector,
  errorMeSelector,
  updatingMeSelector,
} from "../../redux/selectors/userSelectors.js";

const Profile = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // local editable state
  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    full_name: "",
    phone: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [, setAvatarFile] = useState(null);

  // auth slice via selectors
  const token = useSelector(authTokenSelector);
  const isAuthenticated = useSelector(authIsAuthenticatedSelector);

  // user slice via selectors
  const me = useSelector(meSelector);
  const loadingMe = useSelector(loadingMeSelector);
  const errorMe = useSelector(errorMeSelector);
  const updatingMe = useSelector(updatingMeSelector);

  // Fetch /users/me if needed
  useEffect(() => {
    if (token && !me) {
      dispatch(fetchMeThunk());
    }
  }, [token, me, dispatch]);

  // Route guards
  if (!token) return <Navigate to="/login" replace />;

  if (loadingMe && !me) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (!me && isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  if (!me && !loadingMe) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        {errorMe || "Không thể tải thông tin người dùng"}
      </div>
    );
  }

  // from here, me exists
  const user = me;
  console.log("in profile.jsx, user = ", user.avatar_url);

  /* ========= Handlers ========= */

  const handleEditButtonClick = () => {
    setFormValues({
      full_name: user.full_name || "",
      phone: user.phone || "",
    });
    setAvatarPreview(user.avatar_url || null);
    setAvatarFile(null);
    setIsEditing(true);
  };

  const handleCancelButtonClick = () => {
    setFormValues({
      full_name: user.full_name || "",
      phone: user.phone || "",
    });
    setAvatarPreview(user.avatar_url || null);
    setAvatarFile(null);
    setIsEditing(false);
  };

  const handleAcceptButtonClick = () => {
    const payload = {
      full_name: formValues.full_name,
      phone: formValues.phone,
      avatar_url: avatarPreview || user.avatar_url || null,
    };

    dispatch(updateMeThunk(payload))
      .unwrap()
      .then(() => {
        message.success("Cập nhật thông tin thành công");
        setIsEditing(false);
      })
      .catch((err) => {
        message.error(err || "Cập nhật thông tin thất bại");
      });
  };

  const handleChangeFullName = (e) => {
    const value = e.target.value;
    setFormValues((prev) => ({ ...prev, full_name: value }));
  };

  const handleChangePhone = (e) => {
    const value = e.target.value;
    setFormValues((prev) => ({ ...prev, phone: value }));
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatarFile(file);

    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
  };

  return (
    <div className="profile-container">
      <div className="profile-box">
        {/* Upper: avatar + role + status */}
        <div className="upper">
          <div className="avatar-container">
            <div className="ava-wrapper">
              {avatarPreview || user.avatar_url ? (
                <img
                  src={avatarPreview || user.avatar_url}
                  alt="avatar"
                  className="ava-image"
                />
              ) : (
                <FaUser className="ava-icon" />
              )}
            </div>
          </div>
          <div className="role-and-status">
            <div className="role">{user.role_name}</div>
            <Tag color="green" className="status-tag">
              {user.status}
            </Tag>
          </div>
        </div>

        {isEditing && (
          <div className="change-avatar">
            <span className="title">Avatar</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarFileChange}
            />
          </div>
        )}

        <Divider className="profile-divider" />

        {/* Lower: info grid */}
        <div className="lower">
          <div className="left">
            <div className="info-item">
              <div className="item-title">Full name</div>
              <Input
                value={isEditing ? formValues.full_name : user.full_name}
                onChange={handleChangeFullName}
                disabled={!isEditing}
              />
            </div>
            <div className="info-item">
              <div className="item-title">Email</div>
              <Input value={user.email} disabled />
            </div>
            <div className="info-item">
              <div className="item-title">Phone number</div>
              <Input
                value={isEditing ? formValues.phone : user.phone}
                onChange={handleChangePhone}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="right">
            <div className="info-item">
              <div className="item-title">Created at</div>
              <Input value={user.created_at} disabled />
            </div>
            <div className="info-item">
              <div className="item-title">Updated at</div>
              <Input value={user.updated_at} disabled />
            </div>
            <div className="info-item">
              <div className="item-title">Change password</div>
              <Button onClick={() => navigate("/reset-password")}>
                Change password
              </Button>
            </div>
          </div>
        </div>

        {/* Button area */}
        <div className="button-area">
          {!isEditing ? (
            <Button type="primary" onClick={handleEditButtonClick}>
              Chỉnh sửa thông tin cá nhân
            </Button>
          ) : (
            <Space>
              <Button
                danger
                onClick={handleCancelButtonClick}
                disabled={updatingMe}
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                onClick={handleAcceptButtonClick}
                loading={updatingMe}
              >
                Ghi nhận
              </Button>
            </Space>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
