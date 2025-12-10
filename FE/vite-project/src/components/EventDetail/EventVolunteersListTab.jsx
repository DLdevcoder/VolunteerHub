import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Table, Typography, Spin, Empty } from "antd";
import { getEventVolunteersPublicThunk } from "../../redux/slices/registrationSlice";
import {
  publicEventVolunteersSelector,
  publicEventVolunteersLoadingSelector,
  publicEventVolunteersErrorSelector,
} from "../../redux/selectors/registrationSelectors";

const { Text } = Typography;

const EventVolunteersListTab = ({ eventId }) => {
  const dispatch = useDispatch();

  let items = useSelector(publicEventVolunteersSelector(eventId));
  const loading = useSelector(publicEventVolunteersLoadingSelector(eventId));
  const error = useSelector(publicEventVolunteersErrorSelector(eventId));

  useEffect(() => {
    if (!eventId) return;
    dispatch(getEventVolunteersPublicThunk(eventId));
  }, [dispatch, eventId]);

  items = (items || []).filter(
    (item) => item.status === "approved" || item.status === "completed"
  );

  if (loading && !items.length) {
    return (
      <div style={{ textAlign: "center", padding: 24 }}>
        <Spin />
      </div>
    );
  }

  if (!loading && error) {
    return <Empty description={error} />;
  }

  if (!loading && !items.length) {
    return <Empty description="Chưa có tình nguyện viên nào" />;
  }

  const columns = [
    {
      title: "Tình nguyện viên",
      dataIndex: "full_name",
      key: "full_name",
      render: (text) => <Text strong>{text}</Text>,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "registration_date",
      key: "registration_date",
      render: (val) =>
        val ? new Date(val).toLocaleDateString("vi-VN") : "(không rõ)",
    },
  ];

  return (
    <Table
      rowKey="registration_id"
      columns={columns}
      dataSource={items}
      pagination={false}
      size="middle"
    />
  );
};

export default EventVolunteersListTab;
