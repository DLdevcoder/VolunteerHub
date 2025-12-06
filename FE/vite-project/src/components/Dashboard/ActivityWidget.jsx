import React from "react";
import PostCard from "./PostCard";
import { useSelector } from "react-redux";

const ActivityWidget = ({ events }) => {
  // Lấy thông tin user hiện tại từ Redux để hiển thị Avatar khi comment
  const { user } = useSelector((state) => state.auth);

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
        <PostCard key={post.post_id} post={post} currentUser={user} />
      ))}
    </div>
  );
};

export default ActivityWidget;
