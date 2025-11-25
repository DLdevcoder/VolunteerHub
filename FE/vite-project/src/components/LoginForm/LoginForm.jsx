import "./LoginForm.css";
import { Button, Form, Input, message } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginThunk } from "../../redux/slices/authSlice.jsx";

const LoginForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleForgotPasswordOptionClicked = () => {
    navigate("/reset-password");
  };

  const handleRegisterOptionClicked = () => {
    navigate("/register");
  };

  const handleFinish = async (values) => {
    // values = { email: '...', password: '...' }
    try {
      const resultAction = await dispatch(
        loginThunk({
          email: values.email,
          password: values.password,
        })
      );

      if (loginThunk.fulfilled.match(resultAction)) {
        message.success("Login successful");
        // chuyển sang trang events (hoặc dashboard)
        navigate("/events");
      } else {
        message.error(resultAction.payload || "Login failed");
      }
    } catch (err) {
      console.error(err);
      message.error("Unexpected error");
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
