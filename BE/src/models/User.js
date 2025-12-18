import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.js";
import Role from "./Role.js";

class User extends Model {}

User.init(
  {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    avatar_url: {
      type: DataTypes.STRING(255),
    },
    phone: {
      type: DataTypes.STRING(20),
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    role_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("Active", "Locked", "Suspended"),
      defaultValue: "Active",
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "Users",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  }
);
User.belongsTo(Role, { foreignKey: "role_id", as: "role" });

export default User;
