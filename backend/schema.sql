-- ==========================================================
-- Database Schema for Unified Civic Scheme & Eligibility Portal
-- Database Engine: MySQL
-- ==========================================================

CREATE DATABASE IF NOT EXISTS `gov_scheme_tracker`
    DEFAULT CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE `gov_scheme_tracker`;

-- 1. Users Table
CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `full_name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `role` VARCHAR(50) DEFAULT 'USER',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Profiles Table
CREATE TABLE IF NOT EXISTS `profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `age` INT DEFAULT NULL,
    `gender` VARCHAR(50) DEFAULT 'All',
    `state` VARCHAR(100) DEFAULT 'All',
    `annual_income` DECIMAL(12,2) DEFAULT NULL,
    `occupation` VARCHAR(100) DEFAULT 'All',
    `category` VARCHAR(50) DEFAULT 'General',
    `student_status` BOOLEAN DEFAULT FALSE,
    `farmer_status` BOOLEAN DEFAULT FALSE,
    `disability_status` BOOLEAN DEFAULT FALSE,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Schemes Table
CREATE TABLE IF NOT EXISTS `schemes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `objective` TEXT,
    `benefits` TEXT,
    `eligibility_rules` TEXT,
    `age_min` INT DEFAULT 0,
    `age_max` INT DEFAULT 120,
    `income_limit` DECIMAL(12,2) DEFAULT NULL,
    `gender` VARCHAR(50) DEFAULT 'All',
    `occupation` VARCHAR(100) DEFAULT 'All',
    `category_requirement` VARCHAR(100) DEFAULT 'All',
    `state_requirement` VARCHAR(100) DEFAULT 'All',
    `student_requirement` BOOLEAN DEFAULT FALSE,
    `farmer_requirement` BOOLEAN DEFAULT FALSE,
    `disability_requirement` BOOLEAN DEFAULT FALSE,
    `required_documents` TEXT,
    `application_process` TEXT,
    `official_portal_url` VARCHAR(500) NOT NULL,
    `deadline` VARCHAR(100) DEFAULT 'Ongoing',
    `status` VARCHAR(50) DEFAULT 'Active',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_category` (`category`),
    INDEX `idx_state` (`state_requirement`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Saved Schemes Table
CREATE TABLE IF NOT EXISTS `saved_schemes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `scheme_id` INT NOT NULL,
    `saved_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_scheme` (`user_id`, `scheme_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`scheme_id`) REFERENCES `schemes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Applications Table
CREATE TABLE IF NOT EXISTS `applications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `scheme_id` INT NOT NULL,
    `reference_number` VARCHAR(100) NOT NULL UNIQUE,
    `submission_date` DATE DEFAULT NULL,
    `status` VARCHAR(50) DEFAULT 'Draft',
    `deadline` DATE DEFAULT NULL,
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`scheme_id`) REFERENCES `schemes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Documents Table
CREATE TABLE IF NOT EXISTS `documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `application_id` INT NOT NULL,
    `document_name` VARCHAR(255) NOT NULL,
    `is_submitted` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Notifications Table
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `message` TEXT NOT NULL,
    `notification_type` VARCHAR(50) DEFAULT 'general',
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
