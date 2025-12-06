import React, { useState, useEffect } from "react";
import postApi from "../../apis/postApi";
import PostItem from "./PostItem";
import { useSelector } from "react-redux"; // Lấy user từ Redux store

const EventWall = ({ eventId, eventManagerId }) => {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true); // Kiểm tra còn trang sau không
  const [isError, setIsError] = useState(false);

  // Lấy user hiện tại từ Redux (giả sử bạn lưu ở auth.currentUser)
  const currentUser = useSelector((state) => state.auth.currentUser);

  // 1. Hàm lấy danh sách bài đăng
  const fetchPosts = async (currentPage, isLoadMore = false) => {
    try {
      setLoading(true);
      const res = await postApi.getEventPosts(eventId, currentPage, 5); // Limit 5 bài

      if (res.success) {
        const newPosts = res.data;
        const pagination = res.pagination;

        if (isLoadMore) {
          setPosts((prev) => [...prev, ...newPosts]);
        } else {
          setPosts(newPosts);
        }

        // Kiểm tra xem còn dữ liệu để load tiếp không
        setHasMore(currentPage < pagination.totalPages);
        setIsError(false);
      }
    } catch (error) {
      console.error("Lỗi tải bài đăng:", error);
      // Nếu lỗi 403 (Chưa tham gia/Chưa duyệt) thì hiển thị thông báo
      if (error.response && error.response.status === 403) {
        setIsError(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load lần đầu khi vào trang
  useEffect(() => {
    if (eventId) {
      fetchPosts(1, false);
    }
  }, [eventId]);

  // 2. Xử lý đăng bài
  const handlePostSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      const res = await postApi.createPost(eventId, content);
      if (res.success) {
        // Cách 1: Reload lại list (An toàn nhất)
        // fetchPosts(1, false);

        // Cách 2: Chèn ngay vào đầu list (UX tốt hơn)
        // BE trả về: data: { post: newPost }
        setPosts((prev) => [res.data.post, ...prev]);

        setContent(""); // Reset ô nhập
      }
    } catch (error) {
      alert(error.response?.data?.message || "Không thể đăng bài");
    }
  };

  // 3. Xử lý xóa bài
  const handleDelete = async (postId) => {
    if (!window.confirm("Bạn chắc chắn muốn xóa bài này?")) return;

    try {
      const res = await postApi.deletePost(postId);
      if (res.success) {
        // Xóa khỏi state FE
        setPosts((prev) => prev.filter((p) => p.post_id !== postId));
      }
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi xóa");
    }
  };

  // 4. Xử lý Load More
  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  };

  // --- GIAO DIỆN ---

  if (isError) {
    return (
      <div className="bg-gray-50 p-4 rounded text-center text-gray-500 italic">
        Kênh trao đổi chỉ dành cho thành viên đã được duyệt tham gia sự kiện.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-6 rounded-xl shadow-inner">
      <h3 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">
        Kênh trao đổi
      </h3>

      {/* Form đăng bài */}
      <form onSubmit={handlePostSubmit} className="mb-6 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Bạn muốn chia sẻ điều gì về sự kiện này?"
          className="w-full p-3 pr-12 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none transition-all h-24"
          maxLength={2000}
        />
        <button
          type="submit"
          disabled={!content.trim() || loading}
          className={`absolute bottom-3 right-3 px-4 py-1.5 rounded-md text-sm font-medium text-white transition-all
            ${
              !content.trim()
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 shadow-md active:transform active:scale-95"
            }`}
        >
          Gửi
        </button>
      </form>

      {/* Danh sách bài đăng */}
      <div className="space-y-4">
        {posts.length === 0 && !loading ? (
          <p className="text-center text-gray-500 py-4">
            Chưa có bài đăng nào. Hãy là người đầu tiên!
          </p>
        ) : (
          posts.map((post) => (
            <PostItem
              key={post.post_id}
              post={post}
              currentUserId={currentUser?.user_id}
              eventManagerId={eventManagerId}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* Nút Xem thêm */}
      {hasMore && posts.length > 0 && (
        <div className="text-center mt-4">
          <button
            onClick={handleLoadMore}
            disabled={loading}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
          >
            {loading ? "Đang tải..." : "Xem các bài cũ hơn"}
          </button>
        </div>
      )}
    </div>
  );
};

export default EventWall;
