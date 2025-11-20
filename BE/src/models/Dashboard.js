import pool from "../config/db.js";

class Dashboard {
  // ==================== DASHBOARD CHO TÌNH NGUYỆN VIÊN ====================
  static async getVolunteerDashboard(user_id) {
    try {
      // 1. Sự kiện mới công bố (chưa tham gia)
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

      // 2. Sự kiện thu hút (nhiều thành viên/trao đổi/like)
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

      // 3. Sự kiện có tin bài mới (trong 24h)
      const [eventsWithNewPosts] = await pool.execute(
        `SELECT DISTINCT
          e.event_id, e.title, e.location,
          p.created_at as latest_post_time
         FROM Events e
         JOIN Posts p ON e.event_id = p.event_id
         WHERE e.approval_status = 'approved'
           AND p.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
         ORDER BY p.created_at DESC
         LIMIT 10`
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
      // 1. Sự kiện của manager này
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

      // 2. Sự kiện mới công bố (của các manager khác)
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

      // 3. Sự kiện thu hút (toàn hệ thống)
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
      // 1. Sự kiện mới công bố (toàn hệ thống)
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

      // 2. Sự kiện thu hút (engagement cao)
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

      // 3. Thống kê nhanh
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
}

export default Dashboard;
