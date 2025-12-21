import "./ManagerCreateEvent.css";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  DatePicker,
  Row,
  Col,
  Typography,
} from "antd";
import {
  FormOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SendOutlined,
} from "@ant-design/icons";

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
const { Title } = Typography;

// ✅ moved outside render
const LabelWithIcon = ({ icon, text }) => (
  <span className="label-with-icon">
    {icon}
    <span>{text}</span>
  </span>
);

const ManagerCreateEvent = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const messageApi = useGlobalMessage();

  const categories = useSelector(eventCategoriesSelector) || [];
  const categoriesLoading = useSelector(eventCategoriesLoadingSelector);
  const createLoading = useSelector(eventCreateLoadingSelector);
  const createError = useSelector(eventCreateErrorSelector);

  useEffect(() => {
    dispatch(fetchEventCategories());
  }, [dispatch]);

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
      category_id: values.category_id,
      start_date: start?.format("YYYY-MM-DD HH:mm:ss"),
      end_date: end?.format("YYYY-MM-DD HH:mm:ss"),
    };

    try {
      await dispatch(createEventThunk(payload)).unwrap();
      messageApi.success("Tạo sự kiện thành công!");
      form.resetFields();
      dispatch(resetCreateEventState());
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="create-event-page">
      <div className="create-event-container">
        <div className="create-event-header">
          <Title level={3} style={{ margin: 0 }}>
            Tạo sự kiện mới
          </Title>
        </div>

        <Form
          layout="vertical"
          form={form}
          onFinish={handleSubmit}
          initialValues={{ target_participants: 20 }}
          className="create-event-form"
          requiredMark={false}
        >
          <Row gutter={24}>
            <Col xs={24} md={16}>
              <Form.Item
                label={
                  <LabelWithIcon icon={<FormOutlined />} text="Tên sự kiện" />
                }
                name="title"
                className="custom-form-item"
                rules={[{ required: true, message: "Hãy nhập tên sự kiện" }]}
              >
                <Input
                  size="large"
                  placeholder="VD: Chiến dịch Mùa Hè Xanh 2024..."
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                label={
                  <LabelWithIcon icon={<AppstoreOutlined />} text="Danh mục" />
                }
                name="category_id"
                className="custom-form-item"
                rules={[{ required: true, message: "Danh mục" }]}
              >
                <Select
                  size="large"
                  loading={categoriesLoading}
                  placeholder="Chọn loại danh mục"
                >
                  {categories.map((c) => (
                    <Select.Option key={c.category_id} value={c.category_id}>
                      {c.name}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={
              <LabelWithIcon
                icon={<FileTextOutlined />}
                text="Mô tả chi tiết"
              />
            }
            name="description"
            className="custom-form-item"
            rules={[{ required: true, message: "Hãy nhập mô tả nội dung" }]}
          >
            <TextArea
              rows={5}
              placeholder="Mô tả mục đích, nội dung công việc và yêu cầu đối với tình nguyện viên..."
              showCount
              maxLength={2000}
            />
          </Form.Item>

          <Row gutter={24}>
            <Col xs={24} md={14}>
              <Form.Item
                label={
                  <LabelWithIcon
                    icon={<CalendarOutlined />}
                    text="Thời gian diễn ra"
                  />
                }
                name="timeRange"
                className="custom-form-item"
                rules={[
                  {
                    required: true,
                    message: "Chọn thời gian bắt đầu & kết thúc",
                  },
                ]}
              >
                <RangePicker
                  size="large"
                  showTime
                  format="DD/MM/YYYY HH:mm"
                  style={{ width: "100%" }}
                />
              </Form.Item>
            </Col>

            <Col xs={24} md={10}>
              <Form.Item
                label={
                  <LabelWithIcon
                    icon={<TeamOutlined />}
                    text="Số lượng tình nguyện viên"
                  />
                }
                name="target_participants"
                className="custom-form-item"
                rules={[
                  { type: "number", min: 1, message: "Tối thiểu 1 người" },
                ]}
              >
                <InputNumber
                  size="large"
                  style={{ width: "100%" }}
                  placeholder="Số lượng"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            label={
              <LabelWithIcon
                icon={<EnvironmentOutlined />}
                text="Địa điểm tổ chức"
              />
            }
            name="location"
            className="custom-form-item"
            rules={[{ required: true, message: "Hãy nhập địa điểm" }]}
          >
            <Input
              size="large"
              placeholder="VD: Công viên Thống Nhất, Hai Bà Trưng, Hà Nội"
            />
          </Form.Item>

          <Form.Item className="btn-submit-wrapper">
            <Button
              type="primary"
              htmlType="submit"
              loading={createLoading}
              block
              className="btn-submit-event"
              icon={<SendOutlined />}
            >
              TẠO SỰ KIỆN
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
};

export default ManagerCreateEvent;
