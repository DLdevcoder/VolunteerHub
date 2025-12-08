// src/components/manager/ManagerCreateEvent/ManagerCreateEvent.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Card,
  Space,
} from "antd";
import {
  fetchEventCategories,
  createEventThunk,
  resetCreateEventState,
} from "../../../redux/slices/eventSlice";
import {
  eventCategoriesSelector,
  eventCategoriesLoadingSelector,
  eventCreateLoadingSelector,
  eventCreateErrorSelector,
} from "../../../redux/selectors/eventSelectors";
import useGlobalMessage from "../../../utils/hooks/useGlobalMessage";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ManagerCreateEvent = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const categories = useSelector(eventCategoriesSelector);
  const categoriesLoading = useSelector(eventCategoriesLoadingSelector);
  const createLoading = useSelector(eventCreateLoadingSelector);
  const createError = useSelector(eventCreateErrorSelector);

  useEffect(() => {
    dispatch(fetchEventCategories());
  }, [dispatch]);

  // Show BE error via global message
  useEffect(() => {
    if (createError) {
      messageApi.error(createError);
      dispatch(resetCreateEventState());
    }
  }, [createError, dispatch, messageApi]);

  const handleSubmit = async (values) => {
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

    try {
      await dispatch(createEventThunk(payload)).unwrap();
      messageApi.success("Tạo sự kiện thành công");
      form.resetFields();
      dispatch(resetCreateEventState());
    } catch (err) {
      // messageApi.error(err || "Tạo sự kiện thất bại");
      console.log("in manager create event submit:", err);
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
