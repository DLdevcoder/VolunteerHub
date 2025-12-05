import "./EventDetail.css";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  Avatar,
  Button,
  Input,
  List,
  Space,
  Typography,
  Spin,
  Empty,
} from "antd";
import { UserOutlined } from "@ant-design/icons";

import {
  eventDetailSelector,
  eventDetailLoadingSelector,
} from "../../redux/selectors/eventSelectors";
import { fetchEventDetailThunk } from "../../redux/slices/eventSlice";

import {
  eventPostsSelector,
  eventPostsPaginationSelector,
  eventPostsLoadingSelector,
} from "../../redux/selectors/postSelectors";
import {
  fetchEventPostsThunk,
  createPostThunk,
  deletePostThunk,
} from "../../redux/slices/postSlice";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const PAGE_SIZE = 10;

// reuse the helper format from EventCard
const formatDateRange = (start, end) => {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);

  const pad = (n) => n.toString().padStart(2, "0");
  const fmt = (d) =>
    `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;

  return `${fmt(s)} - ${fmt(e)}`;
};

const EventDetail = () => {
  const { event_id } = useParams();
  const dispatch = useDispatch();

  const event = useSelector(eventDetailSelector);
  const detailLoading = useSelector(eventDetailLoadingSelector);

  console.log("Event detail, event id = ", event_id);

  const posts = useSelector(eventPostsSelector);
  const postsPagination = useSelector(eventPostsPaginationSelector);
  const postsLoading = useSelector(eventPostsLoadingSelector);

  const authUser = useSelector((state) => state.auth.user);

  const [page, setPage] = useState(1);
  const [newPostContent, setNewPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  // Load event + first page of posts
  useEffect(() => {
    if (!event_id) return;

    dispatch(fetchEventDetailThunk(event_id));
    dispatch(
      fetchEventPostsThunk({
        event_id,
        page: 1,
        limit: PAGE_SIZE,
      })
    );
    // ⬆️ we do NOT call setPage(1) here (no warning)
  }, [dispatch, event_id]);

  const handleChangePostsPage = (nextPage) => {
    setPage(nextPage);
    dispatch(
      fetchEventPostsThunk({
        event_id,
        page: nextPage,
        limit: PAGE_SIZE,
      })
    );
  };

  const handleCreatePost = async () => {
    const content = newPostContent.trim();
    if (!content) return;

    try {
      setCreatingPost(true);
      await dispatch(
        createPostThunk({
          event_id,
          content,
        })
      ).unwrap();

      setNewPostContent("");

      // reload first page (or current page)
      handleChangePostsPage(1);
    } catch (err) {
      // optional: show message.error here
      // message.error(err || "Không thể đăng bài");
      console.error(err);
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await dispatch(deletePostThunk({ event_id, postId })).unwrap();
      // reload current page
      handleChangePostsPage(page);
    } catch (err) {
      console.error(err);
    }
  };

  // ===== Top summary block helpers =====
  const participantsText = (() => {
    if (!event) return "";
    const current = event.current_participants ?? 0;
    const target = event.target_participants;

    if (target && target > 0) {
      return `${current}/${target} người tham gia`;
    }
    return `${current} người tham gia`;
  })();

  return (
    <div className="event-detail-page">
      {/* Top event info */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        {detailLoading && !event ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : !event ? (
          <Empty description="Không tìm thấy sự kiện" />
        ) : (
          <div className="event-detail-summary">
            <Title level={3} style={{ marginBottom: 4 }}>
              {event.title}
            </Title>

            <div style={{ marginBottom: 8 }}>
              <Text strong>Thời gian: </Text>
              <Text>{formatDateRange(event.start_date, event.end_date)}</Text>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text strong>Địa điểm: </Text>
              <Text>{event.location}</Text>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Text strong>Người tham gia: </Text>
              <Text>{participantsText}</Text>
            </div>

            {event.description && (
              <Paragraph style={{ marginTop: 8 }}>
                {event.description}
              </Paragraph>
            )}
          </div>
        )}
      </Card>

      {/* Post composer */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space align="start" style={{ width: "100%" }}>
          <Avatar
            size="large"
            src={authUser?.avatar_url}
            icon={!authUser?.avatar_url && <UserOutlined />}
          />
          <div className="event-detail-composer">
            <TextArea
              rows={3}
              placeholder="Bạn đang nghĩ gì về sự kiện này?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <div className="event-detail-composer-actions">
              <Button
                type="primary"
                disabled={!newPostContent.trim()}
                loading={creatingPost}
                onClick={handleCreatePost}
              >
                Đăng
              </Button>
            </div>
          </div>
        </Space>
      </Card>

      {/* Posts list */}
      <Card bordered={false}>
        {postsLoading && !posts.length ? (
          <div style={{ textAlign: "center", padding: 24 }}>
            <Spin />
          </div>
        ) : !posts.length ? (
          <Empty description="Chưa có bài viết nào" />
        ) : (
          <List
            itemLayout="vertical"
            dataSource={posts}
            renderItem={(post) => (
              <List.Item
                key={post.post_id}
                className="event-detail-post-item"
                actions={
                  post.user_id === authUser?.user_id ||
                  event?.manager_id === authUser?.user_id
                    ? [
                        <Button
                          key="delete"
                          type="link"
                          danger
                          onClick={() => handleDeletePost(post.post_id)}
                        >
                          Xóa
                        </Button>,
                      ]
                    : []
                }
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={post.avatar_url}
                      icon={!post.avatar_url && <UserOutlined />}
                    />
                  }
                  title={
                    <Space direction="vertical" size={0}>
                      <Text strong>{post.full_name}</Text>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {new Date(post.created_at).toLocaleString("vi-VN")}
                      </Text>
                    </Space>
                  }
                />
                <div className="event-detail-post-content">{post.content}</div>
              </List.Item>
            )}
            pagination={
              postsPagination?.total > PAGE_SIZE
                ? {
                    current: postsPagination.page || page,
                    pageSize: postsPagination.limit || PAGE_SIZE,
                    total: postsPagination.total,
                    onChange: handleChangePostsPage,
                  }
                : false
            }
          />
        )}
      </Card>
    </div>
  );
};

export default EventDetail;
