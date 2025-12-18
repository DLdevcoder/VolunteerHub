import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import Event from "./Event.js";
class Post extends Model {}

Post.init(
  {
    post_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    event_id: {
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
    modelName: "Post",
    tableName: "Posts",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Post.belongsTo(User, { foreignKey: "user_id", as: "user" });
Post.belongsTo(Event, { foreignKey: "event_id", as: "event" });

export default Post;