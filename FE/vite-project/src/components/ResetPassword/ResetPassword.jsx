import "./ResetPassword.css";
import { Button, Form, Input } from "antd";

const ResetPassword = () => {
  return (
    <div className="resetPassword-container">
      <div className="resetPassword-box">
        <h2>Reset your password</h2>
        <Form layout="vertical">
          <Form.Item label="Email" name="email">
            <Input placeholder="Enter your email" />
          </Form.Item>
          <Form.Item label="New Password" name="New Password">
            <Input.Password placeholder="Enter your new password" />
          </Form.Item>
          <Form.Item label="Confirm New Password" name="Confirm New Password">
            <Input.Password placeholder="Confirm your new password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Reset Password
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ResetPassword;
