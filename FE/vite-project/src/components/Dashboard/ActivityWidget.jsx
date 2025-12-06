// src/components/Dashboard/ActivityWidget.jsx
import React from "react";
import { Link } from "react-router-dom";
// Import Icons
import { FaGlobeAmericas, FaRegCommentAlt, FaShare } from "react-icons/fa";
import { AiOutlineLike, AiFillLike } from "react-icons/ai";
import { MdOutlineMoreHoriz } from "react-icons/md";

// Hàm xử lý thời gian (Giữ nguyên)
const timeAgo = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " năm trước";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " tháng trước";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " ngày trước";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " giờ";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " phút";
  return "Vừa xong";
};

const stringToColor = (string) => {
  if (!string) return "#ccc";
  const colors = ["#1877f2", "#42b72a", "#f7b928", "#fa383e", "#a333c8"];
  let hash = 0;
  for (let i = 0; i < string.length; i++) {
    hash = string.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const ActivityWidget = ({ events }) => {
  if (!events || events.length === 0) {
    return (
      <div
        className="fb-post-card"
        style={{ padding: "40px", textAlign: "center", color: "#65676b" }}
      >
        <p>Hiện chưa có bài đăng nào mới.</p>
      </div>
    );
  }

  return (
    <div>
      {events.map((post) => (
        <div key={post.post_id} className="fb-post-card">
          {/* Header */}
          <div className="post-header">
            <Link to="#" style={{ textDecoration: "none" }}>
              {post.avatar_url ? (
                <img
                  src={post.avatar_url}
                  alt="Avatar"
                  className="post-avatar-img"
                />
              ) : (
                <div
                  className="post-avatar-img"
                  style={{
                    backgroundColor: stringToColor(post.full_name),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                  }}
                >
                  {post.full_name?.charAt(0).toUpperCase()}
                </div>
              )}
            </Link>

            <div className="post-info" style={{ flex: 1 }}>
              <span className="post-author">
                {post.full_name}
                <span
                  style={{
                    fontWeight: "normal",
                    color: "#65676b",
                    margin: "0 6px",
                  }}
                >
                  ▶
                </span>
                <Link
                  to={`/events/${post.event_id}`}
                  className="post-event-link"
                >
                  {post.title}
                </Link>
              </span>
              <span className="post-meta">
                {timeAgo(post.latest_post_time)} ·{" "}
                <FaGlobeAmericas size={12} style={{ marginLeft: 4 }} />
              </span>
            </div>

            {/* Menu 3 chấm (Trang trí) */}
            <div style={{ color: "#65676b", cursor: "pointer" }}>
              <MdOutlineMoreHoriz size={24} />
            </div>
          </div>

          {/* Content */}
          <div className="post-content">{post.content}</div>

          {/* Stats (Số like/cmt ảo để giống FB) */}
          <div className="post-stats">
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div
                style={{
                  background: "#1877f2",
                  borderRadius: "50%",
                  padding: 2,
                  display: "flex",
                }}
              >
                <AiFillLike color="white" size={10} />
              </div>
              <span>12</span>
            </div>
            <div>3 bình luận</div>
          </div>

          {/* Footer Actions */}
          <div className="post-footer">
            <div className="post-action">
              <AiOutlineLike size={20} />
              <span>Thích</span>
            </div>
            <div className="post-action">
              <FaRegCommentAlt size={18} />
              <span>Bình luận</span>
            </div>
            <Link to={`/events/${post.event_id}`} className="post-action">
              <FaShare size={18} />
              <span>Xem chi tiết</span>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityWidget;
