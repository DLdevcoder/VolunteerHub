DROP DATABASE IF EXISTS `volunteerhub_db`;

CREATE DATABASE `volunteerhub_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `volunteerhub_db`;

CREATE TABLE `Users` (
    `user_id` INT AUTO_INCREMENT PRIMARY KEY,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `role` ENUM('user', 'admin') NOT NULL DEFAULT 'user',
    `account_status` ENUM('active', 'locked') NOT NULL DEFAULT 'active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE `Categories` (
    `category_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `description` TEXT NULL
);

CREATE TABLE `Events` (
    `event_id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `description` TEXT NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NULL,
    `category_id` INT NULL,
    `status` ENUM('pending_approval', 'approved', 'cancelled') NOT NULL DEFAULT 'pending_approval',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`category_id`) REFERENCES `Categories`(`category_id`) ON DELETE SET NULL
);

CREATE TABLE `EventMembers` (
    `event_member_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `event_id` INT NOT NULL,
    `role` ENUM('manager', 'volunteer') NOT NULL,
    `status` ENUM('pending', 'approved', 'cancelled', 'completed') NOT NULL DEFAULT 'pending',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Nếu User hoặc Event bị xóa, bản ghi thành viên này cũng bị xóa theo
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`event_id`) REFERENCES `Events`(`event_id`) ON DELETE CASCADE,

    UNIQUE (`user_id`, `event_id`)
);

-- Bảng `Posts`: Tham chiếu đến `Users` và `Events`
CREATE TABLE `Posts` (
    `post_id` INT AUTO_INCREMENT PRIMARY KEY,
    `content` TEXT NOT NULL,
    `user_id` INT NOT NULL,
    `event_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`event_id`) REFERENCES `Events`(`event_id`) ON DELETE CASCADE
);

-- Bảng `Comments`: Tham chiếu đến `Users` và `Posts`
CREATE TABLE `Comments` (
    `comment_id` INT AUTO_INCREMENT PRIMARY KEY,
    `content` TEXT NOT NULL,
    `user_id` INT NOT NULL,
    `post_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `Posts`(`post_id`) ON DELETE CASCADE
);

-- Bảng `Likes`: Tham chiếu đến `Users`
CREATE TABLE `Likes` (
    `like_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `likable_id` INT NOT NULL,
    `likable_type` ENUM('post', 'comment') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`user_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE,
    
    UNIQUE (`user_id`, `likable_id`, `likable_type`)
);

-- Bảng `Notifications`: Tham chiếu đến `Users`
CREATE TABLE `Notifications` (
    `notification_id` INT AUTO_INCREMENT PRIMARY KEY,
    `recipient_id` INT NOT NULL,
    `content` VARCHAR(255) NOT NULL,
    `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
    `related_url` VARCHAR(255) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`recipient_id`) REFERENCES `Users`(`user_id`) ON DELETE CASCADE
);

-- ===================================================================
-- Bước 5: Thêm dữ liệu mẫu và tạo chỉ mục (tùy chọn nhưng nên có)
-- ===================================================================

-- Thêm dữ liệu mẫu cho bảng Categories
INSERT INTO `Categories` (`name`, `description`) VALUES
('Môi trường', 'Các hoạt động liên quan đến bảo vệ môi trường như trồng cây, dọn rác.'),
('Giáo dục', 'Các hoạt động dạy học, chia sẻ kiến thức, bình dân học vụ số.'),
('Xã hội', 'Các hoạt động từ thiện, giúp đỡ người có hoàn cảnh khó khăn.');

-- Tạo chỉ mục (Index) để tăng tốc độ truy vấn
CREATE INDEX idx_events_start_time ON `Events`(`start_time`);
CREATE INDEX idx_events_status ON `Events`(`status`);

-- ===================================================================
-- HOÀN TẤT
-- ===================================================================