import "./RegisterForm.css";
import { useEffect } from "react";
import { Button, Form, Input, Select } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { registerThunk, clearMessages } from "../../redux/slices/authSlice";
import {
  authErrorSelector,
  authLoadingSelector,
} from "../../redux/selectors/authSelectors.js";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage.js";

const { Option } = Select;

const RegisterForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const error = useSelector(authErrorSelector);
  const loading = useSelector(authLoadingSelector);

  // Show error from auth slice
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
      role_name: values.role || "Volunteer", // 👈 from Select
    };

    try {
      const resultAction = await dispatch(registerThunk(payload));

      if (registerThunk.fulfilled.match(resultAction)) {
        if (messageApi) {
          messageApi.success({
            content: "Register successfully! Please log in.",
            duration: 2,
          });
        }
        navigate("/login");
      }
      // if rejected: error handled by useEffect above
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
          <Form.Item
            label="Full name"
            name="fullName"
            rules={[{ required: true, message: "Please enter your full name" }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>

          <Form.Item
            label="Phone number"
            name="phoneNumber"
            rules={[{ required: true, message: "Please enter your phone" }]}
          >
            <Input placeholder="Enter your phone number" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Please enter your email" },
              { type: "email", message: "Invalid email" },
            ]}
          >
            <Input placeholder="Enter your email" />
          </Form.Item>

          <Form.Item
            label="Password"
            name="password"
            rules={[
              { required: true, message: "Please enter your password" },
              { min: 6, message: "Password must be at least 6 characters" },
            ]}
          >
            <Input.Password placeholder="Enter your password" />
          </Form.Item>

          <Form.Item
            label="Confirm Password"
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Please confirm your password" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(
                    new Error("The two passwords do not match")
                  );
                },
              }),
            ]}
          >
            <Input.Password placeholder="Confirm your password" />
          </Form.Item>

          {/* NEW: Role select */}
          <Form.Item
            label="Role"
            name="role"
            initialValue="Volunteer"
            rules={[{ required: true, message: "Please choose a role" }]}
          >
            <Select>
              <Option value="Volunteer">Volunteer</Option>
              <Option value="Manager">Manager</Option>
            </Select>
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
