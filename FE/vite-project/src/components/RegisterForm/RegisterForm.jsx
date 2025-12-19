import "./RegisterForm.css";
import { useEffect } from "react";
import { Button, Form, Input, Select, Typography, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  LockOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";

import { registerThunk, clearMessages } from "../../redux/slices/authSlice";
import {
  authErrorSelector,
  authLoadingSelector,
} from "../../redux/selectors/authSelectors.js";
import useGlobalMessage from "../../utils/hooks/useGlobalMessage.js";

const { Title, Text } = Typography;
const { Option } = Select;

const RegisterForm = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const error = useSelector(authErrorSelector);
  const loading = useSelector(authLoadingSelector);

  useEffect(() => {
    if (error && messageApi) {
      messageApi.error({ content: error, duration: 3 });
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
      role_name: values.role || "Volunteer",
    };

    try {
      const resultAction = await dispatch(registerThunk(payload));
      if (registerThunk.fulfilled.match(resultAction)) {
        if (messageApi) {
          messageApi.success({
            content: "Đăng ký thành công! Vui lòng đăng nhập.",
            duration: 2,
          });
        }
        navigate("/login");
      }
    } catch (err) {
      console.error(err);
      if (messageApi) messageApi.error("Lỗi không xác định khi đăng ký");
    }
  };

  return (
    <div className="register-page-scope">
      <div className="register-container">
        <div className="register-box">
          <div className="register-left">
            <div className="brand-content">
              <h1>Tham gia cùng chúng tôi</h1>
              <p>Trở thành một phần của cộng đồng tình nguyện viên ngay hôm nay.</p>
            </div>
          </div>

          <div className="register-right">
            <div className="register-header">
              <Title level={2} style={{ color: "#3674B5", marginBottom: 8 }}>
                Đăng ký
              </Title>
              <Text type="secondary">Tạo tài khoản mới</Text>
            </div>

            <Form
              layout="vertical"
              onFinish={handleRegister}
              size="large"
              requiredMark={false}
              className="register-form"
            >
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Họ và tên"
                    name="fullName"
                    rules={[{ required: true, message: "Nhập họ tên" }]}
                  >
                    <Input
                      prefix={<UserOutlined className="input-icon" />}
                      placeholder="Nhập tên của bạn"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phoneNumber"
                    rules={[{ required: true, message: "Nhập SĐT" }]}
                  >
                    <Input
                      prefix={<PhoneOutlined className="input-icon" />}
                      placeholder="Nhập SĐT của bạn"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: "Vui lòng nhập email" },
                  { type: "email", message: "Email không hợp lệ" },
                ]}
              >
                <Input
                  prefix={<MailOutlined className="input-icon" />}
                  placeholder="Nhâp email của bạn"
                />
              </Form.Item>

              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Mật khẩu"
                    name="password"
                    rules={[
                      { required: true, message: "Nhập mật khẩu" },
                      { min: 6, message: "Tối thiểu 6 ký tự" },
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="input-icon" />}
                      placeholder="Mật khẩu"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item
                    label="Xác nhận mật khẩu"
                    name="confirmPassword"
                    dependencies={["password"]}
                    rules={[
                      { required: true, message: "Nhập lại mật khẩu" },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Mật khẩu không khớp")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      prefix={<LockOutlined className="input-icon" />}
                      placeholder="Xác nhận"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Vai trò"
                name="role"
                initialValue="Volunteer"
                rules={[{ required: true, message: "Vui lòng chọn vai trò" }]}
              >
                <Select
                  suffixIcon={
                    <SafetyCertificateOutlined className="input-icon" />
                  }
                >
                  <Option value="Volunteer">
                    Tình nguyện viên (Volunteer)
                  </Option>
                  <Option value="Manager">
                    Quản lý sự kiện (Manager)
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  loading={loading}
                  className="register-btn"
                >
                  Đăng ký tài khoản
                </Button>
              </Form.Item>
            </Form>

            <div className="form-footer">
              Đã có tài khoản?
              <span
                onClick={handleLoginOptionClicked}
                className="login-link"
              >
                Đăng nhập ngay
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;
