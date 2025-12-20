import "./Profile.css";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Input, Spin, Space, message, Tag, Row, Col } from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CameraOutlined,
  LockOutlined,
  ClockCircleOutlined,
  CrownOutlined,
  SolutionOutlined,
  TeamOutlined,
} from "@ant-design/icons";

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

  const fileInputRef = useRef(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formValues, setFormValues] = useState({
    full_name: "",
    phone: "",
  });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [, setAvatarFile] = useState(null);

  const token = useSelector(authTokenSelector);
  const isAuthenticated = useSelector(authIsAuthenticatedSelector);

  const me = useSelector(meSelector);
  const loadingMe = useSelector(loadingMeSelector);
  const errorMe = useSelector(errorMeSelector);
  const updatingMe = useSelector(updatingMeSelector);

  useEffect(() => {
    if (token) dispatch(fetchMeThunk());
  }, [dispatch, token]);

  if (!token) return <Navigate to="/login" replace />;

  if (loadingMe && !me) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!me && isAuthenticated === false) return <Navigate to="/login" replace />;

  if (!me && !loadingMe) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red" }}>
        {errorMe || "Không thể tải thông tin người dùng"}
      </div>
    );
  }

  const user = me;

  const isUserActive = String(user.status || "").toLowerCase() === "active";
  const role = user.role_name || "USER";

  const renderRoleTag = (roleName) => {
    const map = {
      Admin: {
        cls: "role-pill role-admin",
        icon: <CrownOutlined />,
        label: "Admin",
      },
      Manager: {
        cls: "role-pill role-manager",
        icon: <SolutionOutlined />,
        label: "Manager",
      },
      Volunteer: {
        cls: "role-pill role-volunteer",
        icon: <TeamOutlined />,
        label: "Volunteer",
      },
    };

    const cfg = map[roleName] || {
      cls: "role-pill",
      icon: <TeamOutlined />,
      label: roleName,
    };

    return (
      <Tag className={cfg.cls}>
        <span className="role-pill__inner">
          <span className="role-pill__icon">{cfg.icon}</span>
          <span className="role-pill__text">{cfg.label}</span>
        </span>
      </Tag>
    );
  };

  const renderStatusTag = () => {
    const label = isUserActive ? "ACTIVE" : "BLOCKED";
    return (
      <Tag
        className={`status-pill ${isUserActive ? "status-active" : "status-blocked"}`}
      >
        {label}
      </Tag>
    );
  };

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

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        {/* HEADER */}
        <div className="profile-header">
          <div className="avatar-section">
            <div className={`avatar-wrapper ${isEditing ? "editable" : ""}`}>
              {avatarPreview || user.avatar_url ? (
                <img
                  src={avatarPreview || user.avatar_url}
                  alt="avatar"
                  className="avatar-img"
                />
              ) : (
                <div className="avatar-placeholder">
                  <UserOutlined style={{ fontSize: 40 }} />
                </div>
              )}

              {isEditing && (
                <div className="avatar-overlay" onClick={triggerFileInput}>
                  <CameraOutlined style={{ color: "#fff", fontSize: 24 }} />
                </div>
              )}
            </div>

            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="identity-section">
            <h1 className="user-name">
              {user.full_name || "Chưa cập nhật tên"}
            </h1>

            <div className="tags-row">
              {renderRoleTag(role)}
              {renderStatusTag()}
            </div>
          </div>
        </div>

        {/* BODY */}
        <div className="profile-body">
          <Row gutter={[40, 24]}>
            <Col xs={24} md={12}>
              <h3 className="section-title">Thông tin cá nhân</h3>

              <div className="form-group">
                <label>Họ và tên</label>
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  value={isEditing ? formValues.full_name : user.full_name}
                  onChange={handleChangeFullName}
                  disabled={!isEditing}
                  size="large"
                  placeholder="Nhập họ tên"
                />
              </div>

              <div className="form-group">
                <label>Số điện thoại</label>
                <Input
                  prefix={<PhoneOutlined className="input-icon" />}
                  value={isEditing ? formValues.phone : user.phone}
                  onChange={handleChangePhone}
                  disabled={!isEditing}
                  size="large"
                  placeholder="Nhập số điện thoại"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <Input
                  prefix={<MailOutlined className="input-icon" />}
                  value={user.email}
                  disabled
                  className="input-disabled-custom"
                  size="large"
                />
              </div>
            </Col>

            <Col xs={24} md={12}>
              <h3 className="section-title">Thông tin hệ thống</h3>

              <div className="form-group">
                <label>Ngày tham gia</label>
                <Input
                  prefix={<CalendarOutlined className="input-icon" />}
                  value={
                    user.created_at
                      ? new Date(user.created_at).toLocaleDateString("vi-VN")
                      : "N/A"
                  }
                  disabled
                  className="input-disabled-custom"
                  size="large"
                />
              </div>

              <div className="form-group">
                <label>Cập nhật lần cuối</label>
                <Input
                  prefix={<ClockCircleOutlined className="input-icon" />}
                  value={
                    user.updated_at
                      ? new Date(user.updated_at).toLocaleDateString("vi-VN")
                      : "N/A"
                  }
                  disabled
                  className="input-disabled-custom"
                  size="large"
                />
              </div>
            </Col>
          </Row>
        </div>
        <div className="profile-footer">
          <div style={{ display: 'flex', gap: '16px', width: '100%', alignItems: 'center' }}>
            <Button
              icon={<LockOutlined />}
              onClick={() => navigate("/reset-password")}
              size="large"
              className="btn-change-pass"
              style={{
                height: '40px',
                padding: '0 24px',
                marginLeft: 'auto'
              }}
            >
              Đổi mật khẩu
            </Button>

            {/* Các nút chỉnh sửa bên phải */}
            <div>
              {!isEditing ? (
                <Button
                  type="primary"
                  onClick={handleEditButtonClick}
                  size="large"
                  className="btn-primary-custom"
                >
                  Chỉnh sửa hồ sơ
                </Button>
              ) : (
                <Space size="middle">
                  <Button
                    onClick={handleCancelButtonClick}
                    disabled={updatingMe}
                    size="large"
                    className="btn-cancel"
                  >
                    Hủy bỏ
                  </Button>
                  <Button
                    type="primary"
                    onClick={handleAcceptButtonClick}
                    loading={updatingMe}
                    size="large"
                    className="btn-save"
                  >
                    Lưu thay đổi
                  </Button>
                </Space>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
