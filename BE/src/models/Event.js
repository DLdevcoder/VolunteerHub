import { DataTypes, Model, QueryTypes } from "sequelize";
import sequelize from "../config/db.js";

class Event extends Model {
  // =================================================================
  // CÁC HÀM STATIC (SERVICE LAYER)
  // =================================================================

  // Tạo sự kiện mới
  static async createEvent(eventData) {
    try {
      const newEvent = await super.create({
        title: eventData.title,
        description: eventData.description,
        target_participants: eventData.target_participants,
        start_date: eventData.start_date,
        end_date: eventData.end_date,
        location: eventData.location,
        manager_id: eventData.manager_id,
        category_id: eventData.category_id,
        // current_participants mặc định là 0 (định nghĩa ở init)
      });
      return newEvent.event_id;
    } catch (error) {
      throw new Error(`Database error in createEvent: ${error.message}`);
    }
  }

  // Kiểm tra sự kiện trùng lặp
  static async checkDuplicate(title, start_date, location) {
    try {
      const event = await super.findOne({
        where: {
          title: title,
          start_date: start_date,
          location: location,
          is_deleted: false,
        },
        attributes: ["event_id"],
      });
      return !!event;
    } catch (error) {
      throw new Error(`Database error in checkDuplicate: ${error.message}`);
    }
  }

  // Lấy tất cả danh mục sự kiện
  static async getAllCategories() {
    try {
      // Dùng raw query vì chưa có file Model Category ở đây,
      // và để đảm bảo thứ tự display_order
      const categories = await sequelize.query(
        "SELECT * FROM Categories ORDER BY display_order ASC",
        { type: QueryTypes.SELECT }
      );
      return categories;
    } catch (error) {
      throw new Error(`Database error in getAllCategories: ${error.message}`);
    }
  }

  // Lấy sự kiện theo ID
  static async getEventById(event_id) {
    try {
      const events = await sequelize.query(
        `SELECT 
            e.event_id, e.title, e.description, e.target_participants, 
            e.current_participants, e.start_date, e.end_date, e.location, 
            e.category_id, e.created_at, e.approval_status,
            e.rejection_reason, e.manager_id,
            c.name as category_name, 
            u.full_name as manager_name 
          FROM Events e
          LEFT JOIN Categories c ON e.category_id = c.category_id
          LEFT JOIN Users u ON e.manager_id = u.user_id
          WHERE e.event_id = ? AND e.is_deleted = FALSE`,
        {
          replacements: [event_id],
          type: QueryTypes.SELECT,
        }
      );
      return events[0] || null;
    } catch (error) {
      throw new Error(`Database error in getEventById: ${error.message}`);
    }
  }

  // Lấy danh sách sự kiện với lọc và phân trang (Admin/Manager Dashboard)
  static async getAllEvents(filters = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        approval_status,
        category_id,
        manager_id,
        search,
        start_date_from,
        start_date_to,
        sort_by = "created_at",
        sort_order = "DESC",
        is_deleted,
      } = filters;

      const offset = (Number(page) - 1) * Number(limit);

      let whereConditions = [];
      let replacements = {};

      if (is_deleted === true || is_deleted === "true") {
        whereConditions.push("e.is_deleted = TRUE");
      } else {
        whereConditions.push("e.is_deleted = FALSE");
      }

