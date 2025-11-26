import "./RegisterForm.css";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import authApi from "../../../apis/authApi";

const RegisterForm = () => {
  const navigate = useNavigate();

  const handleLoginOptionClicked = () => {
    navigate("/login");
  };

  const handleRegister = async (values) => {
    // console.log("Register button clicked", values);
    const payload = {
      email: values.email,
      password: values.password,
      full_name: values.fullName,
      phone: values.phoneNumber,
      role_name: "Volunteer",
    };

    try {
      const res = await authApi.register(payload);

      if (res.success) {
        message.success("Register successfully! Please log in.");
        alert("Register successfully! Please log in.");
        navigate("/login");
      } else {
        message.error(res.message || "Register failed");
      }
    } catch (err) {
      console.error(err);
      const msg = err?.response?.data?.message || "Error while registering";
      message.error(msg);
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
            <Button type="primary" htmlType="submit" block>
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
