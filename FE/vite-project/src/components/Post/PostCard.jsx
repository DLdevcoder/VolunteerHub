import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Avatar,
  Spin,
  message,
  Modal,
  Popover,
  Button,
} from "antd";
import {
  UserOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { AiOutlineLike } from "react-icons/ai";
import { FaRegCommentAlt, FaGlobeAmericas } from "react-icons/fa";

import postApi from "../../../apis/postApi";
import {
  REACTION_TYPES,
  REACTION_ICONS,
  getReactionIcon,
  getReactionColor,
  getReactionLabel,
} from "../../utils/reactionIcons";
import ReactionModal from "./ReactionModal";
import "./post.css";

// --- 1. LOGIC FORMAT THỜI GIAN (Dùng chung cho Post và Comment) ---
const formatPostTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return "Vừa xong";
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút trước`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} giờ trước`;
  }

  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hoursStr = date.getHours().toString().padStart(2, "0");
  const minutesStr = date.getMinutes().toString().padStart(2, "0");
  const currentYear = now.getFullYear();

  let timeStr = `${day} tháng ${month} lúc ${hoursStr}:${minutesStr}`;
  if (year !== currentYear) {
    timeStr = `${day} tháng ${month}, ${year} lúc ${hoursStr}:${minutesStr}`;
  }

  return timeStr;
};

// --- 2. COMPONENT CON: ITEM BÌNH LUẬN (Xử lý riêng logic Xem thêm/Thu gọn cho từng cmt) ---
const CommentItem = ({ cmt }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const CHARACTER_LIMIT = 200; // Giới hạn ký tự cho comment

  const renderCommentContent = () => {
    const content = cmt.content || "";

    if (content.length <= CHARACTER_LIMIT) {
      return <span className="comment-text-content">{content}</span>;
    }

    if (isExpanded) {
      return (
        <span className="comment-text-content">
          {content}{" "}
          <span
            onClick={() => setIsExpanded(false)}
            style={{ fontWeight: 600, cursor: "pointer", color: "#65676b", marginLeft: 5 }}
          >
            Thu gọn
          </span>
        </span>
      );
    }

    const shortContent = content.substring(0, CHARACTER_LIMIT);
    return (
      <span className="comment-text-content">
        {shortContent}...{" "}
        <span
          onClick={() => setIsExpanded(true)}
          style={{ fontWeight: 600, cursor: "pointer", color: "#65676b", marginLeft: 5 }}
        >
          Xem thêm
        </span>
      </span>
    );
  };

  return (
    <div className="comment-item">
      <Avatar
        src={cmt.avatar_url}
        icon={<UserOutlined />}
        size={32}
        style={{ marginTop: 4 }}
      />
      <div className="comment-bubble">
        <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap" }}>
          <Link to="#" className="comment-username" style={{ marginRight: 8 }}>
            {cmt.full_name}
          </Link>
          {/* Hiển thị thời gian comment ngay cạnh tên */}
          <span style={{ fontSize: 11, color: "#65676b" }}>
            {formatPostTime(cmt.created_at)}
          </span>
        </div>
        
        {renderCommentContent()}
      </div>
    </div>
  );
};

