// src/components/manager/ManagerEditEvent/ManagerEditEvent.jsx
import { useEffect, useMemo } from "react";
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
  Popconfirm,
  Spin,
  Alert,
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

import useGlobalMessage from "../../../utils/hooks/useGlobalMessage";

const { RangePicker } = DatePicker;
const { TextArea } = Input;

const ManagerEditEvent = () => {
  const { event_id } = useParams(); // /manager/events/:event_id/edit
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

  // load event detail + categories
  useEffect(() => {
    if (!event_id) return;
    dispatch(fetchEventDetailThunk(event_id));
    dispatch(fetchEventCategories());
  }, [dispatch, event_id]);

  // fill form once event loaded
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

  // ======= IMPORTANT: detect restricted mode like BE =======
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

    // ======= KEY FIX: only send allowed fields when restricted =======
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
      const msg =
        err?.message || err || "Không thể cập nhật sự kiện, thử lại sau";
      messageApi.error(msg);
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
      const msg = err?.message || err || "Không thể xóa sự kiện";
      messageApi.error(msg);
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
      {restrictedMode && (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message="Sự kiện đang ở chế độ giới hạn chỉnh sửa"
          description={`Vì ${restrictedReason}, bạn chỉ được sửa Mô tả và Địa điểm. Các trường khác sẽ bị khóa để tránh lỗi khi lưu.`}
        />
      )}

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
          <Input disabled={restrictedMode} />
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
            disabled={restrictedMode}
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
          <InputNumber
            disabled={restrictedMode}
            min={1}
            style={{ width: "100%" }}
          />
        </Form.Item>

        <Form.Item
          name="category_id"
          label="Danh mục"
          rules={[{ required: true, message: "Vui lòng chọn danh mục" }]}
        >
          <Select
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
