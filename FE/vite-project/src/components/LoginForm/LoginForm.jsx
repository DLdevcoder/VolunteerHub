import "./LoginForm.css";
import { Button, Form, Input } from "antd";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const navigate = useNavigate();

  const handleForgotPasswordOptionClicked = () => {
    navigate("/reset-password");
  };

  const handleRegisterOptionClicked = () => {
    navigate("/register");
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
          <Form layout="vertical">
            <Form.Item label="Email" name="email">
              <Input placeholder="Enter your email" />
            </Form.Item>
            <Form.Item label="Password" name="password">
              <Input.Password placeholder="Enter your password" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" block>
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
