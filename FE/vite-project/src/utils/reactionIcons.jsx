import React from "react";
import {
  FaThumbsUp,
  FaHeart,
  FaLaughSquint,
  FaSurprise,
  FaSadTear,
  FaAngry,
} from "react-icons/fa";

// Export Component để dùng động
export const REACTION_ICONS = {
  like: FaThumbsUp,
  love: FaHeart,
  haha: FaLaughSquint,
  wow: FaSurprise,
  sad: FaSadTear,
  angry: FaAngry,
};

export const getReactionColor = (type) => {
  switch (type) {
    case "like":
      return "#1877f2";
    case "love":
      return "#f02849";
    case "haha":
    case "wow":
    case "sad":
      return "#f7b928";
    case "angry":
      return "#e41e26";
    default:
      return "#65676b";
  }
};

export const REACTION_TYPES = {
  like: {
    label: "Thích",
    icon: <FaThumbsUp size={20} color={getReactionColor("like")} />,
  },
  love: {
    label: "Yêu thích",
    icon: <FaHeart size={20} color={getReactionColor("love")} />,
  },
  haha: {
    label: "Haha",
    icon: <FaLaughSquint size={20} color={getReactionColor("haha")} />,
  },
  wow: {
    label: "Wow",
    icon: <FaSurprise size={20} color={getReactionColor("wow")} />,
  },
  sad: {
    label: "Buồn",
    icon: <FaSadTear size={20} color={getReactionColor("sad")} />,
  },
  angry: {
    label: "Phẫn nộ",
    icon: <FaAngry size={20} color={getReactionColor("angry")} />,
  },
};

export const getReactionIcon = (type) => {
  if (!type || !REACTION_TYPES[type]) return null;
  return REACTION_TYPES[type].icon;
};

export const getReactionLabel = (type) => {
  return REACTION_TYPES[type]?.label || "Thích";
};
