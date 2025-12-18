import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";

// Import các Model liên quan để tạo quan hệ
import User from "./User.js";
import Category from "./Category.js";

class Event extends Model {}

Event.init(
  {
    event_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    target_participants: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    current_participants: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    end_date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    manager_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    approval_status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
    rejection_reason: {
      type: DataTypes.STRING(255),
    },
    approved_by: {
      type: DataTypes.INTEGER,
    },
    approval_date: {
      type: DataTypes.DATE,
    },
    is_deleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Event",
    tableName: "Events",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);

Event.belongsTo(User, { foreignKey: "manager_id", as: "manager" });
Event.belongsTo(Category, { foreignKey: "category_id", as: "category" });

export default Event;