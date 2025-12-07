// src/pages/EventDetail/EventPostsTab.jsx
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Avatar,
  Button,
  Input,
  List,
  Space,
  Spin,
  Empty,
  Typography,
  message,
} from "antd";
import { UserOutlined } from "@ant-design/icons";

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

const { Text } = Typography;
const { TextArea } = Input;

const PAGE_SIZE = 10;

const EventPostsTab = ({
  eventId,
  event,
  authUser,
  canViewPosts,
  canCreatePost,
}) => {
  const dispatch = useDispatch();

  const posts = useSelector(eventPostsSelector);
  const postsPagination = useSelector(eventPostsPaginationSelector);
  const postsLoading = useSelector(eventPostsLoadingSelector);

  const [page, setPage] = useState(1);
  const [newPostContent, setNewPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  // load first page of posts when eventId changes
  useEffect(() => {
    if (!eventId || !canViewPosts) return;
    setPage(1);
    dispatch(
      fetchEventPostsThunk({
        event_id: eventId,
        page: 1,
        limit: PAGE_SIZE,
      })
    );
  }, [dispatch, eventId, canViewPosts]);

  const handleChangePostsPage = (nextPage) => {
    setPage(nextPage);
    dispatch(
      fetchEventPostsThunk({
        event_id: eventId,
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
          event_id: eventId,
          content,
        })
      ).unwrap();

      setNewPostContent("");
      handleChangePostsPage(1);
      message.success("Đã đăng bài trong sự kiện");
    } catch (err) {
      console.error(err);
      message.error(
        err?.message || "Không thể đăng bài. Vui lòng thử lại sau."
      );
    } finally {
      setCreatingPost(false);
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await dispatch(deletePostThunk({ event_id: eventId, postId })).unwrap();
      handleChangePostsPage(page);
      message.success("Đã xóa bài viết");
    } catch (err) {
      console.error(err);
      message.error("Không thể xóa bài viết");
    }
  };

  if (!canViewPosts) {
    return (
      <Empty description="Bạn cần tham gia sự kiện để xem các bài viết bên trong." />
    );
  }

  return (
    <div>
      {/* Composer */}
      {canCreatePost && (
        <div style={{ marginBottom: 16 }}>
          <Space align="start" style={{ width: "100%" }}>
            <Avatar
              size="large"
              src={authUser?.avatar_url}
              icon={!authUser?.avatar_url && <UserOutlined />}
            />
            <div style={{ flex: 1 }}>
              <TextArea
                rows={3}
                placeholder="Bạn đang nghĩ gì về sự kiện này?"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
              <div
                style={{
                  marginTop: 8,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
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
        </div>
      )}

      {/* Posts list */}
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
                  <div>
                    <Text strong>{post.full_name}</Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {new Date(post.created_at).toLocaleString("vi-VN")}
                    </Text>
                  </div>
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
    </div>
  );
};

export default EventPostsTab;
