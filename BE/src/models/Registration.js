import { DataTypes, Model, QueryTypes, Op } from "sequelize";
import sequelize from "../config/db.js";

class Registration extends Model {
  // =================================================================
  // CÁC HÀM STATIC (SERVICE LAYER)
  // =================================================================

  // Đăng ký tham gia (mới) -> trả về registration_id
  static async create(user_id, event_id) {
    try {
      const newRegistration = await super.create({
        user_id,
        event_id,
        status: "pending",
      });
      return newRegistration.registration_id;
    } catch (error) {
      throw new Error(
        `Database error in create registration: ${error.message}`
      );
    }
  }

  // Hủy đăng ký (Soft cancel -> status = cancelled)
  static async cancel(user_id, event_id) {
    try {
      const [affectedCount] = await super.update(
        { status: "cancelled" },
        {
          where: {
            user_id: user_id,
            event_id: event_id,
            status: {
              [Op.in]: ["pending", "approved"],
            },
          },
        }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(
        `Database error in cancel registration: ${error.message}`
      );
    }
  }

  // Lấy người dùng đăng ký của 1 sự kiện (cho Manager xem danh sách)
  static async getByEventId(event_id) {
    try {
      // Dùng Raw Query để Join bảng User và lấy thông tin phẳng
      const rows = await sequelize.query(
        `SELECT 
            r.registration_id, 
            r.status, 
            r.registration_date, 
            r.rejection_reason,
            u.user_id, 
            u.full_name, 
            u.email, 
            u.phone, 
            u.avatar_url
         FROM Registrations r
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.event_id = ?
         ORDER BY r.registration_date DESC`,
        {
          replacements: [event_id],
          type: QueryTypes.SELECT,
        }
      );
      return rows;
    } catch (error) {
      throw new Error(`Database error in getByEventId: ${error.message}`);
    }
  }

  // Kiểm tra trạng thái đăng ký của User với Event
  static async findOne(user_id, event_id) {
    try {
      const registration = await super.findOne({
        where: { user_id, event_id },
      });
      return registration; // Sequelize trả về object hoặc null, giống logic cũ rows[0]
    } catch (error) {
      throw new Error(
        `Database error in findOne registration: ${error.message}`
      );
    }
  }

  // Lấy danh sách sự kiện user đã đăng ký (Lịch sử)
  static async getHistoryByUserId(user_id) {
    try {
      const rows = await sequelize.query(
        `SELECT 
            r.registration_id, r.status as registration_status, r.registration_date,
            e.event_id, e.title, e.start_date, e.end_date, e.location,
            u.full_name as manager_name
         FROM Registrations r
         JOIN Events e ON r.event_id = e.event_id
         LEFT JOIN Users u ON e.manager_id = u.user_id
         WHERE r.user_id = ?
         ORDER BY r.registration_date DESC`,
        {
          replacements: [user_id],
          type: QueryTypes.SELECT,
        }
      );
      return rows;
    } catch (error) {
      throw new Error(`Database error in getHistoryByUserId: ${error.message}`);
    }
  }

  // Đăng ký lại (Cập nhật trạng thái từ cancelled / rejected -> pending)
  static async reRegister(user_id, event_id) {
    try {
      const [affectedCount] = await super.update(
        {
          status: "pending",
          registration_date: new Date(), // Cập nhật lại thời gian đăng ký
        },
        {
          where: { user_id, event_id },
        }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Database error in reRegister: ${error.message}`);
    }
  }

  // Đếm tổng số lượng đã đăng ký (Pending + Approved)
  static async countRequests(event_id) {
    try {
      const count = await super.count({
        where: {
          event_id: event_id,
          status: {
            [Op.in]: ["pending", "approved"],
          },
        },
      });
      return count;
    } catch (error) {
      throw new Error(`Database error in countRequests: ${error.message}`);
    }
  }

  // Lấy chi tiết đăng ký kèm thông tin Manager & Event (cho việc duyệt)
  static async getDetailById(registration_id) {
    try {
      const rows = await sequelize.query(
        `SELECT 
            r.registration_id, 
            r.status, 
            r.user_id,       
            r.event_id,
            e.title as event_title, 
            e.manager_id,
            e.start_date, 
            e.end_date, 
            e.target_participants, 
            e.current_participants,
            e.is_deleted as event_is_deleted,
            u.full_name as volunteer_name,
            u.email as volunteer_email,
            u.status as user_status
         FROM Registrations r
         JOIN Events e ON r.event_id = e.event_id
         JOIN Users u ON r.user_id = u.user_id
         WHERE r.registration_id = ?`,
        {
          replacements: [registration_id],
          type: QueryTypes.SELECT,
        }
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Database error in getDetailById: ${error.message}`);
    }
  }

  // Duyệt đăng ký
  static async approve(registration_id) {
    try {
      const [affectedCount] = await super.update(
        {
          status: "approved",
          rejection_reason: null,
        },
        { where: { registration_id } }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(
        `Database error in approve registration: ${error.message}`
      );
    }
  }

  // Từ chối đăng ký
  static async reject(registration_id, reason) {
    try {
      const [affectedCount] = await super.update(
        {
          status: "rejected",
          rejection_reason: reason,
        },
        { where: { registration_id } }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(
        `Database error in reject registration: ${error.message}`
      );
    }
  }

  // Đánh dấu hoàn thành
  static async complete(registration_id, manager_id) {
    try {
      const [affectedCount] = await super.update(
        {
          status: "completed",
          completed_by_manager_id: manager_id,
          completion_date: new Date(),
        },
        { where: { registration_id } }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(
        `Database error in complete registration: ${error.message}`
      );
    }
  }
}

// =================================================================
// CẤU HÌNH SCHEMA
// =================================================================
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
    // Map registration_date (trong DB) thành createdAt (trong Sequelize)
    // Nếu muốn giữ nguyên tên trường registration_date khi query model thì:
    registration_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "registration_date",
    },
  },
  {
    sequelize,
    modelName: "Registration",
    tableName: "Registrations",
    timestamps: true,
    createdAt: "registration_date", // Map trường createdAt của Sequelize vào cột registration_date trong DB
    updatedAt: "updated_at",
  }
);

export default Registration;
