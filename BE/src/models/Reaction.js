import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js"; 

class PostReaction extends Model {}

PostReaction.init(
  {
    user_id: { type: DataTypes.INTEGER, primaryKey: true },
    post_id: { type: DataTypes.INTEGER, primaryKey: true },
    reaction_type: {
      type: DataTypes.ENUM("like", "love", "haha", "sad", "angry"),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "PostReaction",
    tableName: "PostReactions",
    timestamps: false,
  }
);
PostReaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

class CommentReaction extends Model {}

CommentReaction.init(
  {
    user_id: { type: DataTypes.INTEGER, primaryKey: true },
    comment_id: { type: DataTypes.INTEGER, primaryKey: true },
    reaction_type: {
      type: DataTypes.ENUM("like", "love", "haha", "sad", "angry"),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "CommentReaction",
    tableName: "CommentReactions",
    timestamps: false,
  }
);

CommentReaction.belongsTo(User, { foreignKey: "user_id", as: "user" });

export { PostReaction, CommentReaction };