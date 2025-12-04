import { useEffect } from "react";
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
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEventCategories,
  createEventThunk,
} from "../../../redux/slices/eventSlice";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ManagerCreateEvent = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();

  const {
    categories,
    categoriesLoading,
    categoriesError,
    createLoading,
    createError,
  } = useSelector((state) => state.events);

  // Load categories
  useEffect(() => {
    dispatch(fetchEventCategories());
  }, [dispatch]);

  // Show error messages from slice (optional but nice)
  useEffect(() => {
    if (categoriesError) {
      message.error(categoriesError);
    }
  }, [categoriesError]);

  useEffect(() => {
    if (createError) {
      message.error(createError);
    }
  }, [createError]);

  const handleSubmit = async (values) => {
    try {
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

      // dispatch + unwrap to use try/catch
      const createdEvent = await dispatch(createEventThunk(payload)).unwrap();

      message.success("Tạo sự kiện thành công");
      // Nếu muốn dùng dữ liệu event:
      // console.log("Created event:", createdEvent);

      form.resetFields();
    } catch (errMsg) {
      // errMsg là payload từ rejectWithValue
      message.error(errMsg || "Tạo sự kiện thất bại");
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
            loading={categoriesLoading}
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
          <Button type="primary" htmlType="submit" loading={createLoading}>
            Tạo sự kiện
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ManagerCreateEvent;
