import "./Profile.css";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Button,
  Input,
  Spin,
  Space,
  message,
  Tag,
  Row,
  Col,
} from "antd";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  CalendarOutlined,
  CameraOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
  ClockCircleOutlined,
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
  
  // Ref để xử lý click vào icon máy ảnh thì mở input file
  const fileInputRef = useRef(null);

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
    if (token) {
      dispatch(fetchMeThunk());
    }
  }, [dispatch, token]);

  // Route guards
  if (!token) return <Navigate to="/login" replace />;

  if (loadingMe && !me) {
    return (
      <div className="loading-container">
        <Spin size="large" />
      </div>
    );
  }

  if (!me && isAuthenticated === false) {
    return <Navigate to="/login" replace />;
  }

  if (!me && !loadingMe) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "red" }}>
        {errorMe || "Không thể tải thông tin người dùng"}
      </div>
    );
  }

  // from here, me exists
  const user = me;
  
  // Logic kiểm tra status (không phân biệt hoa thường) để tô màu
  const isUserActive = user.status?.toLowerCase() === "active";

  /* ========= Handlers (LOGIC GIỮ NGUYÊN) ========= */

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

  // Helper trigger input file
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  /* ========= JSX GIAO DIỆN MỚI ========= */
  return (
    <div className="profile-container">
      <div className="profile-card">
        
        {/* --- HEADER: Avatar & Name --- */}
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

              {/* Overlay hiển thị khi edit để bấm vào thay ảnh */}
              {isEditing && (
                <div className="avatar-overlay" onClick={triggerFileInput}>
                  <CameraOutlined style={{ color: "#fff", fontSize: 24 }} />
                </div>
              )}
            </div>
            
            {/* Input file bị ẩn đi để giao diện đẹp hơn */}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              style={{ display: "none" }}
              onChange={handleAvatarFileChange}
            />
          </div>

          <div className="identity-section">
            <h1 className="user-name">{user.full_name || "Chưa cập nhật tên"}</h1>
            
            <div className="tags-row">
              {/* Role Tag */}
              <Tag
                icon={<SafetyCertificateOutlined />}
                color="#3674B5"
                className="custom-tag"
              >
                {user.role_name || "USER"}
              </Tag>

              {/* Status Tag (Màu #A1E3F9) */}
              <Tag
                className="custom-tag"
                style={{
                  backgroundColor: isUserActive ? "#A1E3F9" : "#ffccc7",
                  color: isUserActive ? "#2b5a8f" : "#a8071a",
                  border: "none",
                  textTransform: "uppercase",
                }}
              >
                {user.status || "UNKNOWN"}
              </Tag>
            </div>
          </div>
        </div>

        {/* --- BODY: Form Fields --- */}
        <div className="profile-body">
          <Row gutter={[40, 24]}>
            {/* Cột Trái: Thông tin cá nhân */}
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
                <label>Email (Không thể thay đổi)</label>
                <Input
                  prefix={<MailOutlined className="input-icon" />}
                  value={user.email}
                  disabled
                  className="input-disabled-custom"
                  size="large"
                />
              </div>
            </Col>

            {/* Cột Phải: Thông tin hệ thống */}
            <Col xs={24} md={12}>
              <h3 className="section-title">Thông tin hệ thống</h3>
              
              <div className="form-group">
                <label>Ngày tham gia</label>
                <Input
                  prefix={<CalendarOutlined className="input-icon" />}
                  value={user.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "N/A"}
                  disabled
                  className="input-disabled-custom"
                  size="large"
                />
              </div>

              <div className="form-group">
                <label>Cập nhật lần cuối</label>
                <Input
                  prefix={<ClockCircleOutlined className="input-icon" />}
                  value={user.updated_at ? new Date(user.updated_at).toLocaleDateString("vi-VN") : "N/A"}
                  disabled
                  className="input-disabled-custom"
                  size="large"
                />
              </div>

              <div className="form-group" style={{ marginTop: 30 }}>
                <Button 
                  block 
                  icon={<LockOutlined />} 
                  onClick={() => navigate("/reset-password")}
                  size="large"
                  className="btn-change-pass"
                >
                  Đổi mật khẩu
                </Button>
              </div>
            </Col>
          </Row>
        </div>

        {/* --- FOOTER: Buttons --- */}
        <div className="profile-footer">
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
  );
};

export default Profile;