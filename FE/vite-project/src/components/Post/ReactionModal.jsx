import React, { useEffect, useState } from "react";
import { Modal, Tabs, List, Avatar, Spin } from "antd";
import { UserOutlined } from "@ant-design/icons";
import postApi from "../../../apis/postApi";
import {
  REACTION_ICONS,
  REACTION_TYPES,
  getReactionColor,
} from "../../utils/reactionIcons";

const ReactionModal = ({
  postId,
  open,
  onClose,
  stats = {},
  totalCount = 0,
}) => {
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    if (open) {
      fetchReactions(activeTab);
    } else {
      setUsers([]);
    }
  }, [open, activeTab, postId]);

  const fetchReactions = async (type) => {
    setLoading(true);
    try {
      const apiType = type === "all" ? null : type;
      const res = await postApi.getPostReactions(postId, apiType);
      if (res.success) setUsers(res.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper render Tab Label có số lượng
  const renderTabLabel = (type, icon) => {
    // Nếu type='all' thì dùng totalCount, nếu không thì lấy từ object stats
    const count = type === "all" ? totalCount : stats[type] || 0;

    // Nếu count = 0 thì không hiện số (hoặc ẩn luôn tab nếu muốn giống FB tuyệt đối)
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {icon}
        <span
          style={{ fontSize: 14, fontWeight: activeTab === type ? 600 : 400 }}
        >
          {count > 0 ? count : ""}
        </span>
      </div>
    );
  };

  const tabItems = [
    {
      key: "all",
      label: (
        <span style={{ fontWeight: 600 }}>
          Tất cả {totalCount > 0 ? totalCount : ""}
        </span>
      ),
    },
    ...Object.keys(REACTION_TYPES).map((type) => {
      // Chỉ hiện tab nếu có lượt thả (hoặc luôn hiện cũng được)
      const IconComp = REACTION_ICONS[type];
      return {
        key: type,
        label: (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <IconComp size={20} color={getReactionColor(type)} />
            <span
              style={{
                fontSize: 13,
                color: activeTab === type ? "#1877f2" : "#65676b",
              }}
            >
              {stats[type] > 0 ? stats[type] : ""}
            </span>
          </div>
        ),
      };
    }),
  ];

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={500}
      styles={{
        body: {
          padding: 0,
          height: 450,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <div style={{ padding: "0 16px", borderBottom: "1px solid #f0f0f0" }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems.map((item) => ({ ...item, children: null }))}
        />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px 16px" }}>
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 50 }}>
            <Spin />
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: "center", paddingTop: 50, color: "#999" }}>
            Chưa có ai.
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={users}
            renderItem={(user) => (
              <List.Item style={{ borderBottom: "none", padding: "10px 0" }}>
                <List.Item.Meta
                  avatar={
                    <div
                      style={{ position: "relative", display: "inline-block" }}
                    >
                      <Avatar
                        src={user.avatar_url}
                        icon={<UserOutlined />}
                        size={40}
                      />
                      {user.reaction_type &&
                        REACTION_ICONS[user.reaction_type] &&
                        (() => {
                          const SmallIcon = REACTION_ICONS[user.reaction_type];
                          return (
                            <div
                              style={{
                                position: "absolute",
                                bottom: -2,
                                right: -2,
                                background: "#fff",
                                borderRadius: "50%",
                                padding: 2,
                                display: "flex",
                                boxShadow: "0 0 0 2px #fff",
                              }}
                            >
                              <SmallIcon
                                size={12}
                                color={getReactionColor(user.reaction_type)}
                              />
                            </div>
                          );
                        })()}
                    </div>
                  }
                  title={
                    <span style={{ fontWeight: 600 }}>{user.full_name}</span>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </Modal>
  );
};

export default ReactionModal;
