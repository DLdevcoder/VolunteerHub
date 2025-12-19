import "./LoginForm.css";
import { Button, Form, Input, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

import { loginThunk, clearMessages } from "../../redux/slices/authSlice.jsx";
import {
  authErrorSelector,
  authLoadingSelector,
} from "../../redux/selectors/authSelectors.js";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage.js";

const { Title } = Typography;

const LoginForm = () => {
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

  const handleFinish = async (values) => {
    try {
      const resultAction = await dispatch(
        loginThunk({
          email: values.email,
          password: values.password,
        })
      );

      if (loginThunk.fulfilled.match(resultAction)) {
        if (messageApi) {
          messageApi.success({
            content: "Đăng nhập thành công!",
            duration: 2,
          });
        }
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      if (messageApi) {
        messageApi.error("Lỗi không xác định");
      }
    }
  };

  return (
    <div className="login-page-scope">
      <div className="login-container">
        <div className="login-box">
          <div className="login-left">
            <div className="login-bg-overlay">
              <div className="brand-welcome">
                <h1>Volunteer Hub</h1>
                <p>Kết nối trái tim, lan tỏa yêu thương.</p>
              </div>
              <img
                src="images/loginBackground.png"
                alt="Login"
                className="login-img"
              />
            </div>
          </div>

          <div className="login-right">
            <div className="login-header">
              <Title level={2} style={{ color: "#3674B5", marginBottom: 8 }}>
                Đăng nhập
              </Title>
            </div>

            <Form
              layout="vertical"
              onFinish={handleFinish}
              size="large"
              requiredMark={false}
              className="login-form"
            >
              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  prefix={<UserOutlined className="input-icon" />}
                  placeholder="Nhập email"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: "Vui lòng nhập mật khẩu" }]}
              >
                <Input.Password
                  prefix={<LockOutlined className="input-icon" />}
                  placeholder="Nhập mật khẩu"
                />
              </Form.Item>

              <div className="forgot-pass-link">
                <span onClick={() => navigate("/reset-password")}>
                  Quên mật khẩu?
                </span>
              </div>

              <Form.Item style={{ marginTop: 24 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="login-btn"
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>

            <div className="register-footer">
              Chưa có tài khoản?
              <span
                onClick={() => navigate("/register")}
                className="register-link"
              >
                Đăng ký ngay
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
