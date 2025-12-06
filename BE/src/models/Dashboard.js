import pool from "../config/db.js";

class Dashboard {
  // ==================== DASHBOARD CHO TÌNH NGUYỆN VIÊN ====================
  static async getVolunteerDashboard(user_id) {
    try {
      // Sự kiện mới công bố (chưa tham gia)
      const [newEvents] = await pool.execute(
        `SELECT 
          e.event_id, e.title, e.description, e.location, 
          e.start_date, e.end_date, e.current_participants,
          c.name as category_name,
          u.full_name as manager_name,
          (SELECT COUNT(*) FROM Posts p WHERE p.event_id = e.event_id AND p.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)) as recent_posts_count
         FROM Events e
         LEFT JOIN Categories c ON e.category_id = c.category_id
         LEFT JOIN Users u ON e.manager_id = u.user_id
         WHERE e.approval_status = 'approved' 
           AND e.start_date > NOW()
           AND e.is_deleted = FALSE
           AND e.event_id NOT IN (
             SELECT event_id FROM Registrations 
             WHERE user_id = ? AND status IN ('approved', 'pending')
           )
         ORDER BY e.created_at DESC
         LIMIT 10`,
        [user_id]
      );

      // Sự kiện thu hút (nhiều thành viên/trao đổi/like)
      const [trendingEvents] = await pool.execute(
        `SELECT 
          e.event_id, e.title, e.location, e.current_participants,
          c.name as category_name,
          COUNT(DISTINCT p.post_id) as total_posts,
          COUNT(DISTINCT c2.comment_id) as total_comments,
          COUNT(DISTINCT pr.user_id) as total_reactions,
          (e.current_participants * 3 + 
           COUNT(DISTINCT p.post_id) * 5 + 
           COUNT(DISTINCT c2.comment_id) * 2 + 
           COUNT(DISTINCT pr.user_id)) as engagement_score
         FROM Events e
         LEFT JOIN Categories c ON e.category_id = c.category_id
         LEFT JOIN Posts p ON e.event_id = p.event_id
         LEFT JOIN Comments c2 ON p.post_id = c2.post_id
         LEFT JOIN PostReactions pr ON p.post_id = pr.post_id
         WHERE e.approval_status = 'approved' 
           AND e.start_date > NOW()
           AND e.is_deleted = FALSE
         GROUP BY e.event_id
         ORDER BY engagement_score DESC
         LIMIT 10`
      );

      // Sự kiện có tin bài mới (trong 24h)
      const [eventsWithNewPosts] = await pool.execute(
        `SELECT 
            p.post_id, 
            p.content,           
            p.created_at as latest_post_time,
            p.user_id,
            u.full_name,         
            u.avatar_url,        
            e.event_id, 
            e.title,
            e.location,
            e.manager_id,
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id) as like_count,
            (SELECT COUNT(*) FROM Comments WHERE post_id = p.post_id) as comment_count,
            (SELECT COUNT(*) FROM PostReactions WHERE post_id = p.post_id AND user_id = ?) as is_liked

         FROM Posts p
         JOIN Users u ON p.user_id = u.user_id       
         JOIN Events e ON p.event_id = e.event_id    
         WHERE e.approval_status = 'approved' 
           AND e.is_deleted = FALSE
         ORDER BY p.created_at DESC                  
         LIMIT 20`,
        [user_id]
      );
      return {
        new_events: newEvents,
        trending_events: trendingEvents,
        events_with_new_posts: eventsWithNewPosts,
      };
    } catch (error) {
      throw new Error(
        `Database error in getVolunteerDashboard: ${error.message}`
      );
    }
  }

