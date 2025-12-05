import pool from "../config/db.js";

const Event = {
  // Tạo sự kiện mới
  async createEvent(eventData) {
    const {
      title,
      description,
      target_participants,
      start_date,
      end_date,
      location,
      manager_id,
      category_id,
    } = eventData;

    const [result] = await pool.execute(
      `INSERT INTO Events (title, description, target_participants, start_date, end_date, location, manager_id, category_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        target_participants,
        start_date,
        end_date,
        location,
        manager_id,
        category_id,
      ]
    );

    return result.insertId;
  },

  // Kiểm tra sự kiện trùng lặp (theo title, start_date, location)
  async checkDuplicate(title, start_date, location) {
    const [rows] = await pool.execute(
      `SELECT event_id FROM Events 
       WHERE title = ? AND start_date = ? AND location = ? AND is_deleted = FALSE`,
      [title, start_date, location]
    );
    return rows.length > 0;
  },

  // Lấy tất cả danh mục sự kiện (Môi trường, Giáo dục...)
  async getAllCategories() {
    const [rows] = await pool.execute(
      "SELECT * FROM Categories ORDER BY display_order ASC"
    );
    return rows;
  },

  // Lấy sự kiện theo ID (lấy tất cả, trừ sự kiện bị xoá mềm)
  async getEventById(event_id) {
    const [events] = await pool.execute(
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
      [event_id]
    );

    return events.length > 0 ? events[0] : null;
  },

  // Lấy danh sách sự kiện với lọc và phân trang
  async getAllEvents(filters = {}) {
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

    const offset = (page - 1) * limit;
    let whereConditions = [];
    let params = [];

    if (is_deleted === true || is_deleted === "true") {
      whereConditions.push("e.is_deleted = TRUE");
    } else {
      whereConditions.push("e.is_deleted = FALSE");
    }

    // Thêm điều kiện lọc
    if (approval_status) {
      whereConditions.push("e.approval_status = ?");
      params.push(approval_status);
    }

    if (category_id) {
      whereConditions.push("e.category_id = ?");
      params.push(category_id);
    }

    if (manager_id) {
      whereConditions.push("e.manager_id = ?");
      params.push(manager_id);
    }

    if (search) {
      whereConditions.push("(e.title LIKE ? OR e.description LIKE ?)");
      params.push(`%${search}%`, `%${search}%`);
    }

    if (start_date_from) {
      whereConditions.push("e.start_date >= ?");
      params.push(start_date_from);
    }

    if (start_date_to) {
      whereConditions.push("e.start_date <= ?");
      params.push(start_date_to);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    // Validate sort_by để tránh SQL injection
    const validSortFields = [
      "created_at",
      "start_date",
      "end_date",
      "title",
      "current_participants",
    ];
    const sortField = validSortFields.includes(sort_by)
      ? sort_by
      : "created_at";
    const sortDirection = sort_order.toUpperCase() === "ASC" ? "ASC" : "DESC";

    // Đếm tổng số bản ghi
    const [countResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM Events e ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Lấy dữ liệu (bổ sung thông tin người duyệt)
    const [events] = await pool.query(
      `SELECT e.*, c.name as category_name, u.full_name as manager_name, u.email as manager_email,
              approver.full_name as approved_by_name
       FROM Events e
       LEFT JOIN Categories c ON e.category_id = c.category_id
       LEFT JOIN Users u ON e.manager_id = u.user_id
       LEFT JOIN Users approver ON e.approved_by = approver.user_id
       ${whereClause}
       ORDER BY e.${sortField} ${sortDirection}
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
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
  },

  // Lấy danh sách sự kiện đang hoạt động (approved và chưa kết thúc)
  // models/Event.js (chỉ thay hàm này)

  async getActiveEvents(filters = {}) {
    let {
      page = 1,
      limit = 10,
      category_id,
      search,
      start_date_from,
      start_date_to,
    } = filters;

    // Đảm bảo page / limit là số hợp lệ
    page = Number(page) || 1;
    limit = Number(limit) || 10;

    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100;

    const offset = (page - 1) * limit;

    // Điều kiện cứng: Chỉ lấy sự kiện chưa xóa, đã duyệt và chưa kết thúc
    let whereConditions = [
      "e.is_deleted = FALSE",
      "e.approval_status = 'approved'",
      "e.end_date >= NOW()",
    ];
    let params = [];

    // Lọc theo category
    if (category_id) {
      whereConditions.push("e.category_id = ?");
      params.push(Number(category_id));
    }

    // Lọc theo search (mình cho thêm location cho tiện, bạn muốn giữ nguyên thì bỏ OR e.location)
    if (search) {
      whereConditions.push(
        "(e.title LIKE ? OR e.description LIKE ? OR e.location LIKE ?)"
      );
      const likeVal = `%${search}%`;
      params.push(likeVal, likeVal, likeVal);
    }

    // Lọc theo khoảng thời gian bắt đầu
    if (start_date_from) {
      whereConditions.push("e.start_date >= ?");
      params.push(start_date_from);
    }

    if (start_date_to) {
      whereConditions.push("e.start_date <= ?");
      params.push(start_date_to);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // -------- 1) Đếm tổng số event phù hợp --------
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM Events e ${whereClause}`,
      params
    );
    const total = countResult[0]?.total ?? 0;

    // Nếu không có bản ghi nào thì trả rỗng luôn cho nhanh
    if (total === 0) {
      return {
        events: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
        },
      };
    }

    // -------- 2) Lấy dữ liệu trang hiện tại --------
    const [events] = await pool.query(
      `SELECT 
        e.*, 
        c.name AS category_name, 
        u.full_name AS manager_name
     FROM Events e
     LEFT JOIN Categories c ON e.category_id = c.category_id
     LEFT JOIN Users u ON e.manager_id = u.user_id
     ${whereClause}
     ORDER BY e.start_date ASC
     LIMIT ? OFFSET ?`,
      [...params, Number(limit), Number(offset)]
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
  },

  // Cập nhật thông tin sự kiện (chỉ cập nhật các trường được gửi lên)
  // models/Event.js
  async updateEvent(event_id, data) {
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

    const fields = [];
    const values = [];

    Object.keys(data).forEach((key) => {
      if (allowedFields.includes(key) && data[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(data[key]);
      }
    });

    if (fields.length === 0) {
      console.log("[Event.updateEvent] No allowed fields to update", {
        event_id,
        data,
      });
      return false;
    }

    const sql = `UPDATE Events SET ${fields.join(", ")} WHERE event_id = ? AND is_deleted = FALSE`;
    values.push(event_id);

    console.log("[Event.updateEvent] SQL:", sql);
    console.log("[Event.updateEvent] VALUES:", values);

    const [result] = await pool.execute(sql, values);

    console.log("[Event.updateEvent] result:", result);

    // return true / false instead of raw affectedRows
    return result.affectedRows > 0;
  },

  // Xóa mềm sự kiện (soft delete)
  async softDeleteEvent(event_id) {
    const [result] = await pool.execute(
      `UPDATE Events SET is_deleted = TRUE WHERE event_id = ?`,
      [event_id]
    );

    return result.affectedRows > 0;
  },

  // Duyệt sự kiện (Dùng Stored Procedure tối ưu)
  async approveEvent(event_id, admin_id) {
    const [rows] = await pool.execute(`CALL sp_approve_event(?, ?)`, [
      event_id,
      admin_id,
    ]);
    const result = rows[0][0];
    return result.affected > 0;
  },

  // Từ chối sự kiện (cập nhật trạng thái, trigger sẽ tự động tạo thông báo)
  async rejectEvent(event_id, admin_id, reason) {
    const [result] = await pool.execute(
      `UPDATE Events 
       SET approval_status = 'rejected', approved_by = ?, approval_date = NOW(), rejection_reason = ?
       WHERE event_id = ? AND is_deleted = FALSE`,

      [admin_id, reason, event_id]
    );

    return result.affectedRows > 0;
  },

  // Kiểm tra quyền sở hữu sự kiện
  async isEventOwner(event_id, user_id) {
    const [events] = await pool.execute(
      `SELECT event_id FROM Events WHERE event_id = ? AND manager_id = ? AND is_deleted = FALSE`,
      [event_id, user_id]
    );

    return events.length > 0;
  },

  // Kiểm tra sự kiện có tồn tại không
  async eventExists(event_id) {
    const [events] = await pool.execute(
      `SELECT event_id FROM Events WHERE event_id = ? AND is_deleted = FALSE`,
      [event_id]
    );

    return events.length > 0;
  },
};

export default Event;
