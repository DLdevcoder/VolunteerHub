import React, { useState } from "react";
import { Card, Input, Button, Avatar, message } from "antd";
import { SendOutlined, UserOutlined } from "@ant-design/icons";
import { useDispatch, useSelector } from "react-redux";
import { createPostThunk } from "../../redux/slices/postSlice";

const { TextArea } = Input;

const CreatePostWidget = ({ eventId }) => {
  const [content, setContent] = useState("");
  const dispatch = useDispatch();

  // Lấy thông tin user hiện tại để hiện Avatar
  const { user } = useSelector((state) => state.auth);
  const { createLoading } = useSelector((state) => state.posts);

  const handleSubmit = async () => {
    if (!content.trim()) return;

    // Dispatch action tạo bài viết
    const result = await dispatch(
      createPostThunk({
        event_id: eventId,
        content: content,
      })
    );

    if (createPostThunk.fulfilled.match(result)) {
      message.success("Đăng bài thành công!");
      setContent(""); // Reset ô nhập
    } else {
      message.error(
        "Đăng bài thất bại: " + (result.payload?.message || "Lỗi server")
      );
    }
  };

  return (
    <Card className="mb-4 shadow-sm" style={{ borderRadius: 8 }}>
      <div style={{ display: "flex", gap: 12 }}>
        <Avatar src={user?.avatar_url} icon={<UserOutlined />} size="large" />
        <div style={{ flex: 1 }}>
          <TextArea
            placeholder="Chia sẻ suy nghĩ hoặc câu hỏi của bạn về sự kiện này..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{ marginBottom: 12, borderRadius: 8 }}
          />
          <div style={{ textAlign: "right" }}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSubmit}
              loading={createLoading}
              disabled={!content.trim()}
            >
              Đăng bài
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default CreatePostWidget;
