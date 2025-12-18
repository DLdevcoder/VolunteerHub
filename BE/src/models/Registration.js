import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import User from "./User.js";
import Event from "./Event.js";

class Registration extends Model {}

Registration.init(
  {
    registration_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    event_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "pending",
        "approved",
        "rejected",
        "completed",
        "cancelled"
      ),
      defaultValue: "pending",
      allowNull: false,
    },
    rejection_reason: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    completed_by_manager_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Map registration_date
    registration_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Registration",
    tableName: "Registrations",
    timestamps: true,
    createdAt: "registration_date", 
    updatedAt: "updated_at",
  }
);

Registration.belongsTo(User, { foreignKey: "user_id", as: "user" });
Registration.belongsTo(Event, { foreignKey: "event_id", as: "event" });

export default Registration;