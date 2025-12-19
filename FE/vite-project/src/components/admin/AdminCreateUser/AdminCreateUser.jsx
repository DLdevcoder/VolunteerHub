import "../../manager/ManagerCreateEvent/ManagerCreateEvent.css";
import { Form, Input, Select, Button, Typography, Row, Col, Space } from "antd";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { 
  UserOutlined, 
  PhoneOutlined, 
  MailOutlined, 
  LockOutlined, 
  SolutionOutlined, 
  UserAddOutlined 
} from "@ant-design/icons";

import useGlobalMessage from "../../../utils/hooks/useGlobalMessage";
import { adminCreateUserThunk } from "../../../redux/slices/userSlice";

const { Option } = Select;
const { Title } = Typography;

const AdminCreateUser = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values) => {
    const { full_name, phone, email, password, confirmPassword, role_name } = values;

    if (password !== confirmPassword) {
      messageApi.error("Mật khẩu xác nhận không khớp");
      return;
    }

    const payload = { full_name, phone, email, password, role_name };

    try {
      setSubmitting(true);
      await dispatch(adminCreateUserThunk(payload)).unwrap();
      messageApi.success("Tạo tài khoản mới thành công");
      navigate("/admin/users");
    } catch (err) {
      messageApi.error(err || "Không thể tạo tài khoản");
    } finally {
      setSubmitting(false);
    }
  };

  const LabelWithIcon = ({ icon, text }) => (
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {icon} {text}
    </span>
  );

  return (
    <div className="create-event-container" style={{ maxWidth: 700 }}>
      <div className="create-event-header">
        <Title level={3} style={{ margin: 0 }}>
          Tạo tài khoản mới
        </Title>
      </div>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleFinish}
        initialValues={{ role_name: "Volunteer" }}
        className="create-event-form"
        requiredMark={false}
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              label={<LabelWithIcon icon={<UserOutlined />} text="Họ tên" />}
              name="full_name"
              className="custom-form-item"
              rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
            >
              <Input size="large" placeholder="Nhập họ tên đầy đủ" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={<LabelWithIcon icon={<PhoneOutlined />} text="Số điện thoại" />}
              name="phone"
              className="custom-form-item"
              rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
            >
              <Input size="large" placeholder="Nhập số điện thoại" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={<LabelWithIcon icon={<MailOutlined />} text="Email" />}
          name="email"
          className="custom-form-item"
          rules={[
            { required: true, message: "Vui lòng nhập email" },
            { type: "email", message: "Email không hợp lệ" },
          ]}
        >
          <Input size="large" placeholder="example@gmail.com" />
        </Form.Item>

        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item
              label={<LabelWithIcon icon={<LockOutlined />} text="Mật khẩu" />}
              name="password"
              className="custom-form-item"
              rules={[
                { required: true, message: "Vui lòng nhập mật khẩu" },
                { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
              ]}
            >
              <Input.Password size="large" placeholder="Nhập mật khẩu" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label={<LabelWithIcon icon={<LockOutlined />} text="Xác nhận" />}
              name="confirmPassword"
              className="custom-form-item"
              rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu" }]}
            >
              <Input.Password size="large" placeholder="Nhập lại mật khẩu" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={<LabelWithIcon icon={<SolutionOutlined />} text="Vai trò hệ thống" />}
          name="role_name"
          className="custom-form-item"
          rules={[{ required: true, message: "Vui lòng chọn role" }]}
        >
          <Select size="large">
            <Option value="Volunteer">Volunteer (Tình nguyện viên)</Option>
            <Option value="Manager">Manager (Quản lý sự kiện)</Option>
            <Option value="Admin">Admin (Quản trị viên)</Option>
          </Select>
        </Form.Item>

        <Form.Item className="btn-submit-wrapper">
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button size="large" onClick={() => navigate("/admin/users")} style={{ borderRadius: 12 }}>
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              className="btn-submit-event"
              icon={<UserAddOutlined />}
              style={{ minWidth: 180 }}
            >
              TẠO TÀI KHOẢN
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default AdminCreateUser;