  // ==================== DASHBOARD CHO QUẢN LÝ SỰ KIỆN ====================
  static async getManagerDashboard(user_id) {
    try {
      // Sự kiện của manager này
      const [myEvents] = await pool.execute(
        `SELECT 
          e.event_id, e.title, e.approval_status, e.start_date,
          e.current_participants, e.target_participants,
          COUNT(DISTINCT p.post_id) as total_posts,
          COUNT(DISTINCT r.registration_id) as pending_registrations
         FROM Events e
         LEFT JOIN Posts p ON e.event_id = p.event_id
         LEFT JOIN Registrations r ON e.event_id = r.event_id AND r.status = 'pending'
         WHERE e.manager_id = ? AND e.is_deleted = FALSE
         GROUP BY e.event_id
         ORDER BY e.created_at DESC`,
        [user_id]
      );

      // Sự kiện mới công bố (của các manager khác)
      const [newEvents] = await pool.execute(
        `SELECT 
          e.event_id, e.title, e.location, e.start_date,
          u.full_name as manager_name,
          e.current_participants
         FROM Events e
         JOIN Users u ON e.manager_id = u.user_id
         WHERE e.approval_status = 'approved' 
           AND e.manager_id != ?
           AND e.start_date > NOW()
           AND e.is_deleted = FALSE
         ORDER BY e.created_at DESC
         LIMIT 10`,
        [user_id]
      );

      // Sự kiện thu hút (toàn hệ thống)
      const [trendingEvents] = await pool.execute(
        `SELECT 
          e.event_id, e.title, e.location,
          u.full_name as manager_name,
          e.current_participants,
          COUNT(DISTINCT p.post_id) as recent_posts
         FROM Events e
         JOIN Users u ON e.manager_id = u.user_id
         LEFT JOIN Posts p ON e.event_id = p.event_id AND p.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         WHERE e.approval_status = 'approved' 
           AND e.is_deleted = FALSE
         GROUP BY e.event_id
         ORDER BY e.current_participants DESC, recent_posts DESC
         LIMIT 10`
      );

      return {
        my_events: myEvents,
        new_events: newEvents,
        trending_events: trendingEvents,
      };
    } catch (error) {
      throw new Error(
        `Database error in getManagerDashboard: ${error.message}`
      );
    }
  }

  // ==================== DASHBOARD CHO ADMIN ====================
  static async getAdminDashboard() {
    try {
      // Sự kiện mới công bố (toàn hệ thống)
      const [newEvents] = await pool.execute(
        `SELECT 
          e.event_id, e.title, e.approval_status, e.start_date,
          u.full_name as manager_name,
          e.current_participants
         FROM Events e
         JOIN Users u ON e.manager_id = u.user_id
         WHERE e.is_deleted = FALSE
         ORDER BY e.created_at DESC
         LIMIT 10`
      );

      // Sự kiện thu hút (engagement cao)
      const [trendingEvents] = await pool.execute(
        `SELECT 
          e.event_id, e.title, e.location,
          u.full_name as manager_name,
          e.current_participants,
          COUNT(DISTINCT p.post_id) as total_posts,
          COUNT(DISTINCT c.comment_id) as total_comments,
          (e.current_participants * 3 + 
           COUNT(DISTINCT p.post_id) * 5 + 
           COUNT(DISTINCT c.comment_id) * 2) as engagement_score
         FROM Events e
         JOIN Users u ON e.manager_id = u.user_id
         LEFT JOIN Posts p ON e.event_id = p.event_id
         LEFT JOIN Comments c ON p.post_id = c.post_id
         WHERE e.approval_status = 'approved' 
           AND e.is_deleted = FALSE
         GROUP BY e.event_id
         ORDER BY engagement_score DESC
         LIMIT 10`
      );

      // Thống kê nhanh
      const [quickStats] = await pool.execute(
        `SELECT 
          (SELECT COUNT(*) FROM Events WHERE approval_status = 'pending' AND is_deleted = FALSE) as pending_events,
          (SELECT COUNT(*) FROM Registrations WHERE status = 'pending') as pending_registrations,
          (SELECT COUNT(*) FROM Users WHERE status = 'Active') as active_users,
          (SELECT COUNT(*) FROM Events WHERE start_date >= CURDATE() AND approval_status = 'approved') as upcoming_events`
      );

      return {
        new_events: newEvents,
        trending_events: trendingEvents,
        quick_stats: quickStats[0] || {},
      };
    } catch (error) {
      throw new Error(`Database error in getAdminDashboard: ${error.message}`);
    }
  }

  // ==================== THỐNG KÊ TỔNG QUAN ====================
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

  // ==================== THỐNG KÊ EVENTS THEO THỜI GIAN ====================
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

  // ==================== TOP EVENTS ENGAGEMENT ====================
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

  // ==================== THỐNG KÊ EVENTS THEO CATEGORY ====================
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

  // ==================== TOP USERS TÍCH CỰC ====================
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

  // ==================== XU HƯỚNG ĐĂNG KÝ ====================
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

  // ==================== SYSTEM HEALTH ====================
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
