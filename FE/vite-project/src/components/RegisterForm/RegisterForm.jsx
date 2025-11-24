import "./RegisterForm.css";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";

const RegisterForm = () => {
  const navigate = useNavigate();

  const handleLoginOptionClicked = () => {
    navigate("/login");
  };

  return (
    <div className="registerForm-container">
      <div className="registerForm-box">
        <h2>Register</h2>
        <Form layout="vertical">
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
