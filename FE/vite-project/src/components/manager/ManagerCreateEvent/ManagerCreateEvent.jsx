import { useEffect, useState } from "react";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  message,
  Card,
  Space,
} from "antd";
import eventApi from "../../../../apis/eventApi";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ManagerCreateEvent = () => {
  const [form] = Form.useForm();
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const res = await eventApi.getCategories();
        // res: { success, data, message? }
        if (!res?.success) {
          message.error(res?.message || "Không tải được danh mục");
          return;
        }
        setCategories(res.data || []);
      } catch (err) {
        message.error(
          err?.response?.data?.message ||
            err?.message ||
            "Không tải được danh mục"
        );
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const handleSubmit = async (values) => {
    try {
      setSubmitting(true);

      const [start, end] = values.timeRange || [];

      const payload = {
        title: values.title,
        description: values.description,
        target_participants: values.target_participants || 0,
        location: values.location,
        category_id: values.category_id || null,
        start_date: start?.format("YYYY-MM-DD HH:mm:ss"),
        end_date: end?.format("YYYY-MM-DD HH:mm:ss"),
      };

      const res = await eventApi.createEvent(payload);
      // res: { success, message, data: { event } }
      if (!res?.success) {
        message.error(res?.message || "Tạo sự kiện thất bại");
        return;
      }

      message.success(res.message || "Tạo sự kiện thành công");
      form.resetFields();
    } catch (err) {
      message.error(
        err?.response?.data?.message || err?.message || "Tạo sự kiện thất bại"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Tạo sự kiện mới" bordered={false}>
      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          target_participants: 20,
        }}
      >
        <Form.Item
          label="Tên sự kiện"
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
        >
          <Input placeholder="Ví dụ: Dọn rác bờ hồ Hoàn Kiếm" />
        </Form.Item>

        <Form.Item
          label="Mô tả"
          name="description"
          rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
        >
          <TextArea rows={4} placeholder="Mô tả chi tiết nội dung sự kiện" />
        </Form.Item>

        <Form.Item label="Danh mục" name="category_id">
          <Select
            loading={loadingCategories}
            allowClear
            placeholder="Chọn danh mục (không bắt buộc)"
          >
            {categories.map((c) => (
              <Select.Option key={c.category_id} value={c.category_id}>
                {c.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Space size="large" style={{ width: "100%" }} wrap>
          <Form.Item
            label="Thời gian"
            name="timeRange"
            rules={[
              {
                required: true,
                message: "Vui lòng chọn thời gian bắt đầu/kết thúc",
              },
            ]}
          >
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: 320 }}
            />
          </Form.Item>

          <Form.Item
            label="Số lượng tình nguyện viên"
            name="target_participants"
            rules={[
              {
                type: "number",
                min: 1,
                max: 5000,
                message: "Số lượng phải từ 1 đến 5000",
              },
            ]}
          >
            <InputNumber />
          </Form.Item>
        </Space>

        <Form.Item
          label="Địa điểm"
          name="location"
          rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
        >
          <Input placeholder="Ví dụ: Bờ hồ Hoàn Kiếm, Hà Nội" />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={submitting}>
            Tạo sự kiện
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ManagerCreateEvent;
