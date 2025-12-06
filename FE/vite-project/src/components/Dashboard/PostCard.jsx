import React from "react";
import PostCard from "./PostCard";
import { useSelector } from "react-redux"; // Lấy user hiện tại để hiển thị avatar comment

const ActivityWidget = ({ events }) => {
  const { user } = useSelector((state) => state.auth); // Lấy current user

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
