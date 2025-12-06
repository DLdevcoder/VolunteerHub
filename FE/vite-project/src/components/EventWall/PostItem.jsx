import React from "react";
import { formatDate } from "../../utils/formatDate"; // Hàm format ngày giờ (tự viết)

const PostItem = ({ post, currentUserId, eventManagerId, onDelete }) => {
  // Logic check quyền xoá giống BE:
  // 1. Là tác giả bài viết
  // 2. Là Manager của sự kiện này
  const canDelete =
    currentUserId === post.user_id || currentUserId === eventManagerId;

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        {/* Header: Avatar + Tên + Ngày */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
            {post.full_name ? post.full_name.charAt(0) : "U"}
          </div>
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">
              {post.full_name}
              {post.user_id === eventManagerId && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded-full">
                  Quản lý
                </span>
              )}
            </h4>
            <span className="text-xs text-gray-500">
              {formatDate(post.created_at)}
            </span>
          </div>
        </div>

        {/* Nút xóa */}
        {canDelete && (
          <button
            onClick={() => onDelete(post.post_id)}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
            title="Xóa bài viết"
          >
            <i className="fas fa-trash-alt"></i> {/* Nếu dùng FontAwesome */}
            <span className="sr-only">Xóa</span>
          </button>
        )}
      </div>

      {/* Nội dung bài viết */}
      <div className="mt-3 text-gray-700 whitespace-pre-wrap break-words text-sm leading-relaxed">
        {post.content}
      </div>
    </div>
  );
};

export default PostItem;
