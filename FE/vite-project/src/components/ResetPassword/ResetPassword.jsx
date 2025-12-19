import "./ResetPassword.css";
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { Button, Form, Input, Typography } from "antd";
import {
  LockOutlined,
  KeyOutlined,
  SafetyCertificateOutlined,
  ArrowLeftOutlined,
} from "@ant-design/icons";

import {
  changePasswordThunk,
  clearMessages,
} from "../../redux/slices/authSlice.jsx";
import {
  authErrorSelector,
  authLoadingSelector,
  authTokenSelector,
} from "../../redux/selectors/authSelectors.js";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage.js";

const { Title, Text } = Typography;

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const messageApi = useGlobalMessage();

  const error = useSelector(authErrorSelector);
  const loading = useSelector(authLoadingSelector);
  const token = useSelector(authTokenSelector);

  // Show error from changePassword / other auth actions
  useEffect(() => {
    if (error && messageApi) {
      messageApi.error({
        content: error,
        duration: 3,
      });
      dispatch(clearMessages());
    }
  }, [error, messageApi, dispatch]);

  // Guard: must be logged in
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleFinish = async (values) => {
    const payload = {
      current_password: values.currentPassword,
      new_password: values.newPassword,
      confirm_password: values.confirmNewPassword,
    };

    try {
      const resultAction = await dispatch(changePasswordThunk(payload));

      if (changePasswordThunk.fulfilled.match(resultAction)) {
        const msg =
          resultAction.payload?.message || "Đổi mật khẩu thành công!";
        if (messageApi) {
          messageApi.success({
            content: msg,
            duration: 3,
          });
        }
        navigate("/profile");
      }
    } catch (err) {
      console.error(err);
      if (messageApi) {
        messageApi.error("Đã xảy ra lỗi không mong muốn");
      }
    }
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        {/* === HEADER === */}
        <div className="reset-header">
          <div className="icon-wrapper">
            <SafetyCertificateOutlined style={{ fontSize: 32, color: "#3674B5" }} />
          </div>
          <Title level={3} style={{ color: "#333", marginBottom: 4 }}>
            Đổi mật khẩu
          </Title>
        </div>

        {/* === FORM BODY === */}
        <div className="reset-body">
          <Form
            layout="vertical"
            onFinish={handleFinish}
            size="large"
            requiredMark={false}
          >
            <Form.Item
              label="Mật khẩu hiện tại"
              name="currentPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu hiện tại" },
              ]}
            >
              <Input.Password
                prefix={<KeyOutlined className="input-icon" />}
                placeholder="Nhập mật khẩu cũ"
              />
            </Form.Item>

            <Form.Item
              label="Mật khẩu mới"
              name="newPassword"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu mới" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="Nhập mật khẩu mới"
              />
            </Form.Item>

            <Form.Item
              label="Xác nhận mật khẩu mới"
              name="confirmNewPassword"
              dependencies={["newPassword"]}
              rules={[
                { required: true, message: "Vui lòng xác nhận mật khẩu mới" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("newPassword") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error("Mật khẩu xác nhận không khớp")
                    );
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined className="input-icon" />}
                placeholder="Nhập lại mật khẩu mới"
              />
            </Form.Item>

            {/* === FOOTER BUTTONS === */}
            <div className="form-actions">
              <Button
                className="btn-cancel"
                onClick={() => navigate("/profile")}
                icon={<ArrowLeftOutlined />}
              >
                Hủy bỏ
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="btn-submit"
              >
                Xác nhận đổi
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;