import "./LoginForm.css";
import { Button, Form, Input } from "antd";

const LoginForm = () => {
  return (
    <div className="loginFrom-container">
      <div className="loginForm-box">
        <div className="loginForm-box-left">
          <div className="image-wrapper">
            <img src="../../../public/images/image.png" alt="Login" />
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
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
