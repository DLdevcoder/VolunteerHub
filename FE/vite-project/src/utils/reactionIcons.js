import React from "react";

// Định nghĩa màu sắc và icon cho từng loại cảm xúc
export const REACTION_TYPES = {
  like: { label: "Thích", icon: "👍", color: "#1877f2" },
  love: { label: "Yêu thích", icon: "❤️", color: "#f25268" },
  haha: { label: "Haha", icon: "😆", color: "#f7b125" },
  sad: { label: "Buồn", icon: "😢", color: "#f7b125" },
  angry: { label: "Phẫn nộ", icon: "😡", color: "#e4605a" },
};

// Hàm lấy icon hiển thị
export const getReactionIcon = (type) => {
  return REACTION_TYPES[type] ? REACTION_TYPES[type].icon : null;
};

// Hàm lấy màu sắc
export const getReactionColor = (type) => {
  return REACTION_TYPES[type] ? REACTION_TYPES[type].color : "#65676b";
};

// Hàm lấy nhãn
export const getReactionLabel = (type) => {
  return REACTION_TYPES[type] ? REACTION_TYPES[type].label : "Thích";
};