      if (approval_status) {
        whereConditions.push("e.approval_status = :approval_status");
        replacements.approval_status = approval_status;
      }
      if (category_id) {
        whereConditions.push("e.category_id = :category_id");
        replacements.category_id = category_id;
      }
      if (manager_id) {
        whereConditions.push("e.manager_id = :manager_id");
        replacements.manager_id = manager_id;
      }
      if (search) {
        whereConditions.push(
          "(e.title LIKE :search OR e.description LIKE :search)"
        );
        replacements.search = `%${search}%`;
      }
      if (start_date_from) {
        whereConditions.push("e.start_date >= :start_date_from");
        replacements.start_date_from = start_date_from;
      }
      if (start_date_to) {
        whereConditions.push("e.start_date <= :start_date_to");
        replacements.start_date_to = start_date_to;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Validate sort field
      const validSortFields = [
        "created_at",
        "start_date",
        "end_date",
        "title",
        "current_participants",
      ];
      const safeSortBy = validSortFields.includes(sort_by)
        ? sort_by
        : "created_at";
      const safeSortOrder = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

      // 1. Đếm tổng
      const countResult = await sequelize.query(
        `SELECT COUNT(*) as total FROM Events e ${whereClause}`,
        {
          replacements: replacements,
          type: QueryTypes.SELECT,
        }
      );
      const total = countResult[0]?.total || 0;

      // 2. Lấy dữ liệu
      const events = await sequelize.query(
        `SELECT e.*, c.name as category_name, u.full_name as manager_name, u.email as manager_email,
                approver.full_name as approved_by_name
         FROM Events e
         LEFT JOIN Categories c ON e.category_id = c.category_id
         LEFT JOIN Users u ON e.manager_id = u.user_id
         LEFT JOIN Users approver ON e.approved_by = approver.user_id
         ${whereClause}
         ORDER BY e.${safeSortBy} ${safeSortOrder}
         LIMIT :limit OFFSET :offset`,
        {
          replacements: {
            ...replacements,
            limit: Number(limit),
            offset: offset,
          },
          type: QueryTypes.SELECT,
        }
      );

      return {
        events,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Database error in getAllEvents: ${error.message}`);
    }
  }

  // Lấy danh sách sự kiện đang hoạt động (Cho Volunteer - Homepage)
  static async getActiveEvents(filters = {}, userId = null) {
    try {
      let {
        page = 1,
        limit = 10,
        category_id,
        search,
        start_date_from,
        start_date_to,
      } = filters;

      page = Math.max(1, Number(page) || 1);
      limit = Math.min(100, Math.max(1, Number(limit) || 10));
      const offset = (page - 1) * limit;

      // Điều kiện cứng
      const whereConditions = [
        "e.is_deleted = FALSE",
        "e.approval_status = 'approved'",
        "e.end_date >= NOW()",
      ];

      // Chúng ta dùng array replacements cho query này vì logic build chuỗi động phức tạp
      const replacements = [];

      if (category_id) {
        whereConditions.push("e.category_id = ?");
        replacements.push(Number(category_id));
      }

      if (search) {
        whereConditions.push(
          "(e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)"
        );
        const likeVal = `%${search}%`;
        replacements.push(likeVal, likeVal, likeVal);
      }

      if (start_date_from) {
        whereConditions.push("e.start_date >= ?");
        replacements.push(start_date_from);
      }
      if (start_date_to) {
        whereConditions.push("e.start_date <= ?");
        replacements.push(start_date_to);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // 1. Đếm tổng
      const countResult = await sequelize.query(
        `SELECT COUNT(*) AS total FROM Events e ${whereClause}`,
        {
          replacements: replacements,
          type: QueryTypes.SELECT,
        }
      );
      const total = countResult[0]?.total || 0;

      if (total === 0) {
        return {
          events: [],
          pagination: { total: 0, page, limit, totalPages: 0 },
        };
      }

      // 2. Lấy dữ liệu (Kèm trạng thái đăng ký của user nếu có)
      let userRegistrationSelect = "";
      let userRegistrationJoin = "";

      // Clone replacements vì chúng ta sẽ thêm params vào đầu và cuối
      const queryReplacements = [...replacements];

      if (userId) {
        userRegistrationSelect = `, r.status AS user_registration_status, r.registration_id AS user_registration_id`;
        userRegistrationJoin = `LEFT JOIN Registrations r ON e.event_id = r.event_id AND r.user_id = ?`;
        // Thêm userId vào đầu danh sách tham số
        queryReplacements.unshift(userId);
      } else {
        userRegistrationSelect = `, NULL AS user_registration_status, NULL AS user_registration_id`;
      }

      // Thêm limit/offset vào cuối
      queryReplacements.push(limit, offset);

      const events = await sequelize.query(
        `SELECT 
           e.*, 
           c.name AS category_name, 
           u.full_name AS manager_name,
           CASE 
             WHEN e.target_participants IS NULL THEN TRUE
             WHEN e.current_participants < e.target_participants THEN TRUE
             ELSE FALSE
           END AS has_available_slots
           ${userRegistrationSelect}
         FROM Events e
         LEFT JOIN Categories c ON e.category_id = c.category_id
         LEFT JOIN Users u ON e.manager_id = u.user_id
         ${userRegistrationJoin}
         ${whereClause}
         ORDER BY e.start_date ASC
         LIMIT ? OFFSET ?`,
        {
          replacements: queryReplacements,
          type: QueryTypes.SELECT,
        }
      );

      return {
        events,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("[Event.getActiveEvents] Error:", error);
      throw error;
    }
  }

  // Cập nhật thông tin sự kiện
  static async updateEvent(event_id, data) {
    try {
      const allowedFields = [
        "title",
        "description",
        "target_participants",
        "start_date",
        "end_date",
        "location",
        "category_id",
        "approval_status",
        "approved_by",
        "approval_date",
        "rejection_reason",
      ];

      // Lọc field
      const updateData = {};
      Object.keys(data).forEach((key) => {
        if (allowedFields.includes(key) && data[key] !== undefined) {
          updateData[key] = data[key];
        }
      });

      if (Object.keys(updateData).length === 0) {
        return false;
      }

      const [affectedCount] = await super.update(updateData, {
        where: {
          event_id: event_id,
          is_deleted: false,
        },
      });

      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Database error in updateEvent: ${error.message}`);
    }
  }

  // Xóa mềm sự kiện
  static async softDeleteEvent(event_id) {
    try {
      const [affectedCount] = await super.update(
        { is_deleted: true },
        { where: { event_id: event_id } }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Database error in softDeleteEvent: ${error.message}`);
    }
  }

  // Duyệt sự kiện (Stored Procedure)
  static async approveEvent(event_id, admin_id) {
    try {
      // Gọi Stored Procedure qua raw query
      await sequelize.query(`CALL sp_approve_event(:event_id, :admin_id)`, {
        replacements: { event_id, admin_id },
      });
      // Stored procedure trong Sequelize không trả về affected rows chuẩn như pool
      // nên ta giả định nếu không lỗi là thành công
      return true;
    } catch (error) {
      throw new Error(`Database error in approveEvent: ${error.message}`);
    }
  }

  // Từ chối sự kiện
  static async rejectEvent(event_id, admin_id, reason) {
    try {
      const [affectedCount] = await super.update(
        {
          approval_status: "rejected",
          approved_by: admin_id,
          approval_date: new Date(),
          rejection_reason: reason,
        },
        {
          where: {
            event_id: event_id,
            is_deleted: false,
          },
        }
      );
      return affectedCount > 0;
    } catch (error) {
      throw new Error(`Database error in rejectEvent: ${error.message}`);
    }
  }

  // Kiểm tra quyền sở hữu
  static async isEventOwner(event_id, user_id) {
    try {
      const count = await super.count({
        where: {
          event_id: event_id,
          manager_id: user_id,
          is_deleted: false,
        },
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Database error in isEventOwner: ${error.message}`);
    }
  }

  // Kiểm tra tồn tại
  static async eventExists(event_id) {
    try {
      const count = await super.count({
        where: {
          event_id: event_id,
          is_deleted: false,
        },
      });
      return count > 0;
    } catch (error) {
      throw new Error(`Database error in eventExists: ${error.message}`);
    }
  }

  // Lấy lịch sử tham gia sự kiện của Volunteer
  static async getEventHistoryByUserId(userId) {
    try {
      const history = await sequelize.query(
        `SELECT 
            e.event_id, e.title, e.description, e.start_date, e.end_date,
            e.location, e.target_participants, e.current_participants,
            c.name AS category_name,
            u.full_name AS manager_name, u.email AS manager_email, u.phone AS manager_phone,
            r.registration_id, r.registration_date, r.status AS registration_status,
            r.rejection_reason, r.completion_date,
            mu.full_name AS completed_by_manager_name,
            CASE 
              WHEN e.end_date < NOW() THEN 'past'
              WHEN e.start_date > NOW() THEN 'upcoming'
              ELSE 'ongoing'
            END AS event_status
          FROM Registrations r
          INNER JOIN Events e ON r.event_id = e.event_id
          LEFT JOIN Categories c ON e.category_id = c.category_id
          LEFT JOIN Users u ON e.manager_id = u.user_id
          LEFT JOIN Users mu ON r.completed_by_manager_id = mu.user_id
          WHERE r.user_id = ? AND e.is_deleted = FALSE
          ORDER BY e.start_date DESC, r.registration_date DESC`,
        {
          replacements: [userId],
          type: QueryTypes.SELECT,
        }
      );
      return history;
    } catch (error) {
      throw new Error(
        `Database error in getEventHistoryByUserId: ${error.message}`
      );
    }
  }
}

// =================================================================
// CẤU HÌNH SCHEMA
// =================================================================
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

export default Event;
