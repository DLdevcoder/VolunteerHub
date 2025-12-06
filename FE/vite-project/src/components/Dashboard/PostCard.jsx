import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Avatar, Input, Button, Spin, message, Modal } from "antd";
import { UserOutlined, SendOutlined, ExportOutlined } from "@ant-design/icons";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { FaRegCommentAlt, FaGlobeAmericas } from "react-icons/fa";
import postApi from "../../../apis/postApi";

// Helper: Tính thời gian
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Vừa xong";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  return date.toLocaleDateString("vi-VN");
};

// Helper: Màu avatar
const stringToColor = (string) => {
  if (!string) return "#ccc";
  const colors = ["#1877f2", "#42b72a", "#f7b928", "#fa383e", "#a333c8"];
  let hash = 0;
  for (let i = 0; i < string.length; i++)
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const PostCard = ({ post, currentUser }) => {
  // State Like
  const [isLiked, setIsLiked] = useState(post.is_liked > 0);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);

  // State Comment
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);

  // Ref để cuộn xuống cuối danh sách comment
  const commentsEndRef = useRef(null);

  // Tự động cuộn xuống khi có comment mới
  useEffect(() => {
    if (isModalOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isModalOpen]);

  // --- 1. XỬ LÝ LIKE ---
  const handleLike = async () => {
    const newStatus = !isLiked;
    setIsLiked(newStatus);
    setLikeCount((prev) => (newStatus ? prev + 1 : prev - 1));

    try {
      await postApi.toggleLike(post.post_id);
    } catch (error) {
      console.error("Lỗi like:", error);
      setIsLiked(!newStatus);
      setLikeCount((prev) => (newStatus ? prev - 1 : prev + 1));
    }
  };

  // --- 2. MỞ MODAL & TẢI COMMENT ---
  const openCommentModal = async () => {
    setIsModalOpen(true);

    // Chỉ tải nếu chưa tải lần nào
    if (!commentsLoaded) {
      try {
        setCommentsLoading(true);
        const res = await postApi.getComments(post.post_id);
        if (res.success) {
          setComments(res.data);
          setCommentsLoaded(true);
        }
      } catch (error) {
        console.error("Lỗi tải comment:", error);
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  // --- 3. GỬI COMMENT (QUAN TRỌNG: CẬP NHẬT STATE NGAY) ---
  const handleSendComment = async () => {
    if (!commentText.trim()) return;

    try {
      const res = await postApi.createComment(post.post_id, commentText);
      if (res.success) {
        const newComment = res.data.comment || res.data;

        // Cập nhật danh sách comment ngay lập tức
        setComments((prevComments) => [...prevComments, newComment]);

        // Reset ô nhập
        setCommentText("");
      }
    } catch (error) {
      console.error("Lỗi gửi comment:", error);
      message.error("Không thể gửi bình luận.");
    }
  };

  // Component con Header (Dùng chung cho Card và Modal)
  const PostHeader = () => (
    <div className="post-header">
      <Link to="#">
        {post.avatar_url ? (
          <img src={post.avatar_url} alt="Avt" className="post-avatar-img" />
        ) : (
          <div
            className="post-avatar-placeholder"
            style={{ backgroundColor: stringToColor(post.full_name) }}
          >
            {post.full_name?.charAt(0).toUpperCase()}
          </div>
        )}
      </Link>
      <div className="post-info">
        <span className="post-author">
          {post.full_name}
          <span
            style={{ fontWeight: "normal", color: "#65676b", margin: "0 5px" }}
          >
            ▶
          </span>
          <Link to={`/events/${post.event_id}`} className="post-event-link">
            {post.title}
          </Link>
        </span>
        <span className="post-meta">
          {timeAgo(post.latest_post_time)} ·{" "}
          <FaGlobeAmericas size={12} style={{ marginLeft: 4 }} />
        </span>
      </div>
    </div>
  );

  return (
    <>
      {/* CARD Ở NGOÀI DASHBOARD */}
      <div className="fb-post-card">
        <PostHeader />
        <div className="post-content">{post.content}</div>

        {/* Stats */}
        <div className="post-stats">
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {likeCount > 0 && (
              <>
                <div
                  style={{
                    background: "#1877f2",
                    borderRadius: "50%",
                    padding: 3,
                    display: "flex",
                  }}
                >
                  <AiFillLike color="white" size={10} />
                </div>
                <span style={{ color: "#65676b" }}>{likeCount}</span>
              </>
            )}
          </div>
          <div
            style={{ cursor: "pointer", color: "#65676b" }}
            onClick={openCommentModal}
            className="hover:underline"
          >
            {(post.comment_count || 0) + comments.length > 0
              ? `${Math.max(post.comment_count || 0, comments.length)} bình luận`
              : ""}
          </div>
        </div>

        {/* Actions */}
        <div className="post-footer">
          <div
            className={`post-action ${isLiked ? "liked" : ""}`}
            onClick={handleLike}
          >
            {isLiked ? <AiFillLike size={20} /> : <AiOutlineLike size={20} />}
            <span>Thích</span>
          </div>
          <div className="post-action" onClick={openCommentModal}>
            <FaRegCommentAlt size={18} />
            <span>Bình luận</span>
          </div>
          <Link to={`/events/${post.event_id}`} className="post-action">
            <ExportOutlined style={{ fontSize: 18 }} />
            <span>Xem thêm</span>
          </Link>
        </div>
      </div>

      {/* MODAL POPUP (GIỐNG FACEBOOK) */}
      <Modal
        title={
          <div className="fb-post-modal-header">
            Bài viết của {post.full_name}
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        width={700}
        centered
        className="fb-post-modal"
        styles={{ body: { padding: 0 } }}
      >
        <div className="fb-post-modal-scroll">
          {/* Nội dung bài gốc */}
          <div className="modal-post-content">
            <PostHeader />
            <div className="post-content" style={{ fontSize: 16 }}>
              {post.content}
            </div>
            <div
              className="post-stats"
              style={{ borderBottom: "none", paddingBottom: 0 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <AiFillLike color="#1877f2" /> {likeCount}
              </div>
            </div>
            <div className="post-footer" style={{ marginTop: 8 }}>
              <div
                className={`post-action ${isLiked ? "liked" : ""}`}
                onClick={handleLike}
              >
                {isLiked ? (
                  <AiFillLike size={20} />
                ) : (
                  <AiOutlineLike size={20} />
                )}{" "}
                Thích
              </div>
              <div
                className="post-action"
                style={{ cursor: "default", color: "#65676b" }}
              >
                <FaRegCommentAlt size={18} /> Bình luận
              </div>
            </div>
          </div>

          {/* Danh sách Comment */}
          <div className="comment-list-container">
            {commentsLoading && (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin />
              </div>
            )}

            {!commentsLoading && comments.length === 0 && (
              <div
                style={{ textAlign: "center", color: "#65676b", padding: 20 }}
              >
                Chưa có bình luận nào. Hãy là người đầu tiên!
              </div>
            )}

            {comments.map((cmt) => (
              <div key={cmt.comment_id} className="comment-item">
                <Avatar
                  src={cmt.avatar_url}
                  icon={<UserOutlined />}
                  size="small"
                  style={{ flexShrink: 0, marginTop: 4 }}
                />
                <div className="comment-bubble">
                  <div className="comment-author">{cmt.full_name}</div>
                  <div className="comment-text">{cmt.content}</div>
                </div>
              </div>
            ))}
            {/* Div rỗng để cuộn xuống đây */}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Ô nhập liệu (Sticky Bottom) */}
        <div className="fb-post-modal-footer">
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Avatar src={currentUser?.avatar_url} icon={<UserOutlined />} />
            <Input
              placeholder="Viết bình luận công khai..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onPressEnter={handleSendComment}
              className="comment-input-container"
              suffix={
                <Button
                  type="text"
                  icon={
                    <SendOutlined
                      style={{ color: commentText ? "#1877f2" : "#ccc" }}
                    />
                  }
                  onClick={handleSendComment}
                />
              }
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PostCard;
