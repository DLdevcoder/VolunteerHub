import pool from "../config/db.js";

class Dashboard {
  // Thống kê tổng quan
  static async getOverviewStats() {
    try {
      // Tổng số users theo role
      const [userStats] = await pool.execute(
        `SELECT 
          r.name as role_name,
          COUNT(*) as total_users,
          SUM(CASE WHEN u.status = 'Active' THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN u.status = 'Locked' THEN 1 ELSE 0 END) as locked_users
         FROM Users u
         JOIN Roles r ON u.role_id = r.role_id
         GROUP BY r.name`
      );

      // Thống kê events
      const [eventStats] = await pool.execute(
        `SELECT 
          COUNT(*) as total_events,
          SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_events,
          SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_events,
          SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_events,
          SUM(current_participants) as total_participants,
          AVG(current_participants) as avg_participants_per_event
         FROM Events
         WHERE is_deleted = FALSE`
      );

      // Thống kê registrations
      const [registrationStats] = await pool.execute(
        `SELECT 
          COUNT(*) as total_registrations,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_registrations,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_registrations,
          SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_registrations
         FROM Registrations`
      );

      // Thống kê hoạt động (posts, comments, reactions)
      const [activityStats] = await pool.execute(
        `SELECT 
          (SELECT COUNT(*) FROM Posts) as total_posts,
          (SELECT COUNT(*) FROM Comments) as total_comments,
          (SELECT COUNT(*) FROM PostReactions) as total_post_reactions,
          (SELECT COUNT(*) FROM CommentReactions) as total_comment_reactions`
      );

      return {
        user_stats: userStats,
        event_stats: eventStats[0] || {},
        registration_stats: registrationStats[0] || {},
        activity_stats: activityStats[0] || {},
      };
    } catch (error) {
      throw new Error(`Database error in getOverviewStats: ${error.message}`);
    }
  }

  // Thống kê events theo thời gian (7 ngày, 30 ngày, 12 tháng)
  static async getEventTimeSeries(timeRange = "7d") {
    try {
      let dateCondition, groupFormat;

      switch (timeRange) {
        case "7d":
          dateCondition =
            "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
          groupFormat = "DATE(created_at)";
          break;
        case "30d":
          dateCondition =
            "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
          groupFormat = "DATE(created_at)";
          break;
        case "12m":
          dateCondition =
            "created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)";
          groupFormat = 'DATE_FORMAT(created_at, "%Y-%m")';
          break;
        default:
          dateCondition =
            "DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
          groupFormat = "DATE(created_at)";
      }

      const [eventsByTime] = await pool.execute(
        `SELECT 
          ${groupFormat} as period,
          COUNT(*) as total_events,
          SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_events,
          SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_events,
          SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_events
         FROM Events
         WHERE ${dateCondition} AND is_deleted = FALSE
         GROUP BY ${groupFormat}
         ORDER BY period`
      );

      return eventsByTime;
    } catch (error) {
      throw new Error(`Database error in getEventTimeSeries: ${error.message}`);
    }
  }

  // Top events có engagement cao nhất
  static async getTopEngagedEvents(limit = 10) {
    try {
      const [topEvents] = await pool.execute(
        `SELECT 
          e.event_id,
          e.title,
          e.start_date,
          e.current_participants,
          c.name as category_name,
          u.full_name as manager_name,
          COUNT(DISTINCT p.post_id) as post_count,
          COUNT(DISTINCT c2.comment_id) as comment_count,
          COUNT(DISTINCT pr.user_id) as reaction_count,
          (e.current_participants * 3 + 
           COUNT(DISTINCT p.post_id) * 5 + 
           COUNT(DISTINCT c2.comment_id) * 2 + 
           COUNT(DISTINCT pr.user_id)) as engagement_score
         FROM Events e
         LEFT JOIN Categories c ON e.category_id = c.category_id
         LEFT JOIN Users u ON e.manager_id = u.user_id
         LEFT JOIN Posts p ON e.event_id = p.event_id
         LEFT JOIN Comments c2 ON p.post_id = c2.post_id
         LEFT JOIN PostReactions pr ON p.post_id = pr.post_id
         WHERE e.approval_status = 'approved' AND e.is_deleted = FALSE
         GROUP BY e.event_id
         ORDER BY engagement_score DESC
         LIMIT ?`,
        [limit]
      );

      return topEvents;
    } catch (error) {
      throw new Error(
        `Database error in getTopEngagedEvents: ${error.message}`
      );
    }
  }

