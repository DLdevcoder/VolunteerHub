import "../ManagerCreateEvent/ManagerCreateEvent.css"; 
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Space,
  Popconfirm,
  Spin,
  Alert,
  Row,
  Col,
  Typography
} from "antd";
import { 
  FormOutlined,
  AppstoreOutlined,
  FileTextOutlined,
  CalendarOutlined,
  TeamOutlined,
  EnvironmentOutlined,
  SendOutlined,
  DeleteOutlined
} from "@ant-design/icons";
import dayjs from "dayjs";

import {
  fetchEventDetailThunk,
  fetchEventCategories,
  updateEventThunk,
  deleteEventThunk,
  fetchManagerEvents,
} from "../../../redux/slices/eventSlice";

import {
  eventDetailSelector,
  eventDetailLoadingSelector,
  eventCategoriesSelector,
  eventCategoriesLoadingSelector,
  eventUpdateLoadingSelector,
  eventDeleteLoadingSelector,
} from "../../../redux/selectors/eventSelectors";

import useGlobalMessage from "../../../utils/hooks/useGlobalMessage";

const { RangePicker } = DatePicker;
const { TextArea } = Input;
const { Title } = Typography;

const ManagerEditEvent = () => {
  const { event_id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const messageApi = useGlobalMessage();

  const event = useSelector(eventDetailSelector);
  const detailLoading = useSelector(eventDetailLoadingSelector);
  const categories = useSelector(eventCategoriesSelector);
  const categoriesLoading = useSelector(eventCategoriesLoadingSelector);
  const updating = useSelector(eventUpdateLoadingSelector);
  const deleting = useSelector(eventDeleteLoadingSelector);

  useEffect(() => {
    if (!event_id) return;
    dispatch(fetchEventDetailThunk(event_id));
    dispatch(fetchEventCategories());
  }, [dispatch, event_id]);

  useEffect(() => {
    if (!event) return;

    const {
      title,
      description,
      target_participants,
      start_date,
      end_date,
      location,
      category_id,
    } = event;

    form.setFieldsValue({
      title,
      description,
      target_participants,
      location,
      category_id,
      dateRange:
        start_date && end_date
          ? [dayjs(start_date), dayjs(end_date)]
          : undefined,
    });
  }, [event, form]);

  const restrictedMode = useMemo(() => {
    if (!event) return false;
    const now = dayjs();
    const start = event.start_date ? dayjs(event.start_date) : null;
    const isRunning = start ? start.isSame(now) || start.isBefore(now) : false;
    const hasParticipants = Number(event.current_participants || 0) > 0;
    return isRunning || hasParticipants;
  }, [event]);

  const restrictedReason = useMemo(() => {
    if (!event) return "";
    const now = dayjs();
    const start = event.start_date ? dayjs(event.start_date) : null;
    const isRunning = start ? start.isSame(now) || start.isBefore(now) : false;
    const hasParticipants = Number(event.current_participants || 0) > 0;
    if (isRunning) return "sự kiện đang diễn ra/đã bắt đầu";
    if (hasParticipants) return "đã có người đăng ký";
    return "";
  }, [event]);

  const handleSubmit = async (values) => {
    if (!event_id) return;
    let payload;
    if (restrictedMode) {
      payload = {
        description: values.description?.trim() || "",
        location: values.location?.trim(),
      };
    } else {
      const [start, end] = values.dateRange || [];
      payload = {
        title: values.title?.trim(),
        description: values.description?.trim() || "",
        target_participants: values.target_participants,
        location: values.location?.trim(),
        category_id: values.category_id,
        start_date: start ? start.toISOString() : null,
        end_date: end ? end.toISOString() : null,
      };
    }

    try {
      await dispatch(
        updateEventThunk({
          eventId: event_id,
          payload,
        })
      ).unwrap();
      await dispatch(fetchManagerEvents({ page: 1, limit: 10 }));
      messageApi.success("Cập nhật sự kiện thành công");
      navigate("/manager/events");
    } catch (err) {
      messageApi.error(err?.message || "Không thể cập nhật sự kiện");
    }
  };

  const handleDelete = async () => {
    if (!event_id) return;
    try {
      await dispatch(deleteEventThunk(event_id)).unwrap();
      await dispatch(fetchManagerEvents({ page: 1, limit: 10 }));
      messageApi.success("Đã xóa sự kiện thành công");
      navigate("/manager/events");
    } catch (err) {
      messageApi.error(err?.message || "Không thể xóa sự kiện");
    }
  };

  const LabelWithIcon = ({ icon, text }) => (
    <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {icon} {text}
    </span>
  );

  if (detailLoading && !event) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="create-event-container">
        <Title level={3}>Không tìm thấy sự kiện.</Title>
      </div>
    );
  }

  return (
    <div className="create-event-container">
      <div className="create-event-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={3} style={{ margin: 0 }}>
          Chỉnh sửa sự kiện
        </Title>
        <Popconfirm
          title="Xóa sự kiện?"
          description="Sự kiện sẽ bị xóa và TNV sẽ nhận được thông báo."
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={handleDelete}
        >
          <Button danger icon={<DeleteOutlined />} loading={deleting}>
            Xóa sự kiện
          </Button>
        </Popconfirm>
      </div>

      {restrictedMode && (
        <Alert
          style={{ marginBottom: 24, borderRadius: 12 }}
          type="warning"
          showIcon
          message="Chế độ giới hạn chỉnh sửa"
          description={`Vì ${restrictedReason}, bạn chỉ được sửa Mô tả và Địa điểm.`}
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        className="create-event-form"
        requiredMark={false}
      >
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Form.Item
              name="title"
              label={<LabelWithIcon icon={<FormOutlined />} text="Tên sự kiện" />}
              className="custom-form-item"
              rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
            >
              <Input size="large" disabled={restrictedMode} />
            </Form.Item>
          </Col>
          <Col xs={24} md={8}>
            <Form.Item
              name="category_id"
              label={<LabelWithIcon icon={<AppstoreOutlined />} text="Danh mục" />}
              className="custom-form-item"
              rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
            >
              <Select
                size="large"
                disabled={restrictedMode}
                loading={categoriesLoading}
                placeholder="Chọn danh mục"
              >
                {(categories || []).map((cat) => (
                  <Select.Option key={cat.category_id} value={cat.category_id}>
                    {cat.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item 
          name="description" 
          label={<LabelWithIcon icon={<FileTextOutlined />} text="Mô tả" />}
          className="custom-form-item"
        >
          <TextArea rows={5} showCount maxLength={2000} />
        </Form.Item>

        <Row gutter={24}>
          <Col xs={24} md={14}>
            <Form.Item
              name="dateRange"
              label={<LabelWithIcon icon={<CalendarOutlined />} text="Thời gian diễn ra" />}
              className="custom-form-item"
              rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
            >
              <RangePicker
                size="large"
                disabled={restrictedMode}
                showTime
                style={{ width: "100%" }}
                format="DD/MM/YYYY HH:mm"
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item
              name="target_participants"
              label={<LabelWithIcon icon={<TeamOutlined />} text="Số lượng tình nguyện viên" />}
              className="custom-form-item"
              rules={[{ required: true, message: "Vui lòng nhập số lượng" }]}
            >
              <InputNumber
                size="large"
                disabled={restrictedMode}
                min={1}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="location"
          label={<LabelWithIcon icon={<EnvironmentOutlined />} text="Địa điểm" />}
          className="custom-form-item"
          rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
        >
          <Input size="large" />
        </Form.Item>

        <Form.Item className="btn-submit-wrapper">
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={() => navigate("/manager/events")} size="large" style={{ borderRadius: 12 }}>
              Hủy bỏ
            </Button>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={updating}
              className="btn-submit-event"
              icon={<SendOutlined />}
              style={{ minWidth: 160 }}
            >
              LƯU THAY ĐỔI
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
};

export default ManagerEditEvent;