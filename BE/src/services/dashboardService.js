import sequelize from "../config/db.js";
import { QueryTypes } from "sequelize";

class DashboardService {
  static async getVolunteerDashboard(user_id) {
    try {
      const newEvents = await sequelize.query(
        `SELECT 
            e.event_id, e.title, e.start_date, e.location, e.current_participants, e.target_participants,
            u.full_name as manager_name,
            (SELECT COUNT(*) FROM Posts p WHERE p.event_id = e.event_id) as total_posts,
            (SELECT COUNT(*) FROM PostReactions pr JOIN Posts p ON pr.post_id = p.post_id WHERE p.event_id = e.event_id) as total_reactions,
            (SELECT COUNT(*) FROM Comments c JOIN Posts p ON c.post_id = p.post_id WHERE p.event_id = e.event_id) as total_comments
         FROM Events e 
         JOIN Users u ON e.manager_id = u.user_id
         WHERE e.approval_status = 'approved' AND e.is_deleted = FALSE 
           AND e.start_date > NOW()
           AND e.event_id NOT IN (SELECT event_id FROM Registrations WHERE user_id = ? AND status IN ('approved', 'pending'))
         ORDER BY e.created_at DESC LIMIT 5`,
        {
          replacements: [user_id],
          type: QueryTypes.SELECT,
        }
      );

      const activityFeed = await sequelize.query(
        `
        (
            SELECT 'post' as type, p.post_id as id, p.content, p.created_at, u.full_name as author_name, u.avatar_url as author_avatar, e.event_id, e.title as event_title,
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id) as like_count,
            (SELECT COUNT(*) FROM Comments WHERE post_id = p.post_id) as comment_count
            FROM Posts p JOIN Registrations r ON p.event_id = r.event_id JOIN Users u ON p.user_id = u.user_id JOIN Events e ON p.event_id = e.event_id
            WHERE r.user_id = ? AND r.status = 'approved'
        )
        UNION
        (
            SELECT 'comment' as type, c.comment_id as id, c.content, c.created_at, u.full_name as author_name, u.avatar_url as author_avatar, e.event_id, e.title as event_title,
            0 as like_count, 0 as comment_count
            FROM Comments c JOIN Posts p ON c.post_id = p.post_id JOIN Registrations r ON p.event_id = r.event_id JOIN Users u ON c.user_id = u.user_id JOIN Events e ON p.event_id = e.event_id
            WHERE r.user_id = ? AND r.status = 'approved'
        )
        ORDER BY created_at DESC LIMIT 10
        `,
        {
          replacements: [user_id, user_id],
          type: QueryTypes.SELECT,
        }
      );

      const trendingEvents = await sequelize.query(
        `SELECT 
            e.event_id, e.title, e.location, e.current_participants, e.target_participants,
            (SELECT COUNT(*) FROM Posts p WHERE p.event_id = e.event_id) as total_posts,
            (SELECT COUNT(*) FROM PostReactions pr JOIN Posts p ON pr.post_id = p.post_id WHERE p.event_id = e.event_id) as total_reactions,
            (SELECT COUNT(*) FROM Comments c JOIN Posts p ON c.post_id = p.post_id WHERE p.event_id = e.event_id) as total_comments,
            (SELECT COUNT(*) FROM Registrations WHERE event_id = e.event_id AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_participants_24h,
            (SELECT COUNT(*) FROM Posts WHERE event_id = e.event_id AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_posts_24h,
            (SELECT COUNT(*) FROM Comments c JOIN Posts p ON c.post_id = p.post_id WHERE p.event_id = e.event_id AND c.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_comments_24h,
            (SELECT COUNT(*) FROM PostReactions pr JOIN Posts p ON pr.post_id = p.post_id WHERE p.event_id = e.event_id AND pr.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_likes_24h,
            (e.current_participants * 2 + (SELECT COUNT(*) FROM Posts WHERE event_id=e.event_id) * 3) as engagement_score
         FROM Events e
         WHERE e.approval_status = 'approved' AND e.is_deleted = FALSE AND e.start_date > NOW()
           AND e.event_id NOT IN (SELECT event_id FROM Registrations WHERE user_id = ? AND status IN ('approved', 'pending'))
         ORDER BY engagement_score DESC LIMIT 5`,
        {
          replacements: [user_id],
          type: QueryTypes.SELECT,
        }
      );

      return {
        col1_new: newEvents,
        col2_feed: activityFeed,
        col3_trending: trendingEvents,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getManagerDashboard(user_id) {
    try {
      const stats = await sequelize.query(
        `SELECT 
           (SELECT COUNT(*) FROM Events WHERE manager_id = ? AND is_deleted = FALSE) as total_created,
           (SELECT COUNT(*) FROM Events WHERE manager_id = ? AND approval_status = 'pending' AND is_deleted = FALSE) as total_pending,
           (SELECT COUNT(*) FROM Events WHERE manager_id = ? AND approval_status = 'approved' AND is_deleted = FALSE) as total_approved,
           (SELECT COUNT(*) FROM Events WHERE manager_id = ? AND approval_status = 'approved' AND start_date <= NOW() AND end_date >= NOW() AND is_deleted = FALSE) as total_running,
           (SELECT COUNT(*) FROM Events WHERE manager_id = ? AND approval_status = 'approved' AND end_date < NOW() AND is_deleted = FALSE) as total_completed`,
        {
          replacements: [user_id, user_id, user_id, user_id, user_id],
          type: QueryTypes.SELECT,
        }
      );

      const pendingEvents = await sequelize.query(
        `SELECT event_id, title, location, start_date, created_at, target_participants, current_participants,
                DATEDIFF(NOW(), created_at) as days_waiting
         FROM Events 
         WHERE manager_id = ? AND approval_status = 'pending' AND is_deleted = FALSE
         ORDER BY created_at ASC`,
        {
          replacements: [user_id],
          type: QueryTypes.SELECT,
        }
      );

      const activityFeed = await sequelize.query(
        `
        (
            SELECT 
                'post' as type, p.post_id as id, p.content, p.created_at, 
                u.full_name as author_name, u.avatar_url as author_avatar, 
                e.event_id, e.title as event_title, e.location, e.current_participants, e.target_participants,
                (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id) as like_count,
                (SELECT COUNT(*) FROM Comments WHERE post_id = p.post_id) as comment_count,
                (SELECT COUNT(*) FROM Posts WHERE event_id = e.event_id AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as event_new_posts_24h,
                (SELECT COUNT(*) FROM Comments c2 JOIN Posts p2 ON c2.post_id = p2.post_id WHERE p2.event_id = e.event_id AND c2.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as event_new_comments_24h
            FROM Posts p 
            JOIN Users u ON p.user_id = u.user_id 
            JOIN Events e ON p.event_id = e.event_id
            WHERE e.manager_id = ? AND e.approval_status = 'approved'
        )
        UNION
        (
            SELECT 
                'comment' as type, c.comment_id as id, c.content, c.created_at, 
                u.full_name as author_name, u.avatar_url as author_avatar, 
                e.event_id, e.title as event_title, e.location, e.current_participants, e.target_participants,
                0 as like_count, 0 as comment_count,
                (SELECT COUNT(*) FROM Posts WHERE event_id = e.event_id AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as event_new_posts_24h,
                (SELECT COUNT(*) FROM Comments c2 JOIN Posts p2 ON c2.post_id = p2.post_id WHERE p2.event_id = e.event_id AND c2.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as event_new_comments_24h
            FROM Comments c 
            JOIN Posts p ON c.post_id = p.post_id 
            JOIN Users u ON c.user_id = u.user_id 
            JOIN Events e ON p.event_id = e.event_id
            WHERE e.manager_id = ? AND e.approval_status = 'approved'
        )
        ORDER BY created_at DESC LIMIT 10
        `,
        {
          replacements: [user_id, user_id],
          type: QueryTypes.SELECT,
        }
      );

      const trendingEvents = await sequelize.query(
        `SELECT 
            e.event_id, e.title, e.location, e.start_date, e.current_participants, e.target_participants,
            (SELECT COUNT(*) FROM Registrations WHERE event_id = e.event_id AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_participants_24h,
            (SELECT COUNT(*) FROM Posts WHERE event_id = e.event_id AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_posts_24h,
            (SELECT COUNT(*) FROM PostReactions pr JOIN Posts p ON pr.post_id = p.post_id WHERE p.event_id = e.event_id AND pr.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_likes_24h,
            (SELECT COUNT(*) FROM Comments c JOIN Posts p ON c.post_id = p.post_id WHERE p.event_id = e.event_id AND c.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_comments_24h,
            (
                e.current_participants * 2 + 
                (SELECT COUNT(*) FROM Posts WHERE event_id=e.event_id) * 3 + 
                (SELECT COUNT(*) FROM PostReactions pr JOIN Posts p ON pr.post_id = p.post_id WHERE p.event_id = e.event_id)
            ) as engagement_score
         FROM Events e
         WHERE e.manager_id = ? AND e.approval_status = 'approved' AND e.is_deleted = FALSE
         ORDER BY engagement_score DESC LIMIT 5`,
        {
          replacements: [user_id],
          type: QueryTypes.SELECT,
        }
      );

      return {
        stats: stats[0],
        col1_pending: pendingEvents,
        col2_activity: activityFeed,
        col3_trending: trendingEvents,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getAdminDashboard() {
    try {
      const stats = await sequelize.query(
        `SELECT 
           (SELECT COUNT(*) FROM Users) as total_users,
           (SELECT COUNT(*) FROM Users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_users_24h,
           (SELECT COUNT(*) FROM Events WHERE is_deleted = FALSE) as total_events,
           (SELECT COUNT(*) FROM Events WHERE is_deleted = FALSE AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_events_24h,
           (SELECT COUNT(*) FROM Events WHERE approval_status = 'pending' AND is_deleted = FALSE) as pending_events,
           (SELECT COUNT(*) FROM Users WHERE status = 'Locked') as locked_users,
           (SELECT COUNT(*) FROM Users WHERE status = 'Locked' AND updated_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_locked_24h`,
        { type: QueryTypes.SELECT }
      );

      const pendingEvents = await sequelize.query(
        `SELECT 
            e.event_id, e.title, e.start_date, e.location, e.target_participants, e.current_participants,
            u.full_name as manager_name, u.avatar_url as manager_avatar,
            DATEDIFF(NOW(), e.created_at) as days_waiting
         FROM Events e 
         JOIN Users u ON e.manager_id = u.user_id
         WHERE e.approval_status = 'pending' AND e.is_deleted = FALSE
         ORDER BY e.created_at ASC`,
        { type: QueryTypes.SELECT }
      );

      const trendingEvents = await sequelize.query(
        `SELECT 
            e.event_id, e.title, e.start_date, e.current_participants, e.target_participants,
            u.full_name as manager_name,
            (SELECT COUNT(*) FROM Posts p WHERE p.event_id = e.event_id) as total_posts,
            (SELECT COUNT(*) FROM PostReactions pr JOIN Posts p ON pr.post_id = p.post_id WHERE p.event_id = e.event_id) as total_reactions,
            (SELECT COUNT(*) FROM Comments c JOIN Posts p ON c.post_id = p.post_id WHERE p.event_id = e.event_id) as total_comments,
            (SELECT COUNT(*) FROM Registrations r WHERE r.event_id = e.event_id AND r.registration_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_participants_24h,
            (SELECT COUNT(*) FROM Posts p2 WHERE p2.event_id = e.event_id AND p2.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_posts_24h,
            (SELECT COUNT(*) FROM PostReactions pr2 JOIN Posts p3 ON pr2.post_id = p3.post_id WHERE p3.event_id = e.event_id AND pr2.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_likes_24h,
            (SELECT COUNT(*) FROM Comments c2 JOIN Posts p4 ON c2.post_id = p4.post_id WHERE p4.event_id = e.event_id AND c2.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as new_comments_24h,
            (e.current_participants * 2 + (SELECT COUNT(*) FROM Posts p5 WHERE p5.event_id = e.event_id) * 3) as engagement_score
         FROM Events e
         JOIN Users u ON e.manager_id = u.user_id
         WHERE e.approval_status = 'approved' AND e.is_deleted = FALSE
         ORDER BY engagement_score DESC LIMIT 5`,
        { type: QueryTypes.SELECT }
      );

      return {
        stats: stats[0],
        pending_events: pendingEvents,
        trending_events: trendingEvents,
      };
    } catch (error) {
      throw error;
    }
  }

  static async getOverviewStats() {
    try {
      const userStats = await sequelize.query(
        `SELECT 
           r.name as role_name,
           COUNT(*) as total_users,
           SUM(CASE WHEN u.status = 'Active' THEN 1 ELSE 0 END) as active_users,
           SUM(CASE WHEN u.status = 'Locked' THEN 1 ELSE 0 END) as locked_users
         FROM Users u
         JOIN Roles r ON u.role_id = r.role_id
         GROUP BY r.name`,
        { type: QueryTypes.SELECT }
      );

      const eventStats = await sequelize.query(
        `SELECT 
           COUNT(*) as total_events,
           SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_events,
           SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_events,
           SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_events,
           SUM(current_participants) as total_participants,
           AVG(current_participants) as avg_participants_per_event
         FROM Events
         WHERE is_deleted = FALSE`,
        { type: QueryTypes.SELECT }
      );

      const registrationStats = await sequelize.query(
        `SELECT 
           COUNT(*) as total_registrations,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_registrations,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_registrations,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_registrations
         FROM Registrations`,
        { type: QueryTypes.SELECT }
      );

      const activityStats = await sequelize.query(
        `SELECT 
           (SELECT COUNT(*) FROM Posts) as total_posts,
           (SELECT COUNT(*) FROM Comments) as total_comments,
           (SELECT COUNT(*) FROM PostReactions) as total_post_reactions,
           (SELECT COUNT(*) FROM CommentReactions) as total_comment_reactions`,
        { type: QueryTypes.SELECT }
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

      const eventsByTime = await sequelize.query(
        `SELECT 
           ${groupFormat} as period,
           COUNT(*) as total_events,
           SUM(CASE WHEN approval_status = 'approved' THEN 1 ELSE 0 END) as approved_events,
           SUM(CASE WHEN approval_status = 'pending' THEN 1 ELSE 0 END) as pending_events,
           SUM(CASE WHEN approval_status = 'rejected' THEN 1 ELSE 0 END) as rejected_events
         FROM Events
         WHERE ${dateCondition} AND is_deleted = FALSE
         GROUP BY ${groupFormat}
         ORDER BY period`,
        { type: QueryTypes.SELECT }
      );

      return eventsByTime;
    } catch (error) {
      throw new Error(`Database error in getEventTimeSeries: ${error.message}`);
    }
  }

  static async getTopEngagedEvents(limit = 10) {
    try {
      const topEvents = await sequelize.query(
        `SELECT 
           e.event_id, e.title, e.start_date, e.current_participants,
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
        {
          replacements: [limit],
          type: QueryTypes.SELECT,
        }
      );

      return topEvents;
    } catch (error) {
      throw new Error(
        `Database error in getTopEngagedEvents: ${error.message}`
      );
    }
  }

  static async getEventCategoryStats() {
    try {
      const categoryStats = await sequelize.query(
        `SELECT 
           c.name as category_name,
           COUNT(e.event_id) as total_events,
           SUM(e.current_participants) as total_participants,
           AVG(e.current_participants) as avg_participants,
           SUM(CASE WHEN e.approval_status = 'approved' THEN 1 ELSE 0 END) as approved_events
         FROM Categories c
         LEFT JOIN Events e ON c.category_id = e.category_id AND e.is_deleted = FALSE
         GROUP BY c.category_id, c.name
         ORDER BY total_events DESC`,
        { type: QueryTypes.SELECT }
      );

      return categoryStats;
    } catch (error) {
      throw new Error(
        `Database error in getEventCategoryStats: ${error.message}`
      );
    }
  }

  static async getTopActiveUsers(limit = 10) {
    try {
      const activeUsers = await sequelize.query(
        `SELECT 
           u.user_id, u.full_name, u.email,
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
        {
          replacements: [limit],
          type: QueryTypes.SELECT,
        }
      );

      return activeUsers;
    } catch (error) {
      throw new Error(`Database error in getTopActiveUsers: ${error.message}`);
    }
  }

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

      const registrationTrends = await sequelize.query(
        `SELECT 
           ${groupFormat} as period,
           COUNT(*) as total_registrations,
           SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved,
           SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
           SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected
         FROM Registrations
         WHERE ${dateCondition}
         GROUP BY ${groupFormat}
         ORDER BY period`,
        { type: QueryTypes.SELECT }
      );

      return registrationTrends;
    } catch (error) {
      throw new Error(
        `Database error in getRegistrationTrends: ${error.message}`
      );
    }
  }

  static async getSystemHealth() {
    try {
      const systemStats = await sequelize.query(
        `SELECT 
           (SELECT COUNT(*) FROM Users WHERE status = 'Active') as active_users,
           (SELECT COUNT(*) FROM Events WHERE approval_status = 'approved' AND start_date >= NOW()) as upcoming_events,
           (SELECT COUNT(*) FROM Events WHERE approval_status = 'pending') as pending_events,
           (SELECT COUNT(*) FROM Notifications WHERE is_read = FALSE) as unread_notifications,
           (SELECT COUNT(*) FROM Posts WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as posts_last_24h,
           (SELECT COUNT(*) FROM Registrations WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as registrations_last_24h`,
        { type: QueryTypes.SELECT }
      );

      return systemStats[0] || {};
    } catch (error) {
      throw new Error(`Database error in getSystemHealth: ${error.message}`);
    }
  }
}

export default DashboardService;