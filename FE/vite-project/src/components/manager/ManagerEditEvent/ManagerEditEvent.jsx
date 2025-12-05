// src/components/manager/ManagerEditEvent/ManagerEditEvent.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  Form,
  Input,
  InputNumber,
  DatePicker,
  Select,
  Button,
  Space,
  message,
  Popconfirm,
  Spin,
} from "antd";
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

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ManagerEditEvent = () => {
  const { event_id } = useParams(); // path: /manager/events/:event_id/edit
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const event = useSelector(eventDetailSelector);
  const detailLoading = useSelector(eventDetailLoadingSelector);

  const categories = useSelector(eventCategoriesSelector);
  const categoriesLoading = useSelector(eventCategoriesLoadingSelector);

  const updating = useSelector(eventUpdateLoadingSelector);
  const deleting = useSelector(eventDeleteLoadingSelector);

  // load event detail + categories on mount
  useEffect(() => {
    if (!event_id) return;
    dispatch(fetchEventDetailThunk(event_id));
    dispatch(fetchEventCategories());
  }, [dispatch, event_id]);

  // when event detail loaded -> fill form
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

  const handleSubmit = async (values) => {
    console.log("SUBMIT VALUES = ", values);
    if (!event_id) return;
    const [start, end] = values.dateRange || [];

    const payload = {
      title: values.title?.trim(),
      description: values.description?.trim() || "",
      target_participants: values.target_participants,
      location: values.location?.trim(),
      category_id: values.category_id,
      start_date: start ? start.toISOString() : null,
      end_date: end ? end.toISOString() : null,
    };

    try {
      await dispatch(
        updateEventThunk({
          eventId: event_id,
          payload,
        })
      ).unwrap();

      // refetch first page (optional but safe)
      await dispatch(fetchManagerEvents({ page: 1, limit: 10 }));

      message.success("Cập nhật sự kiện thành công");
      navigate("/manager/events");
    } catch (err) {
      const msg =
        err?.message || err || "Không thể cập nhật sự kiện, thử lại sau";
      message.error(msg);
    }
  };

  const handleDelete = async () => {
    if (!event_id) return;
    try {
      await dispatch(deleteEventThunk(event_id)).unwrap();
      await dispatch(fetchManagerEvents({ page: 1, limit: 10 }));
      message.success("Đã xóa sự kiện thành công");
      navigate("/manager/events");
    } catch (err) {
      const msg = err?.message || err || "Không thể xóa sự kiện";
      message.error(msg);
    }
  };

  if (detailLoading && !event) {
    return (
      <div style={{ textAlign: "center", padding: 40 }}>
        <Spin />
      </div>
    );
  }

  if (!event) {
    return <Card title="Chỉnh sửa sự kiện">Không tìm thấy sự kiện.</Card>;
  }

  return (
    <Card
      title="Chỉnh sửa sự kiện"
      extra={
        <Popconfirm
          title="Xóa sự kiện?"
          description="Sự kiện sẽ bị xóa và các tình nguyện viên đã đăng ký sẽ nhận thông báo."
          okText="Xóa"
          cancelText="Hủy"
          onConfirm={handleDelete}
        >
          <Button danger loading={deleting}>
            Xóa event
          </Button>
        </Popconfirm>
      }
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        onFinishFailed={(err) => {
          console.log("VALIDATION FAILED", err);
        }}
        autoComplete="off"
      >
        <Form.Item
          name="title"
          label="Tên sự kiện"
          rules={[{ required: true, message: "Vui lòng nhập tên sự kiện" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <TextArea rows={4} />
        </Form.Item>

        <Form.Item
          name="dateRange"
          label="Thời gian diễn ra"
          rules={[{ required: true, message: "Vui lòng chọn thời gian" }]}
        >
          <RangePicker
            showTime
            style={{ width: "100%" }}
            format="DD/MM/YYYY HH:mm"
          />
        </Form.Item>

        <Form.Item
          name="location"
          label="Địa điểm"
          rules={[{ required: true, message: "Vui lòng nhập địa điểm" }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="target_participants"
          label="Số lượng mục tiêu"
          rules={[
            {
              required: true,
              message: "Vui lòng nhập số lượng tình nguyện viên",
            },
          ]}
        >
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="category_id"
          label="Danh mục"
          rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
        >
          <Select loading={categoriesLoading} placeholder="Chọn danh mục">
            {categories.map((cat) => (
              <Select.Option key={cat.category_id} value={cat.category_id}>
                {cat.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={updating}>
              Lưu thay đổi
            </Button>
            <Button onClick={() => navigate("/manager/events")}>Hủy</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default ManagerEditEvent;
