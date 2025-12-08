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
  Popconfirm, // Dùng cái này để xác nhận trước khi xóa
} from "antd";
import { UserOutlined, DeleteOutlined } from "@ant-design/icons";
import "./EventPostsTab.css";
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

// --- COMPONENTS (Đường dẫn mới theo folder bạn tạo) ---
import PostCard from "../../components/Post/PostCard";

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
      handleChangePostsPage(1); // Reload về trang 1
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
      handleChangePostsPage(page); // Reload trang hiện tại
      messageApi.success("Đã xóa bài viết");
    } catch (err) {
      console.error(err);
      messageApi.error(err?.message || "Không thể xóa bài viết.");
    }
  };

  if (!canViewPosts) {
    return <Empty description="Bạn cần tham gia sự kiện để xem thảo luận." />;
  }

  return (
    <div
      className="event-posts-tab"
      style={{ maxWidth: 800, margin: "0 auto" }}
    >
      {/* === KHU VỰC ĐĂNG BÀI (CREATE POST WIDGET) === */}
      {canCreatePost && (
        <div className="create-post-widget">
          <div className="create-post-top">
            <div className="create-post-avatar">
              <Avatar
                size={40}
                src={authUser?.avatar_url}
                icon={!authUser?.avatar_url && <UserOutlined />}
              />
            </div>
            <div className="create-post-input-container">
              <TextArea
                rows={2}
                placeholder={`Chia sẻ suy nghĩ của bạn, ${authUser?.full_name || "bạn"} ơi...`}
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="create-post-textarea"
                bordered={false} // Tắt viền mặc định của Antd Input
                autoSize={{ minRows: 2, maxRows: 6 }} // Tự động giãn dòng
              />
            </div>
          </div>
          <br />
          <div className="create-post-actions">
            <Button
              type="primary"
              disabled={!newPostContent.trim()}
              loading={creatingPost}
              onClick={handleCreatePost}
              className="create-post-btn" // Áp dụng class nút chuẩn FB
            >
              Đăng
            </Button>
          </div>
        </div>
      )}
      {/* === DANH SÁCH BÀI VIẾT === */}
      {postsLoading && !posts.length ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Spin size="large" />
        </div>
      ) : !posts.length ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Chưa có bài viết nào"
        />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={posts}
          split={false} // Tắt đường kẻ ngang của List để PostCard tự lo border
          renderItem={(post) => {
            // Check quyền xóa: Chủ bài viết HOẶC Chủ sự kiện (Manager)
            const isOwner = post.user_id === authUser?.user_id;
            const isManager = event?.manager_id === authUser?.user_id;
            const canDelete = isOwner || isManager;

            return (
              <List.Item
                key={post.post_id}
                style={{ padding: 0, marginBottom: 20, border: "none" }}
              >
                <div style={{ position: "relative" }}>
                  {/* Nhúng PostCard */}
                  <PostCard post={post} currentUser={authUser} />

                  {/* Nút Xóa (Hiển thị góc trên bên phải Card nếu có quyền) */}
                  {canDelete && (
                    <div
                      style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        zIndex: 10,
                      }}
                    >
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
                          style={{ background: "rgba(255,255,255,0.8)" }} // Nền trắng mờ để dễ nhìn
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
                  style: { marginTop: 20 },
                }
              : false
          }
        />
      )}
    </div>
  );
};

export default EventPostsTab;
