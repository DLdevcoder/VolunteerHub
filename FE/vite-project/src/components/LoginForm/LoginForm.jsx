// src/components/LoginForm/LoginForm.jsx
import "./LoginForm.css";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";

import { loginThunk, clearMessages } from "../../redux/slices/authSlice.jsx";
import {
  authErrorSelector,
  authLoadingSelector,
} from "../../redux/selectors/authSelectors.js";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage.js";

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage(); // global message instance

  const error = useSelector(authErrorSelector);
  const loading = useSelector(authLoadingSelector);

  // Show error toast whenever auth.error changes
  useEffect(() => {
    if (error && messageApi) {
      messageApi.error({
        content: error,
        duration: 3,
      });
      dispatch(clearMessages());
    }
  }, [error, messageApi, dispatch]);

  const handleForgotPasswordOptionClicked = () => {
    navigate("/reset-password");
  };

  const handleRegisterOptionClicked = () => {
    navigate("/register");
  };

  const handleFinish = async (values) => {
    try {
      const resultAction = await dispatch(
        loginThunk({
          email: values.email,
          password: values.password,
        })
      );

      if (loginThunk.fulfilled.match(resultAction)) {
        // Show success before navigating away
        if (messageApi) {
          messageApi.success({
            content: "Login successful",
            duration: 2,
          });
        }
        navigate("/events");
      }
      // If rejected: auth.error will be set → useEffect will show messageApi.error
    } catch (err) {
      console.error(err);
      if (messageApi) {
        messageApi.error("Unexpected error");
      }
    }
  };

  return (
    <div className="loginFrom-container">
      <div className="loginForm-box">
        <div className="loginForm-box-left">
          <div className="image-wrapper">
            <img src="images/loginBackground.png" alt="Login" />
          </div>
        </div>
        <div className="loginForm-box-right">
          <h2>Login</h2>
          <Form layout="vertical" onFinish={handleFinish}>
            <Form.Item label="Email" name="email">
              <Input placeholder="Enter your email" />
            </Form.Item>
            <Form.Item label="Password" name="password">
              <Input.Password placeholder="Enter your password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                Submit
              </Button>
            </Form.Item>
          </Form>
          <div className="loginForm-options-wrapper">
            <div
              className="forgot-password-option"
              onClick={handleForgotPasswordOptionClicked}
            >
              Forgot Password?
            </div>
            <div className="register-option">
              Don't have an account?{" "}
              <span onClick={handleRegisterOptionClicked}>Register</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
