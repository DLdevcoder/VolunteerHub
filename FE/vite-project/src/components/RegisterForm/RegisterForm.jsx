// src/components/RegisterForm/RegisterForm.jsx
import "./RegisterForm.css";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import { registerThunk, clearMessages } from "../../redux/slices/authSlice";
import {
  authErrorSelector,
  authLoadingSelector,
} from "../../redux/selectors/authSelectors.js";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage.js";

const RegisterForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const error = useSelector(authErrorSelector);
  const loading = useSelector(authLoadingSelector);

  useEffect(() => {
    if (error && messageApi) {
      messageApi.error({
        content: error,
        duration: 3,
      });
      dispatch(clearMessages());
    }
  }, [error, messageApi, dispatch]);

  const handleLoginOptionClicked = () => {
    navigate("/login");
  };

  const handleRegister = async (values) => {
    const payload = {
      email: values.email,
      password: values.password,
      full_name: values.fullName,
      phone: values.phoneNumber,
      role_name: "Volunteer",
    };

    try {
      const resultAction = await dispatch(registerThunk(payload));

      if (registerThunk.fulfilled.match(resultAction)) {
        // success toast here
        if (messageApi) {
          messageApi.success({
            content: "Register successfully! Please log in.",
            duration: 2,
          });
        }
        navigate("/login");
      }
      // if rejected, auth.error → effect shows error toast
    } catch (err) {
      console.error(err);
      if (messageApi) {
        messageApi.error("Unexpected error while registering");
      }
    }
  };

  return (
    <div className="registerForm-container">
      <div className="registerForm-box">
        <h2>Register</h2>
        <Form layout="vertical" onFinish={handleRegister}>
          <Form.Item label="Full name" name="fullName">
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item label="Phone number" name="phoneNumber">
            <Input placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item label="Email" name="email">
            <Input placeholder="Enter your email" />
          </Form.Item>
          <Form.Item label="Password" name="password">
            <Input.Password placeholder="Enter your password" />
          </Form.Item>
          <Form.Item label="Confirm Password" name="confirmPassword">
            <Input.Password placeholder="Confirm your password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Register
            </Button>
          </Form.Item>
        </Form>
        <div className="registerForm-options">
          <div className="login-option">
            Already have an account?{" "}
            <span onClick={handleLoginOptionClicked}>Login</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
