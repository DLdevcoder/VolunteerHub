import "./Notifications.css";
import { useEffect, useState } from "react";
import {
  List,
  Typography,
  Tag,
  Button,
  Spin,
  Pagination,
  Space,
  Popconfirm,
} from "antd";
import { useDispatch, useSelector } from "react-redux";

import {
  notificationsSelector,
  notificationsPaginationSelector,
  loadingNotificationsSelector,
} from "../../redux/selectors/notificationSelectors";

import {
  fetchNotificationsThunk,
  markNotificationReadThunk,
  markAllNotificationsReadThunk,
  deleteNotificationThunk,
} from "../../redux/slices/notificationSlice";

const { Title, Text } = Typography;

const Notifications = () => {
  const dispatch = useDispatch();

  const notifications = useSelector(notificationsSelector);
  const pagination = useSelector(notificationsPaginationSelector);
  const loading = useSelector(loadingNotificationsSelector);

  // cố gắng đọc nhiều kiểu tên field pagination khác nhau cho đỡ lệ thuộc
  const currentPageFromStore = pagination?.page || pagination?.currentPage || 1;
  const pageSizeFromStore = pagination?.limit || pagination?.pageSize || 20;
  const totalFromStore =
    pagination?.total ||
    pagination?.totalItems ||
    pagination?.total_records ||
    0;

  const [page, setPage] = useState(currentPageFromStore);
  const [pageSize, setPageSize] = useState(pageSizeFromStore);

  // load list mỗi khi page/pageSize đổi
  useEffect(() => {
    dispatch(fetchNotificationsThunk({ page, limit: pageSize }));
  }, [dispatch, page, pageSize]);

  const handlePageChange = (p, size) => {
    setPage(p);
    setPageSize(size);
  };

  const handleMarkRead = (item) => {
    if (!item.is_read) {
      dispatch(markNotificationReadThunk(item.notification_id));
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsReadThunk());
  };

  const handleDelete = (item) => {
    dispatch(deleteNotificationThunk(item.notification_id));
  };

  const renderTime = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleString("vi-VN");
    } catch {
      return iso;
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <Space
        style={{ width: "100%", marginBottom: 16 }}
        align="center"
        justify="space-between"
      >
        <Title level={3} style={{ margin: 0 }}>
          Tất cả thông báo
        </Title>

        <Space>
          <Button
            onClick={() =>
              dispatch(fetchNotificationsThunk({ page, limit: pageSize }))
            }
          >
            Refresh
          </Button>
          <Button onClick={handleMarkAllRead} type="primary">
            Đánh dấu tất cả đã đọc
          </Button>
        </Space>
      </Space>

      {loading ? (
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <Spin />
        </div>
      ) : (
        <>
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            locale={{ emptyText: "Không có thông báo nào" }}
            renderItem={(item) => (
              <List.Item
                style={{
                  backgroundColor: item.is_read ? "#fff" : "#e6f7ff",
                  borderRadius: 8,
                  marginBottom: 8,
                  padding: 12,
                  cursor: "pointer",
                }}
                onClick={() => handleMarkRead(item)}
                actions={[
                  <Popconfirm
                    key="delete"
                    title="Xóa thông báo?"
                    okText="Xóa"
                    cancelText="Hủy"
                    onConfirm={() => handleDelete(item)}
                  >
                    <Button danger type="link">
                      Xóa
                    </Button>
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Text strong>{item.payload?.title || item.type}</Text>
                      {!item.is_read && <Tag color="blue">Chưa đọc</Tag>}
                    </Space>
                  }
                  description={
                    <>
                      <div>{item.payload?.message}</div>
                      <div style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {renderTime(item.created_at)}
                        </Text>
                      </div>
                    </>
                  }
                />
              </List.Item>
            )}
          />

          <div style={{ marginTop: 16, textAlign: "right" }}>
            <Pagination
              current={page}
              pageSize={pageSize}
              total={totalFromStore}
              showSizeChanger
              onChange={handlePageChange}
              onShowSizeChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;