  // Thống kê events theo category
  static async getEventCategoryStats() {
    try {
      const [categoryStats] = await pool.execute(
        `SELECT 
          c.name as category_name,
          COUNT(e.event_id) as total_events,
          SUM(e.current_participants) as total_participants,
          AVG(e.current_participants) as avg_participants,
          SUM(CASE WHEN e.approval_status = 'approved' THEN 1 ELSE 0 END) as approved_events
         FROM Categories c
         LEFT JOIN Events e ON c.category_id = e.category_id AND e.is_deleted = FALSE
         GROUP BY c.category_id, c.name
         ORDER BY total_events DESC`
      );

      return categoryStats;
    } catch (error) {
      throw new Error(
        `Database error in getEventCategoryStats: ${error.message}`
      );
    }
  }

  // Top users tích cực nhất
  static async getTopActiveUsers(limit = 10) {
    try {
      const [activeUsers] = await pool.execute(
        `SELECT 
          u.user_id,
          u.full_name,
          u.email,
          r.name as role_name,
          COUNT(DISTINCT reg.event_id) as events_joined,
          COUNT(DISTINCT p.post_id) as posts_created,
          COUNT(DISTINCT c.comment_id) as comments_made,
          COUNT(DISTINCT pr.post_id) + COUNT(DISTINCT cr.comment_id) as reactions_given,
          (COUNT(DISTINCT reg.event_id) * 5 + 
           COUNT(DISTINCT p.post_id) * 3 + 
           COUNT(DISTINCT c.comment_id) * 2 +
           (COUNT(DISTINCT pr.post_id) + COUNT(DISTINCT cr.comment_id))) as activity_score
         FROM Users u
         JOIN Roles r ON u.role_id = r.role_id
         LEFT JOIN Registrations reg ON u.user_id = reg.user_id AND reg.status = 'completed'
         LEFT JOIN Posts p ON u.user_id = p.user_id
         LEFT JOIN Comments c ON u.user_id = c.user_id
         LEFT JOIN PostReactions pr ON u.user_id = pr.user_id
         LEFT JOIN CommentReactions cr ON u.user_id = cr.user_id
         WHERE u.status = 'Active'
         GROUP BY u.user_id
         ORDER BY activity_score DESC
         LIMIT ?`,
        [limit]
      );

      return activeUsers;
    } catch (error) {
      throw new Error(`Database error in getTopActiveUsers: ${error.message}`);
    }
  }

  // Thống kê registration trends
  static async getRegistrationTrends(timeRange = "7d") {
    try {
      let dateCondition, groupFormat;

      switch (timeRange) {
        case "7d":
          dateCondition =
            "DATE(registration_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
          groupFormat = "DATE(registration_date)";
          break;
        case "30d":
          dateCondition =
            "DATE(registration_date) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)";
          groupFormat = "DATE(registration_date)";
          break;
        default:
          dateCondition =
            "DATE(registration_date) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)";
          groupFormat = "DATE(registration_date)";
      }

      const [registrationTrends] = await pool.execute(
        `SELECT 
          ${groupFormat} as period,
          COUNT(*) as total_registrations,
          SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
          SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
         FROM Registrations
         WHERE ${dateCondition}
         GROUP BY ${groupFormat}
         ORDER BY period`
      );

      return registrationTrends;
    } catch (error) {
      throw new Error(
        `Database error in getRegistrationTrends: ${error.message}`
      );
    }
  }

  // System health metrics
  static async getSystemHealth() {
    try {
      const [systemStats] = await pool.execute(
        `SELECT 
          (SELECT COUNT(*) FROM Users WHERE status = 'Active') as active_users,
          (SELECT COUNT(*) FROM Events WHERE approval_status = 'approved' AND start_date >= NOW()) as upcoming_events,
          (SELECT COUNT(*) FROM Events WHERE approval_status = 'pending') as pending_events,
          (SELECT COUNT(*) FROM Notifications WHERE is_read = FALSE) as unread_notifications,
          (SELECT COUNT(*) FROM Posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as posts_last_24h,
          (SELECT COUNT(*) FROM Registrations WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as registrations_last_24h`
      );

      return systemStats[0] || {};
    } catch (error) {
      throw new Error(`Database error in getSystemHealth: ${error.message}`);
    }
  }
}

export default Dashboard;
