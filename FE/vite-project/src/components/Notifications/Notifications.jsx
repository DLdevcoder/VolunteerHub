import "./Notifications.css";
import { useEffect, useState } from "react";
import {
  List,
  Typography,
  Tag,
  Button,
  Spin,
  Pagination,
  Popconfirm,
  Tooltip,
} from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
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
  fetchUnreadCountThunk,
  fetchRecentNotificationsThunk,
} from "../../redux/slices/notificationSlice";

const { Title, Text } = Typography;

const Notifications = () => {
  const dispatch = useDispatch();

  const notifications = useSelector(notificationsSelector) || [];
  const pagination = useSelector(notificationsPaginationSelector) || {};
  const loading = useSelector(loadingNotificationsSelector);

  const currentPageFromStore = pagination?.page || pagination?.currentPage || 1;
  const pageSizeFromStore = pagination?.limit || pagination?.pageSize || 20;
  const totalFromStore =
    pagination?.total ||
    pagination?.totalItems ||
    pagination?.total_records ||
    0;

  const [page, setPage] = useState(currentPageFromStore);
  const [pageSize, setPageSize] = useState(pageSizeFromStore);

  const syncHeaderNotifications = () => {
    dispatch(fetchUnreadCountThunk());
    dispatch(fetchRecentNotificationsThunk(5));
  };

  useEffect(() => {
    dispatch(fetchNotificationsThunk({ page, limit: pageSize })).then(() => {
      syncHeaderNotifications();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, page, pageSize]);

  const handlePageChange = (p, size) => {
    setPage(p);
    setPageSize(size);
  };

  const handleMarkRead = (item) => {
    if (!item.is_read) {
      dispatch(markNotificationReadThunk(item.notification_id)).then(() => {
        syncHeaderNotifications();
      });
    }
  };

  const handleMarkAllRead = () => {
    dispatch(markAllNotificationsReadThunk()).then(() => {
      syncHeaderNotifications();
    });
  };

  const handleDelete = (item, e) => {
    e?.stopPropagation();
    dispatch(deleteNotificationThunk(item.notification_id)).then(() => {
      syncHeaderNotifications();
    });
  };

  const handleRefresh = () => {
    dispatch(fetchNotificationsThunk({ page, limit: pageSize })).then(() => {
      syncHeaderNotifications();
    });
  };

  const renderTime = (iso) => {
    if (!iso) return null;
    try {
      return new Date(iso).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const getBodyText = (item) => {
    if (item.body) return item.body;
    const rawPayload = item.payload;
    if (!rawPayload) return "";
    if (typeof rawPayload === "string") {
      try {
        const obj = JSON.parse(rawPayload);
        if (obj?.message) return obj.message;
      } catch {
        return rawPayload;
      }
    } else if (typeof rawPayload === "object") {
      if (rawPayload.message) return rawPayload.message;
      return JSON.stringify(rawPayload);
    }
    return "";
  };

  return (
    <div className="notifications-page-wrapper">
      {/* HEADER */}
      <div className="ntf-header">
        <Title level={3} className="ntf-title">
          <BellOutlined /> Tất cả thông báo
        </Title>

        <div className="ntf-actions">
          <Tooltip title="Tải lại danh sách">
            <Button
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
              className="ntf-btn-refresh"
            />
          </Tooltip>

          <Button
            type="primary"
            icon={<CheckCircleOutlined />}
            onClick={handleMarkAllRead}
            className="ntf-btn-mark-all"
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </div>
      </div>

      {/* BODY */}
      <div className="ntf-body">
        {loading ? (
          <div className="ntf-loading">
            <Spin size="large" />
          </div>
        ) : (
          <>
            <List
              className="ntf-list"
              itemLayout="horizontal"
              dataSource={notifications}
              locale={{ emptyText: "Bạn chưa có thông báo nào." }}
              renderItem={(item) => {
                const title = item.title || item.type || "Thông báo hệ thống";
                const mainText = getBodyText(item);
                const isRead = item.is_read;

                return (
                  <List.Item
                    className={`ntf-list-item ${
                      isRead ? "ntf-item-read" : "ntf-item-unread"
                    }`}
                    onClick={() => handleMarkRead(item)}
                    actions={[
                      <Popconfirm
                        key="delete"
                        title="Bạn có chắc chắn muốn xóa thông báo này?"
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                        onConfirm={(e) => handleDelete(item, e)}
                        onCancel={(e) => e?.stopPropagation()}
                      >
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          className="ntf-btn-delete"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>,
                    ]}
                  >
                    <List.Item.Meta
                      title={
                        <div className="ntf-item-title">
                          <Text strong className="ntf-item-title-text">
                            {title}
                          </Text>
                          {!isRead && <Tag className="ntf-tag-new">Mới</Tag>}
                        </div>
                      }
                      description={
                        <>
                          {mainText && (
                            <div className="ntf-item-body">{mainText}</div>
                          )}
                          <div className="ntf-item-time">
                            <ClockCircleOutlined />{" "}
                            {renderTime(item.created_at)}
                          </div>
                        </>
                      }
                    />
                  </List.Item>
                );
              }}
            />

            {totalFromStore > 0 && (
              <div className="ntf-pagination-wrapper">
                <Pagination
                  current={page}
                  pageSize={pageSize}
                  total={totalFromStore}
                  showSizeChanger
                  onChange={handlePageChange}
                  onShowSizeChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Notifications;
