-- ==========================================================
-- Migration: Add Document Management Tables
-- Portal: Unified Civic Scheme & Eligibility Portal
-- Run this ONCE against gov_scheme_tracker database
-- ==========================================================

USE `gov_scheme_tracker`;

-- 1. User Documents Table
-- Stores documents uploaded by users (user-scoped, NOT application-scoped)
CREATE TABLE IF NOT EXISTS `user_documents` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `doc_type` VARCHAR(50) NOT NULL COMMENT 'aadhaar|marksheet_10th|marksheet_12th|income_certificate|caste_certificate|domicile_certificate|bank_passbook|other',
    `original_filename` VARCHAR(500) NOT NULL,
    `stored_filename` VARCHAR(500) NOT NULL COMMENT 'Secure random filename on disk',
    `file_path` VARCHAR(1000) NOT NULL COMMENT 'Absolute path on server',
    `mime_type` VARCHAR(100) NOT NULL,
    `file_size_bytes` INT NOT NULL,
    `status` VARCHAR(50) DEFAULT 'Submitted' COMMENT 'Submitted|Processing|Processed|Failed|Rejected',
    `extracted_data` JSON DEFAULT NULL COMMENT 'Structured info extracted from document',
    `processing_notes` TEXT DEFAULT NULL COMMENT 'Notes from processing (errors, warnings)',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'FALSE for replaced/superseded documents',
    `uploaded_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX `idx_user_doc_type` (`user_id`, `doc_type`),
    INDEX `idx_user_active` (`user_id`, `is_active`),
    INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Scheme Required Document Types Table
-- Maps which document types are required/recommended for each scheme
CREATE TABLE IF NOT EXISTS `scheme_required_doc_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `scheme_id` INT NOT NULL,
    `doc_type` VARCHAR(50) NOT NULL COMMENT 'Must match doc_type in user_documents',
    `is_mandatory` BOOLEAN DEFAULT TRUE,
    `display_label` VARCHAR(255) NOT NULL COMMENT 'Human-readable label for UI display',
    UNIQUE KEY `unique_scheme_doc` (`scheme_id`, `doc_type`),
    FOREIGN KEY (`scheme_id`) REFERENCES `schemes`(`id`) ON DELETE CASCADE,
    INDEX `idx_scheme_id` (`scheme_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Add eligibility_snapshot to applications table (if not already present)
-- Stores the eligibility result at time of application creation
ALTER TABLE `applications` 
    ADD COLUMN IF NOT EXISTS `eligibility_snapshot` JSON DEFAULT NULL COMMENT 'Eligibility result at time of application',
    ADD COLUMN IF NOT EXISTS `doc_checklist_status` JSON DEFAULT NULL COMMENT 'Document checklist status snapshot';
