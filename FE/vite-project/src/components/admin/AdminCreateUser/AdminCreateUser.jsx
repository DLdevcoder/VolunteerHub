// src/pages/admin/AdminCreateUser.jsx
import "./AdminCreateUser.css";
import { Card, Form, Input, Select, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useDispatch } from "react-redux";

import useGlobalMessage from "../../../utils/hooks/useGlobalMessage";
import { adminCreateUserThunk } from "../../../redux/slices/userSlice";

const { Option } = Select;

const AdminCreateUser = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();
  const [submitting, setSubmitting] = useState(false);

  const handleFinish = async (values) => {
    const { full_name, phone, email, password, confirmPassword, role_name } =
      values;

    if (password !== confirmPassword) {
      messageApi.error("Mật khẩu xác nhận không khớp");
      return;
    }

    const payload = {
      full_name,
      phone,
      email,
      password,
      role_name, // "Volunteer" | "Manager" | "Admin"
    };

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

  const handleCancel = () => {
    navigate("/admin/users");
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: 600,
        margin: "24px auto",
      }}
    >
      <Card title="Tạo tài khoản mới">
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          initialValues={{ role_name: "Volunteer" }}
        >
          <Form.Item
            label="Họ tên"
            name="full_name"
            rules={[{ required: true, message: "Vui lòng nhập họ tên" }]}
          >
            <Input placeholder="Nhập họ tên" />
          </Form.Item>

          <Form.Item
            label="Số điện thoại"
            name="phone"
            rules={[{ required: true, message: "Vui lòng nhập số điện thoại" }]}
          >
            <Input placeholder="Nhập số điện thoại" />
          </Form.Item>

          <Form.Item
            label="Email"
            name="email"
            rules={[
              { required: true, message: "Vui lòng nhập email" },
              { type: "email", message: "Email không hợp lệ" },
            ]}
          >
            <Input placeholder="Nhập email" />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            name="password"
            rules={[
              { required: true, message: "Vui lòng nhập mật khẩu" },
              { min: 6, message: "Mật khẩu phải có ít nhất 6 ký tự" },
            ]}
          >
            <Input.Password placeholder="Nhập mật khẩu" />
          </Form.Item>

          <Form.Item
            label="Xác nhận mật khẩu"
            name="confirmPassword"
            rules={[{ required: true, message: "Vui lòng xác nhận mật khẩu" }]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu" />
          </Form.Item>

          <Form.Item
            label="Role"
            name="role_name"
            rules={[{ required: true, message: "Vui lòng chọn role" }]}
          >
            <Select>
              <Option value="Volunteer">Volunteer</Option>
              <Option value="Manager">Manager</Option>
              <Option value="Admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 8,
              }}
            >
              <Button onClick={handleCancel}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Tạo tài khoản
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default AdminCreateUser;
