import "./ResetPassword.css";
import { Button, Form, Input } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

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
          resultAction.payload?.message || "Change password successfully";
        if (messageApi) {
          messageApi.success({
            content: msg,
            duration: 3,
          });
        }
        navigate("/profile");
      }
      // if rejected: error handled by useEffect above
    } catch (err) {
      console.error(err);
      if (messageApi) {
        messageApi.error("Unexpected error while changing password");
      }
    }
  };

  return (
    <div className="resetPassword-container">
      <div className="resetPassword-box">
        <h2>Reset your password</h2>
        <Form layout="vertical" onFinish={handleFinish}>
          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              { required: true, message: "Please enter your current password" },
            ]}
          >
            <Input.Password placeholder="Enter your current password" />
          </Form.Item>

          <Form.Item
            label="New Password"
            name="newPassword"
            rules={[
              { required: true, message: "Please enter your new password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter your new password" />
          </Form.Item>

          <Form.Item
            label="Confirm New Password"
            name="confirmNewPassword"
            dependencies={["newPassword"]}
            rules={[
              { required: true, message: "Please confirm your new password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("newPassword") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match")
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm your new password" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ResetPassword;
