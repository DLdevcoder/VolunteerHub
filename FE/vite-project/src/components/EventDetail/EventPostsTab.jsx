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
  Popconfirm,
} from "antd";
import { UserOutlined, DeleteOutlined } from "@ant-design/icons";

// --- REDUX ---
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
import useGlobalMessage from "../../utils/hooks/useGlobalMessage";

// --- COMPONENTS ---
import PostCard from "../../components/Post/PostCard";

// --- CSS ---
import "./EventPostsTab.css"; // Import the new scoped CSS

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
  const messageApi = useGlobalMessage();

  const posts = useSelector(eventPostsSelector);
  const postsPagination = useSelector(eventPostsPaginationSelector);
  const postsLoading = useSelector(eventPostsLoadingSelector);

  const [page, setPage] = useState(1);
  const [newPostContent, setNewPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  // 1. Load posts
  useEffect(() => {
    if (!eventId || !canViewPosts) return;
    setPage(1);
    dispatch(
      fetchEventPostsThunk({
        eventId,
        page: 1,
        limit: PAGE_SIZE,
      })
    );
  }, [dispatch, eventId, canViewPosts]);

  // 2. Pagination handler
  const handleChangePostsPage = (nextPage) => {
    setPage(nextPage);
    dispatch(
      fetchEventPostsThunk({
        eventId,
        page: nextPage,
        limit: PAGE_SIZE,
      })
    );
  };

  // 3. Create Post
  const handleCreatePost = async () => {
    const content = newPostContent.trim();
    if (!content) return;

    try {
      setCreatingPost(true);
      await dispatch(
        createPostThunk({
          eventId,
          content,
        })
      ).unwrap();

      setNewPostContent("");
      handleChangePostsPage(1); // Reload to page 1 to see new post
      messageApi.success("Đã đăng bài viết");
    } catch (err) {
      console.error(err);
      messageApi.error(err?.message || "Không thể đăng bài.");
    } finally {
      setCreatingPost(false);
    }
  };

  // 4. Delete Post
  const handleDeletePost = async (postId) => {
    try {
      await dispatch(deletePostThunk(postId)).unwrap();
      handleChangePostsPage(page); // Reload current page
      messageApi.success("Đã xóa bài viết");
    } catch (err) {
      console.error(err);
      messageApi.error(err?.message || "Không thể xóa bài viết.");
    }
  };

  if (!canViewPosts) {
    return (
      <div className="ept-empty-container">
        <Empty description="Bạn cần tham gia sự kiện để xem thảo luận." />
      </div>
    );
  }

  return (
    <div className="event-posts-tab-container">
      {/* === CREATE POST AREA === */}
      {canCreatePost && (
        <div className="ept-create-post-widget">
          <div className="ept-create-post-top">
            <div className="ept-avatar">
              <Avatar
                size={40}
                src={authUser?.avatar_url}
                icon={!authUser?.avatar_url && <UserOutlined />}
              />
            </div>
            <div className="ept-input-container">
              <TextArea
                rows={2}
                placeholder={`Chia sẻ suy nghĩ của bạn, ${authUser?.full_name || "bạn"} ơi...`}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="ept-textarea"
                bordered={false}
                autoSize={{ minRows: 2, maxRows: 6 }}
              />
            </div>
          </div>

          <div className="ept-divider"></div>

          <div className="ept-actions">
            <Button
              type="primary"
              disabled={!newPostContent.trim()}
              loading={creatingPost}
              onClick={handleCreatePost}
              className="ept-post-btn"
            >
              Đăng
            </Button>
          </div>
        </div>
      )}

      {/* === POST LIST === */}
      {postsLoading && !posts.length ? (
        <div className="ept-loading-container">
          <Spin size="large" />
        </div>
      ) : !posts.length ? (
        <div className="ept-empty-container">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có bài viết nào"
          />
        </div>
      ) : (
        <List
          itemLayout="vertical"
          dataSource={posts}
          split={false} // Disable Antd divider
          renderItem={(post) => {
            // Check delete permission: Post Owner OR Event Manager
            const isOwner = post.user_id === authUser?.user_id;
            const isManager = event?.manager_id === authUser?.user_id;
            const canDelete = isOwner || isManager;

            return (
              <List.Item key={post.post_id} className="ept-list-item">
                <div style={{ position: "relative" }}>
                  {/* Render PostCard */}
                  <PostCard post={post} currentUser={authUser} />

                  {/* Delete Button (Top right overlay) */}
                  {canDelete && (
                    <div className="ept-delete-btn-container">
                      <Popconfirm
                        title="Bạn chắc chắn muốn xóa bài này?"
                        onConfirm={() => handleDeletePost(post.post_id)}
                        okText="Xóa"
                        cancelText="Hủy"
                        okButtonProps={{ danger: true }}
                      >
                        <Button
                          type="text"
                          danger
                          size="small"
                          icon={<DeleteOutlined />}
                          className="ept-delete-btn"
                        />
                      </Popconfirm>
                    </div>
                  )}
                </div>
              </List.Item>
            );
          }}
          pagination={
            postsPagination?.total > PAGE_SIZE
              ? {
                  current: postsPagination.page || page,
                  pageSize: postsPagination.limit || PAGE_SIZE,
                  total: postsPagination.total,
                  onChange: handleChangePostsPage,
                  align: "center",
                  style: { marginTop: 20, marginBottom: 20 },
                }
              : false
          }
        />
      )}
    </div>
  );
};

export default EventPostsTab;
