import React, { useEffect, useState } from "react";
import { Modal, Tabs, List, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import postApi from "../../../apis/postApi";
import { REACTION_TYPES, getReactionIcon } from "../../utils/reactionIcons";

const ReactionModal = ({ postId, open, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ reactions: [], summary: {} });
  const [activeTab, setActiveTab] = useState("all");

  // Load dữ liệu khi mở modal hoặc đổi tab
  useEffect(() => {
    if (open && postId) {
      fetchReactions();
    }
  }, [open, postId, activeTab]);

  const fetchReactions = async () => {
    try {
      setLoading(true);
      // Gọi API lấy danh sách react
      // API Backend: GET /api/reactions/posts/:post_id?type=all (hoặc like, love...)
      const res = await postApi.getPostReactions(
        postId,
        activeTab === "all" ? null : activeTab
      );
      if (res.success) {
        setData({
          reactions: res.data || [],
          summary: res.summary || { all: 0 },
        });
      }
    } catch (error) {
      console.error("Lỗi tải reaction:", error);
    } finally {
      setLoading(false);
    }
  };

  // Tạo danh sách Tab (Tất cả + Các loại có số lượng > 0)
  const tabItems = [
    { key: "all", label: `Tất cả (${data.summary.all || 0})` },
    ...Object.keys(REACTION_TYPES)
      .map((type) => {
        const count = data.summary[type] || 0;
        if (count > 0) {
          return {
            key: type,
            label: (
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {getReactionIcon(type)} {count}
              </span>
            ),
          };
        }
        return null;
      })
      .filter(Boolean),
  ];

  return (
    <Modal
      title="Cảm xúc về bài viết"
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      bodyStyle={{ maxHeight: "60vh", overflowY: "auto" }}
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems.map((item) => ({
          key: item.key,
          label: item.label,
          children: (
            <div style={{ minHeight: 200 }}>
              {loading ? (
                <div style={{ textAlign: "center", padding: 20 }}>
                  <Spin />
                </div>
              ) : (
                <List
                  dataSource={data.reactions}
                  renderItem={(item) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <div style={{ position: "relative" }}>
                            <Avatar
                              src={item.avatar_url}
                              icon={<UserOutlined />}
                            />
                            <div
                              style={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                fontSize: 12,
                                background: "#fff",
                                borderRadius: "50%",
                              }}
                            >
                              {getReactionIcon(item.reaction_type)}
                            </div>
                          </div>
                        }
                        title={
                          <span style={{ fontWeight: 600 }}>
                            {item.full_name}
                          </span>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>
          ),
        }))}
      />
    </Modal>
  );
};

export default ReactionModal;
