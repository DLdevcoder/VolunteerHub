import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import Post from "./Post.js";

class Comment extends Model {}

Comment.init(
  {
    comment_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    post_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Comment",
    tableName: "Comments",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
Comment.belongsTo(User, { foreignKey: "user_id", as: "user" });
Comment.belongsTo(Post, { foreignKey: "post_id", as: "post" });

export default Comment;