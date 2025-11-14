import "./RegisterForm.css";
import { Button, Form, Input } from "antd";

const RegisterForm = () => {
  return (
    <div className="registerForm-container">
      <div className="registerForm-box">
        <h2>Register</h2>
        <Form layout="vertical">
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
      </div>
    </div>
  );
};

export default RegisterForm;
