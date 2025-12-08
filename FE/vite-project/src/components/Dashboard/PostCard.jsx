import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Avatar,
  Input,
  Button,
  Spin,
  message,
  Modal,
  Popover,
  Tooltip,
} from "antd";
import { UserOutlined, SendOutlined, ExportOutlined } from "@ant-design/icons";
import { AiOutlineLike } from "react-icons/ai"; // Icon like rỗng
import { FaRegCommentAlt, FaGlobeAmericas } from "react-icons/fa";
import postApi from "../../../apis/postApi";
import {
  REACTION_TYPES,
  getReactionIcon,
  getReactionColor,
  getReactionLabel,
} from "../../utils/reactionIcons";
import ReactionModal from "./ReactionModal"; // Import Modal danh sách người thả tim (đã tạo ở bước trước)

// --- HELPER: Thời gian ---
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

// --- HELPER: Màu Avatar ---
const stringToColor = (string) => {
  if (!string) return "#ccc";
  const colors = ["#1877f2", "#42b72a", "#f7b928", "#fa383e", "#a333c8"];
  let hash = 0;
  for (let i = 0; i < string.length; i++)
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const PostCard = ({ post, currentUser }) => {
  // --- STATE REACTION ---
  // currentReaction nhận giá trị: null, 'like', 'love', 'haha', ...
  const [currentReaction, setCurrentReaction] = useState(
    post.current_reaction || null
  );
  const [reactionCount, setReactionCount] = useState(post.like_count || 0);
  const [isReactionListOpen, setIsReactionListOpen] = useState(false); // Modal danh sách người thả tim

  // --- STATE COMMENT ---
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const commentsEndRef = useRef(null); // Để auto scroll

  // Auto scroll xuống cuối khi có comment mới
  useEffect(() => {
    if (isCommentModalOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isCommentModalOpen]);

  // ==================== LOGIC REACTION ====================

  const handleReaction = async (type) => {
    const oldReaction = currentReaction;
    const oldCount = reactionCount;

    // Logic Optimistic UI (Cập nhật giao diện ngay lập tức)
    if (currentReaction === type) {
      // Bấm lại icon đang chọn -> Gỡ bỏ (Unlike)
      setCurrentReaction(null);
      setReactionCount((prev) => (prev > 0 ? prev - 1 : 0));
      // Gọi API type cũ để gỡ
      try {
        await postApi.toggleReaction(post.post_id, type);
      } catch (e) {
        setCurrentReaction(oldReaction);
        setReactionCount(oldCount);
      }
    } else {
      // Đổi icon hoặc thả mới
      setCurrentReaction(type);
      // Nếu trước đó chưa thả gì thì tăng 1, nếu đổi icon thì giữ nguyên số lượng
      if (!oldReaction) setReactionCount((prev) => prev + 1);

      try {
        await postApi.toggleReaction(post.post_id, type);
      } catch (e) {
        setCurrentReaction(oldReaction);
        setReactionCount(oldCount);
      }
    }
  };

  // Menu Icon khi Hover vào nút Thích
  const reactionMenu = (
    <div style={{ display: "flex", gap: 8, padding: "4px 8px" }}>
      {Object.keys(REACTION_TYPES).map((type) => (
        <div
          key={type}
          onClick={() => handleReaction(type)}
          className="reaction-icon-hover" // Class CSS animation
          style={{
            fontSize: 24,
            cursor: "pointer",
            transition: "transform 0.2s",
          }}
          title={REACTION_TYPES[type].label}
        >
          {REACTION_TYPES[type].icon}
        </div>
      ))}
    </div>
  );

  // Tooltip hiển thị khi hover vào số lượng like
  const reactionTooltipText = currentReaction
    ? `Bạn${reactionCount > 1 ? ` và ${reactionCount - 1} người khác` : ""}`
    : `${reactionCount} người đã bày tỏ cảm xúc`;

  // ==================== LOGIC COMMENT ====================

  const openCommentModal = async () => {
    setIsCommentModalOpen(true);
    if (!commentsLoaded) {
      try {
        setCommentsLoading(true);
        const res = await postApi.getComments(post.post_id);
        if (res.success) {
          setComments(res.data);
          setCommentsLoaded(true);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setCommentsLoading(false);
      }
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await postApi.createComment(post.post_id, commentText);
      if (res.success) {
        // Lấy data trả về (cấu trúc tùy BE: res.data hoặc res.data.comment)
        const newComment = res.data.comment || res.data;
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
      }
    } catch (error) {
      message.error("Không thể gửi bình luận.");
    }
  };

  // ==================== RENDER ====================

  // Header dùng chung
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
      {/* --- CARD CHÍNH --- */}
      <div className="fb-post-card">
        <PostHeader />
        <div className="post-content">{post.content}</div>

        {/* STATS BAR */}
        <div className="post-stats">
          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => setIsReactionListOpen(true)}
          >
            {reactionCount > 0 && (
              <Tooltip title={reactionTooltipText}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  {}
                  <span
                    style={{
                      fontSize: 16,
                      marginRight: 4,
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {getReactionIcon(currentReaction) || (
                      <div
                        style={{
                          background: "#1877f2",
                          borderRadius: "50%",
                          padding: 3,
                          display: "flex",
                          color: "white",
                          fontSize: 10,
                        }}
                      >
                        <AiOutlineLike />
                      </div>
                    )}
                  </span>
                  <span style={{ color: "#65676b", fontSize: 13 }}>
                    {reactionCount}
                  </span>
                </div>
              </Tooltip>
            )}
          </div>

          {/* Bên phải: Số Comment */}
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

        {/* ACTION BAR */}
        <div className="post-footer">
          <Popover
            content={reactionMenu}
            trigger="hover"
            overlayClassName="reaction-popover"
          >
            <div
              className="post-action"
              onClick={() => handleReaction(currentReaction || "like")}
              style={{ color: getReactionColor(currentReaction) }}
            >
              {currentReaction ? (
                // FIX CSS 2: Chỉnh icon ở nút bấm nhỏ lại (fontSize: 18 hoặc 20) để không vỡ khung
                // Thêm display: flex để căn giữa tốt hơn
                <span
                  style={{
                    fontSize: 18,
                    marginRight: 6,
                    display: "flex",
                    alignItems: "center",
                    height: 24, // Cố định chiều cao dòng
                  }}
                >
                  {getReactionIcon(currentReaction)}
                </span>
              ) : (
                <AiOutlineLike size={20} style={{ marginRight: 6 }} />
              )}

              <span style={{ fontWeight: currentReaction ? 600 : 400 }}>
                {getReactionLabel(currentReaction)}
              </span>
            </div>
          </Popover>

          <div className="post-action" onClick={openCommentModal}>
            <FaRegCommentAlt size={18} /> <span>Bình luận</span>
          </div>
          <Link to={`/events/${post.event_id}`} className="post-action">
            <ExportOutlined style={{ fontSize: 18 }} /> <span>Xem thêm</span>
          </Link>
        </div>
      </div>

      {/* --- MODAL 1: DANH SÁCH NGƯỜI REACT (POPUP) --- */}
      <ReactionModal
        postId={post.post_id}
        open={isReactionListOpen}
        onClose={() => setIsReactionListOpen(false)}
      />

      {/* --- MODAL 2: BÌNH LUẬN (FACEBOOK STYLE) --- */}
      <Modal
        title={
          <div className="fb-post-modal-header">
            Bài viết của {post.full_name}
          </div>
        }
        open={isCommentModalOpen}
        onCancel={() => setIsCommentModalOpen(false)}
        footer={null}
        width={700}
        centered
        className="fb-post-modal"
        styles={{ body: { padding: 0 } }}
      >
        <div className="fb-post-modal-scroll">
          <div className="modal-post-content">
            <PostHeader />
            <div className="post-content" style={{ fontSize: 16 }}>
              {post.content}
            </div>
          </div>

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
                Chưa có bình luận nào.
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
            <div ref={commentsEndRef} />
          </div>
        </div>

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
