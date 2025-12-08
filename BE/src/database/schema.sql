DROP DATABASE IF EXISTS `volunteerhub_db`;

CREATE DATABASE `volunteerhub_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `volunteerhub_db`;

-- ====================================================================
-- I. QUẢN LÝ NGƯỜI DÙNG & VAI TRÒ
-- ====================================================================

-- Bảng Roles
CREATE TABLE `Roles` (
    `role_id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(50) UNIQUE NOT NULL,
    `description` VARCHAR(255) COMMENT 'Mô tả vai trò'
) ENGINE=InnoDB COMMENT='Vai trò: Admin, Manager, Volunteer';

-- Bảng Users
CREATE TABLE `Users` (
    `user_id` INT PRIMARY KEY AUTO_INCREMENT,
    `email` VARCHAR(100) UNIQUE NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar_url` VARCHAR(255),
    `phone` VARCHAR(20),
    `full_name` VARCHAR(100) NOT NULL,
    `role_id` INT NOT NULL,
    `status` ENUM('Active', 'Locked', 'Suspended') DEFAULT 'Active' NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`role_id`) REFERENCES `Roles`(`role_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Tài khoản người dùng';

-- ====================================================================
-- II. QUẢN LÝ SỰ KIỆN & ĐĂNG KÝ
-- ====================================================================

-- Bảng Categories
CREATE TABLE `Categories` (
    `category_id` INT PRIMARY KEY AUTO_INCREMENT,
    `name` VARCHAR(100) UNIQUE NOT NULL,
    `description` TEXT NULL,
    `display_order` INT DEFAULT 0
) ENGINE=InnoDB COMMENT='Danh mục sự kiện';

-- Bảng Events
CREATE TABLE `Events` (
    `event_id` INT AUTO_INCREMENT PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `target_participants` INT UNSIGNED NULL COMMENT 'Số lượng tình nguyện viên mục tiêu', 
    `current_participants` INT UNSIGNED DEFAULT 0 COMMENT 'Số lượng thành viên đã được duyệt (maintained by Trigger)',
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `manager_id` INT NOT NULL,
    `category_id` INT NULL,
    `approval_status` ENUM('pending','approved','rejected') DEFAULT 'pending' NOT NULL,
    `rejection_reason` VARCHAR(255),
    `approved_by` INT,
    `approval_date` DATETIME NULL COMMENT 'Ngày duyệt sự kiện',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    `is_deleted` BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Cờ xóa mềm',
    
    CONSTRAINT `chk_event_dates` CHECK (`start_date` <= `end_date`),

    FOREIGN KEY (`manager_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`category_id`) REFERENCES `Categories`(`category_id`) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (`approved_by`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Sự kiện tình nguyện';

-- Bảng Registrations
CREATE TABLE `Registrations` (
    `registration_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `event_id` INT NOT NULL,
    `registration_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('pending','approved','rejected','completed','cancelled') DEFAULT 'pending' NOT NULL,
    `rejection_reason` VARCHAR(255) NULL COMMENT 'Lý do bị từ chối',
    `completed_by_manager_id` INT,
    `completion_date` DATETIME NULL,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE(user_id, event_id),
    
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY (`event_id`) REFERENCES `Events`(`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`completed_by_manager_id`) REFERENCES `Users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Đăng ký tham gia sự kiện';

-- ====================================================================
-- III. TÍNH NĂNG XÃ HỘI & THÔNG BÁO (KÊNH TRAO ĐỔI)
-- ====================================================================

-- Bảng Posts
CREATE TABLE `Posts` (
    `post_id` INT PRIMARY KEY AUTO_INCREMENT,
    `event_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`event_id`) REFERENCES `Events`(`event_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Bài đăng trên kênh sự kiện';

-- Bảng Comments
CREATE TABLE `Comments` (
    `comment_id` INT PRIMARY KEY AUTO_INCREMENT,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `content` TEXT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`post_id`) REFERENCES `Posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Bình luận bài đăng';

-- Bảng PostReactions
CREATE TABLE `PostReactions` (
    `user_id` INT NOT NULL,
    `post_id` INT NOT NULL,
    `reaction_type` ENUM('like','love','haha','sad','angry') NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (`user_id`, `post_id`),
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `Posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Phản ứng trên bài đăng';

-- Bảng CommentReactions
CREATE TABLE `CommentReactions` (
    `user_id` INT NOT NULL,
    `comment_id` INT NOT NULL,
    `reaction_type` ENUM('like','love','haha','sad','angry') NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (`user_id`, `comment_id`),
    
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (`comment_id`) REFERENCES `Comments`(`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Phản ứng trên bình luận';

-- Bảng Notifications
CREATE TABLE `Notifications` (
    `notification_id` INT PRIMARY KEY AUTO_INCREMENT,
    `user_id` INT NOT NULL,
    `type` ENUM(
        'event_approved', 'event_rejected', 'registration_approved', 'registration_rejected',
        'registration_completed', 'event_reminder', 'new_post', 'new_comment', 'reaction_received', 'new_registration'
    ) NOT NULL,
    `payload` JSON COMMENT 'Dữ liệu bổ sung (event_id, message, etc.)',
    `is_read` BOOLEAN DEFAULT FALSE NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB COMMENT='Thông báo người dùng';

-- ====================================================================
-- IV. DỮ LIỆU MẪU (SEED DATA)
-- ====================================================================

INSERT INTO `Roles` (`name`, `description`) VALUES
('Admin', 'Quản trị viên hệ thống - toàn quyền'),
('Manager', 'Quản lý sự kiện - tạo và quản lý events'),
('Volunteer', 'Tình nguyện viên - đăng ký tham gia events');

INSERT INTO `Categories` (`name`, `description`, `display_order`) VALUES
('Môi trường', 'Các hoạt động liên quan đến bảo vệ môi trường như trồng cây, dọn rác.', 1),
('Giáo dục', 'Các hoạt động dạy học, chia sẻ kiến thức, bình dân học vụ số.', 2),
('Xã hội', 'Các hoạt động từ thiện, giúp đỡ người có hoàn cảnh khó khăn.', 3);

-- ====================================================================
-- V. INDEXES
-- ====================================================================

CREATE INDEX idx_users_role_status ON `Users`(`role_id`, `status`);
CREATE INDEX idx_users_email ON `Users`(`email`);
CREATE INDEX idx_events_start_date ON `Events`(`start_date`);
CREATE INDEX idx_events_approval_status ON `Events`(`approval_status`);
CREATE INDEX idx_events_manager ON `Events`(`manager_id`);
CREATE INDEX idx_events_category ON `Events`(`category_id`);
CREATE INDEX idx_events_approved_by ON `Events`(`approved_by`);
CREATE INDEX idx_events_status_date ON `Events`(`approval_status`, `start_date`);
CREATE INDEX idx_events_category_status ON `Events`(`category_id`, `approval_status`);
CREATE INDEX idx_registrations_event ON `Registrations`(`event_id`);
CREATE INDEX idx_registrations_status ON `Registrations`(`status`);
CREATE INDEX idx_registrations_completed_by ON `Registrations`(`completed_by_manager_id`);
CREATE INDEX idx_registrations_event_status ON `Registrations`(`event_id`, `status`);
CREATE INDEX idx_posts_event ON `Posts`(`event_id`);
CREATE INDEX idx_posts_user ON `Posts`(`user_id`);
CREATE INDEX idx_posts_event_created ON `Posts`(`event_id`, `created_at` DESC);
CREATE INDEX idx_comments_post ON `Comments`(`post_id`);
CREATE INDEX idx_comments_user ON `Comments`(`user_id`);
CREATE INDEX idx_comments_post_created ON `Comments`(`post_id`, `created_at` DESC);
CREATE INDEX idx_postreactions_post ON `PostReactions`(`post_id`);
CREATE INDEX idx_commentreactions_comment ON `CommentReactions`(`comment_id`);
CREATE INDEX idx_notifications_user_read ON `Notifications`(`user_id`, `is_read`);
CREATE INDEX idx_notifications_type ON `Notifications`(`type`);
CREATE INDEX idx_notifications_created ON `Notifications`(`created_at` DESC);

-- ====================================================================
-- VI. VIEWS
-- ====================================================================

CREATE VIEW `v_active_events` AS
SELECT 
    e.event_id, e.title, e.description, e.start_date, e.end_date, e.location,
    c.name AS category_name, u.full_name AS manager_name, u.email AS manager_email,
    e.target_participants, 
    e.current_participants AS approved_registrations
FROM `Events` e
LEFT JOIN `Categories` c ON e.category_id = c.category_id
LEFT JOIN `Users` u ON e.manager_id = u.user_id
WHERE e.approval_status = 'approved'
  AND e.end_date >= NOW();

CREATE VIEW `v_user_event_history` AS
SELECT 
    r.user_id, u.full_name, u.email, e.event_id, e.title AS event_title,
    e.start_date, e.end_date, r.status, r.registration_date, r.completion_date,
    r.rejection_reason, 
    CASE WHEN r.status = 'completed' THEN 1 ELSE 0 END AS is_completed
FROM `Registrations` r
JOIN `Users` u ON r.user_id = u.user_id
JOIN `Events` e ON r.event_id = e.event_id
WHERE u.status = 'Active';

CREATE VIEW `v_event_engagement` AS
SELECT 
    e.event_id, e.title, e.start_date, e.approval_date,
    e.current_participants AS total_volunteers,
    COUNT(DISTINCT p.post_id) AS total_posts,
    COUNT(DISTINCT c.comment_id) AS total_comments,
    COUNT(DISTINCT pr.user_id) AS total_reactions,
    (e.current_participants * 3 + COUNT(DISTINCT p.post_id) * 5 + COUNT(DISTINCT c.comment_id) * 2 + COUNT(DISTINCT pr.user_id)) AS engagement_score
FROM `Events` e
LEFT JOIN `Posts` p ON e.event_id = p.event_id
LEFT JOIN `Comments` c ON p.post_id = c.post_id
LEFT JOIN `PostReactions` pr ON p.post_id = pr.post_id
WHERE e.approval_status = 'approved'
GROUP BY e.event_id
ORDER BY engagement_score DESC;

CREATE VIEW `v_recent_activity` AS
SELECT 'new_event' AS activity_type, e.event_id AS related_id, e.title AS title, e.approval_date AS activity_time
FROM `Events` e
WHERE e.approval_status = 'approved' AND e.approval_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
UNION ALL
SELECT 'new_post' AS activity_type, p.post_id AS related_id, CONCAT('Post in: ', e.title) AS title, p.created_at AS activity_time
FROM `Posts` p
JOIN `Events` e ON p.event_id = e.event_id
WHERE p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY activity_time DESC
LIMIT 20;

CREATE VIEW `v_user_statistics` AS
SELECT 
    u.user_id, u.full_name, u.email, r.name AS role_name,
    COUNT(DISTINCT reg.event_id) AS total_events_joined,
    SUM(CASE WHEN reg.status = 'completed' THEN 1 ELSE 0 END) AS completed_events,
    COUNT(DISTINCT p.post_id) AS total_posts,
    COUNT(DISTINCT c.comment_id) AS total_comments
FROM `Users` u
LEFT JOIN `Roles` r ON u.role_id = r.role_id
LEFT JOIN `Registrations` reg ON u.user_id = reg.user_id
LEFT JOIN `Posts` p ON u.user_id = p.user_id
LEFT JOIN `Comments` c ON u.user_id = c.user_id
WHERE u.status = 'Active'
GROUP BY u.user_id;

-- Thêm type mới vào bảng Notifications
ALTER TABLE Notifications 
MODIFY COLUMN type ENUM(
    'event_approved', 'event_rejected', 'registration_approved', 'registration_rejected',
    'registration_completed', 'event_reminder', 'new_post', 'new_comment', 'reaction_received',
    'new_registration', 'event_updated_urgent', 'account_locked', 'manager_account_locked', 
    'event_starting_soon', 'event_cancelled'
) NOT NULL;

CREATE TABLE `PushSubscriptions` (
  `subscription_id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `endpoint` TEXT NOT NULL,
  `keys` JSON NOT NULL,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_endpoint (endpoint(255))
) ENGINE=InnoDB COMMENT='Lưu trữ subscription cho Web Push';

-- ====================================================================
-- ====================================================================
-- VII. STORED PROCEDURES
-- ====================================================================

DELIMITER //

CREATE PROCEDURE `sp_approve_event`(
    IN p_event_id INT,
    IN p_admin_id INT
)
BEGIN
    UPDATE `Events`
    SET `approval_status` = 'approved',
        `approved_by` = p_admin_id,
        `approval_date` = NOW(),
        `rejection_reason` = NULL 
    WHERE `event_id` = p_event_id 
      AND `is_deleted` = FALSE; 
    SELECT ROW_COUNT() as affected;
END//

CREATE PROCEDURE `sp_complete_registration`(
    IN p_user_id INT,
    IN p_event_id INT,
    IN p_manager_id INT
)
BEGIN
    UPDATE `Registrations`
    SET `status` = 'completed',
        `completed_by_manager_id` = p_manager_id,
        `completion_date` = NOW()
    WHERE `user_id` = p_user_id AND `event_id` = p_event_id;
    
    SELECT 'Registration completed successfully' AS message;
END//

CREATE PROCEDURE `sp_cancel_registration`(
    IN p_user_id INT,
    IN p_event_id INT
)
BEGIN
    DECLARE v_start_date DATETIME;
    
    SELECT `start_date` INTO v_start_date FROM `Events` WHERE `event_id` = p_event_id;
    
    IF v_start_date <= NOW() THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot cancel registration - event has already started';
    END IF;
    
    UPDATE `Registrations`
    SET `status` = 'cancelled'
    WHERE `user_id` = p_user_id AND `event_id` = p_event_id;
    
    SELECT 'Registration cancelled successfully' AS message;
END//

CREATE PROCEDURE `sp_reject_registration`(
    IN p_user_id INT,
    IN p_event_id INT,
    IN p_reason VARCHAR(255)
)
BEGIN
    UPDATE `Registrations`
    SET `status` = 'rejected',
        `rejection_reason` = p_reason
    WHERE `user_id` = p_user_id AND `event_id` = p_event_id AND `status` = 'pending';
END//

DELIMITER ;

-- ====================================================================
-- VIII. TRIGGERS
-- ====================================================================

DELIMITER //



CREATE TRIGGER `trg_registration_after_insert`
AFTER INSERT ON `Registrations`
FOR EACH ROW
BEGIN
    IF NEW.status = 'approved' THEN
        UPDATE `Events` 
        SET `current_participants` = `current_participants` + 1
        WHERE `event_id` = NEW.event_id;
    END IF;
END//

CREATE TRIGGER `trg_registration_after_update`
AFTER UPDATE ON `Registrations`
FOR EACH ROW
BEGIN
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        UPDATE `Events` 
        SET `current_participants` = `current_participants` + 1
        WHERE `event_id` = NEW.event_id;
    END IF;
    
    IF OLD.status = 'approved' AND NEW.status != 'approved' THEN
        UPDATE `Events` 
        SET `current_participants` = GREATEST(`current_participants` - 1, 0)
        WHERE `event_id` = NEW.event_id;
    END IF;
END//


CREATE TRIGGER `trg_registration_after_delete`
AFTER DELETE ON `Registrations`
FOR EACH ROW
BEGIN
    IF OLD.status = 'approved' THEN
        UPDATE `Events` 
        SET `current_participants` = GREATEST(`current_participants` - 1, 0)
        WHERE `event_id` = OLD.event_id;
    END IF;
END//

DELIMITER ;