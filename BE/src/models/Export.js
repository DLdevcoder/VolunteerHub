import { QueryTypes } from "sequelize";
import sequelize from "../config/db.js";

class Export {
  // Export danh sách users
  static async exportUsers(filters = {}) {
    try {
      let whereConditions = [];
      let queryParams = [];

      const { role, status, search } = filters;

      if (role) {
        whereConditions.push("r.name = ?");
        queryParams.push(role);
      }

      if (status) {
        whereConditions.push("u.status = ?");
        queryParams.push(status);
      }

      if (search) {
        whereConditions.push("(u.full_name LIKE ? OR u.email LIKE ?)");
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Sử dụng sequelize.query với replacements là mảng (tương thích với dấu ?)
      const users = await sequelize.query(
        `SELECT 
           u.user_id,
           u.email,
           u.full_name,
           u.phone,
           u.avatar_url,
           r.name as role_name,
           u.status,
           u.created_at,
           u.updated_at
         FROM Users u 
         JOIN Roles r ON u.role_id = r.role_id 
         ${whereClause}
         ORDER BY u.created_at DESC`,
        {
          replacements: queryParams,
          type: QueryTypes.SELECT,
        }
      );

      return users;
    } catch (error) {
      throw new Error(`Database error in exportUsers: ${error.message}`);
    }
  }

  // Export danh sách events
  static async exportEvents(filters = {}) {
    try {
      let whereConditions = ["e.is_deleted = FALSE"];
      let queryParams = [];

      const { category, status, search, date_from, date_to } = filters;

      if (category) {
        whereConditions.push("c.name = ?");
        queryParams.push(category);
      }

      if (status) {
        whereConditions.push("e.approval_status = ?");
        queryParams.push(status);
      }

      if (search) {
        whereConditions.push("(e.title LIKE ? OR e.description LIKE ?)");
        queryParams.push(`%${search}%`, `%${search}%`);
      }

      if (date_from) {
        whereConditions.push("DATE(e.start_date) >= ?");
        queryParams.push(date_from);
      }

      if (date_to) {
        whereConditions.push("DATE(e.start_date) <= ?");
        queryParams.push(date_to);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const events = await sequelize.query(
        `SELECT 
           e.event_id,
           e.title,
           e.description,
           e.location,
           e.start_date,
           e.end_date,
           e.target_participants,
           e.current_participants,
           c.name as category_name,
           u.full_name as manager_name,
           e.approval_status,
           e.approved_by,
           e.approval_date,
           e.created_at,
           e.updated_at
         FROM Events e
         LEFT JOIN Categories c ON e.category_id = c.category_id
         LEFT JOIN Users u ON e.manager_id = u.user_id
         ${whereClause}
         ORDER BY e.created_at DESC`,
        {
          replacements: queryParams,
          type: QueryTypes.SELECT,
        }
      );

      return events;
    } catch (error) {
      throw new Error(`Database error in exportEvents: ${error.message}`);
    }
  }

  // Export danh sách registrations
  static async exportRegistrations(filters = {}) {
    try {
      let whereConditions = [];
      let queryParams = [];

      const { event_id, status, date_from, date_to } = filters;

      if (event_id) {
        whereConditions.push("r.event_id = ?");
        queryParams.push(event_id);
      }

      if (status) {
        whereConditions.push("r.status = ?");
        queryParams.push(status);
      }

      if (date_from) {
        whereConditions.push("DATE(r.registration_date) >= ?");
        queryParams.push(date_from);
      }

      if (date_to) {
        whereConditions.push("DATE(r.registration_date) <= ?");
        queryParams.push(date_to);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const registrations = await sequelize.query(
        `SELECT 
           r.registration_id,
           u.user_id,
           u.full_name as volunteer_name,
           u.email as volunteer_email,
           e.event_id,
           e.title as event_title,
           r.registration_date,
           r.status,
           r.rejection_reason,
           r.completed_by_manager_id,
           r.completion_date,
           r.updated_at
         FROM Registrations r
         JOIN Users u ON r.user_id = u.user_id
         JOIN Events e ON r.event_id = e.event_id
         ${whereClause}
         ORDER BY r.registration_date DESC`,
        {
          replacements: queryParams,
          type: QueryTypes.SELECT,
        }
      );

      return registrations;
    } catch (error) {
      throw new Error(
        `Database error in exportRegistrations: ${error.message}`
      );
    }
  }

  // Export danh sách posts và comments
  static async exportPostsAndComments(filters = {}) {
    try {
      let whereConditions = [];
      let queryParams = [];

      const { event_id, date_from, date_to } = filters;

      if (event_id) {
        whereConditions.push("p.event_id = ?");
        queryParams.push(event_id);
      }

      if (date_from) {
        whereConditions.push("DATE(p.created_at) >= ?");
        queryParams.push(date_from);
      }

      if (date_to) {
        whereConditions.push("DATE(p.created_at) <= ?");
        queryParams.push(date_to);
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      const posts = await sequelize.query(
        `SELECT 
           p.post_id,
           p.event_id,
           e.title as event_title,
           p.user_id,
           u.full_name as author_name,
           p.content,
           p.created_at,
           p.updated_at,
           COUNT(DISTINCT c.comment_id) as comment_count,
           COUNT(DISTINCT pr.user_id) as reaction_count
         FROM Posts p
         JOIN Events e ON p.event_id = e.event_id
         JOIN Users u ON p.user_id = u.user_id
         LEFT JOIN Comments c ON p.post_id = c.post_id
         LEFT JOIN PostReactions pr ON p.post_id = pr.post_id
         ${whereClause}
         GROUP BY p.post_id
         ORDER BY p.created_at DESC`,
        {
          replacements: queryParams,
          type: QueryTypes.SELECT,
        }
      );

      return posts;
    } catch (error) {
      throw new Error(
        `Database error in exportPostsAndComments: ${error.message}`
      );
    }
  }

  // Export thống kê tổng hợp
  static async exportSummaryStats() {
    try {
      // Dùng DUAL cho các subquery
      const summary = await sequelize.query(
        `SELECT 
           (SELECT COUNT(*) FROM Users WHERE status = 'Active') as total_active_users,
           (SELECT COUNT(*) FROM Events WHERE approval_status = 'approved' AND is_deleted = FALSE) as total_approved_events,
           (SELECT COUNT(*) FROM Registrations WHERE status = 'completed') as total_completed_registrations,
           (SELECT COUNT(*) FROM Posts) as total_posts,
           (SELECT COUNT(*) FROM Comments) as total_comments,
           (SELECT COUNT(*) FROM Events WHERE start_date >= CURDATE() AND approval_status = 'approved' AND is_deleted = FALSE) as upcoming_events,
           (SELECT AVG(current_participants) FROM Events WHERE approval_status = 'approved' AND is_deleted = FALSE) as avg_participants_per_event,
           (SELECT COUNT(DISTINCT user_id) FROM Registrations WHERE status = 'approved') as unique_volunteers
         FROM DUAL`,
        {
          type: QueryTypes.SELECT,
        }
      );

      return summary[0] || {};
    } catch (error) {
      throw new Error(`Database error in exportSummaryStats: ${error.message}`);
    }
  }
}

export default Export;