// --- 3. COMPONENT CHÍNH: POST CARD ---
const PostCard = ({ post, currentUser }) => {
  const [currentReaction, setCurrentReaction] = useState(post.current_reaction || null);
  const [reactionCount, setReactionCount] = useState(parseInt(post.like_count) || 0);
  const [reactionStats, setReactionStats] = useState(post.reaction_stats || {});

  const [isReactionModalOpen, setIsReactionModalOpen] = useState(false);
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  
  // State Xem thêm/Thu gọn cho nội dung bài viết chính
  const [isExpanded, setIsExpanded] = useState(false);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (isCommentModalOpen && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [comments, isCommentModalOpen]);

  // --- LOGIC REACTION ---
  const handleReaction = async (type) => {
    const oldReaction = currentReaction;
    const newStats = { ...reactionStats };

    if (currentReaction === type) {
      setCurrentReaction(null);
      setReactionCount((prev) => Math.max(0, prev - 1));
      if (newStats[type]) newStats[type]--;
    } else {
      setCurrentReaction(type);
      if (!oldReaction) {
        setReactionCount((prev) => prev + 1);
      } else {
        if (newStats[oldReaction]) newStats[oldReaction]--;
      }
      newStats[type] = (newStats[type] || 0) + 1;
    }

    Object.keys(newStats).forEach((k) => {
      if (newStats[k] <= 0) delete newStats[k];
    });
    setReactionStats(newStats);

    try {
      await postApi.toggleReaction(post.post_id, type);
    } catch (e) {
      // Revert if error
    }
  };

  const getTopReactions = () => {
    let types = Object.keys(reactionStats).filter((type) => reactionStats[type] > 0);
    if (types.length === 0 && reactionCount > 0) {
      types = [currentReaction || "like"];
    }
    return types.slice(0, 3);
  };
  const topReactions = getTopReactions();

  // --- LOGIC COMMENT ---
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
        const newComment = res.data.comment || res.data;
        // Giả lập thêm created_at nếu API trả về thiếu, để hiển thị ngay lập tức là "Vừa xong"
        if (!newComment.created_at) newComment.created_at = new Date().toISOString();
        
        setComments((prev) => [...prev, newComment]);
        setCommentText("");
      }
    } catch {
      message.error("Lỗi gửi bình luận");
    }
  };

  const totalComments = commentsLoaded ? comments.length : parseInt(post.comment_count) || 0;

  // --- COMPONENTS CON ---
  const PostHeader = () => (
    <div className="post-header">
      <Link to="#">
        <Avatar
          src={post.avatar_url}
          size={40}
          icon={<UserOutlined />}
          className="post-avatar-img"
        />
      </Link>
      <div className="post-info">
        <span className="post-author-name">{post.full_name}</span>
        <span className="post-time">
          {formatPostTime(post.created_at)} · <FaGlobeAmericas size={12} />
        </span>
      </div>
    </div>
  );

  const ReactionMenu = (
    <div style={{ display: "flex", gap: 8, padding: "4px" }}>
      {Object.keys(REACTION_TYPES).map((type) => {
        const Icon = REACTION_ICONS[type];
        return (
          <div
            key={type}
            onClick={(e) => {
              e.stopPropagation();
              handleReaction(type);
            }}
            className="reaction-icon-hover"
            style={{ cursor: "pointer", transition: "transform 0.2s" }}
          >
            <Icon size={24} color={getReactionColor(type)} />
          </div>
        );
      })}
    </div>
  );

  const ActionBar = ({ isInModal = false }) => (
    <div className={isInModal ? "modal-actions-bar" : "post-actions-bar"}>
      <Popover content={ReactionMenu} trigger="hover" overlayClassName="reaction-popover">
        <div
          className={`action-button ${currentReaction ? "active" : ""}`}
          onClick={() => handleReaction(currentReaction || "like")}
        >
          {currentReaction ? getReactionIcon(currentReaction) : <AiOutlineLike size={20} />}
          <span>{getReactionLabel(currentReaction)}</span>
        </div>
      </Popover>

      <div className={`action-button ${isInModal ? "disabled" : ""}`} onClick={!isInModal ? openCommentModal : undefined}>
        <FaRegCommentAlt size={18} /> <span>Bình luận</span>
      </div>
    </div>
  );

  const renderStatsBar = () => (
    <div className="post-stats-bar">
      <div className="reaction-summary" onClick={() => setIsReactionModalOpen(true)}>
        {reactionCount > 0 && (
          <>
            <div className="reaction-icons-stack">
              {topReactions.map((type, index) => {
                const IconComp = REACTION_ICONS[type];
                return IconComp ? (
                  <div key={type} className="reaction-icon-stack-item" style={{ zIndex: 3 - index }}>
                    <IconComp size={10} color={getReactionColor(type)} />
                  </div>
                ) : null;
              })}
            </div>
            <span className="reaction-count-text">{reactionCount}</span>
          </>
        )}
      </div>

      <div className="post-stats-right">
        {totalComments > 0 && <span onClick={openCommentModal}>{totalComments} bình luận</span>}
      </div>
    </div>
  );

  // Render nội dung bài viết (Main Post)
  const renderPostContent = () => {
    const content = post.content || "";
    const CHARACTER_LIMIT = 200;

    if (content.length <= CHARACTER_LIMIT) {
      return <div className="post-content-text">{content}</div>;
    }

    if (isExpanded) {
      return (
        <div className="post-content-text">
          {content}{" "}
          <span
            onClick={() => setIsExpanded(false)}
            style={{ fontWeight: 600, cursor: "pointer", color: "#65676b", marginLeft: 5 }}
          >
            Thu gọn
          </span>
        </div>
      );
    }

    const shortContent = content.substring(0, CHARACTER_LIMIT);
    return (
      <div className="post-content-text">
        {shortContent}...{" "}
        <span
          onClick={() => setIsExpanded(true)}
          style={{ fontWeight: 600, cursor: "pointer", color: "#65676b", marginLeft: 5 }}
        >
          Xem thêm
        </span>
      </div>
    );
  };

  return (
    <>
      {/* ================= CARD BÀI VIẾT ================= */}
      <div className="fb-card">
        <PostHeader />
        
        {renderPostContent()}

        {renderStatsBar()}
        <ActionBar />
      </div>

      {/* ================= MODAL 1: REACTION LIST ================= */}
      <ReactionModal
        postId={post.post_id}
        open={isReactionModalOpen}
        onClose={() => setIsReactionModalOpen(false)}
        stats={reactionStats}
        totalCount={reactionCount}
      />

      {/* ================= MODAL 2: COMMENT (FULL FEATURES) ================= */}
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
        styles={{
          body: { padding: 0, height: "70vh", display: "flex", flexDirection: "column" },
        }}
      >
        <div className="fb-post-modal-scroll">
          {/* Nội dung bài gốc trong Modal luôn full */}
          <div className="modal-post-body">
            <PostHeader />
            <div className="post-content-text" style={{ fontSize: 16 }}>
              {post.content}
            </div>
          </div>

          {renderStatsBar()}
          <ActionBar isInModal={true} />

          {/* Danh sách Comment */}
          <div className="modal-comment-list">
            {commentsLoading && (
              <div style={{ textAlign: "center", padding: 20 }}>
                <Spin />
              </div>
            )}

            {!commentsLoading && comments.length === 0 && (
              <div style={{ textAlign: "center", color: "#65676b", padding: 20 }}>
                Chưa có bình luận nào.
              </div>
            )}

            {/* Sử dụng Component CommentItem thay vì render trực tiếp */}
            {comments.map((cmt) => (
              <CommentItem key={cmt.comment_id} cmt={cmt} />
            ))}
            <div ref={commentsEndRef} />
          </div>
        </div>

        {/* Footer Input */}
        <div className="fb-post-modal-footer">
          <div className="comment-input-area">
            <Avatar src={currentUser?.avatar_url} icon={<UserOutlined />} size={32} />
            <div className="comment-input-pill" style={{ width: "100%" }}>
              <input
                className="comment-input-real"
                placeholder="Viết bình luận công khai..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
              />
              <Button
                type="text"
                icon={<SendOutlined style={{ color: commentText.trim() ? "#1877f2" : "#ccc" }} />}
                onClick={handleSendComment}
              />
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default PostCard;