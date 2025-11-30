-- Database setup for 4D-Signs user authentication
-- Run this in phpMyAdmin or MySQL command line

-- Use the existing database '4d_signs_db' that you have in phpMyAdmin
-- If you'd like to create it here, uncomment the next two lines and edit as needed
-- CREATE DATABASE IF NOT EXISTS `4d_signs_db`;
USE `4d_signs_db`;

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL, -- For hashed passwords
    `phone` VARCHAR(20) NOT NULL UNIQUE,
    `profile_pic_path` VARCHAR(255), -- Path to uploaded image, eg. uploads/filename.jpg
    `is_admin` TINYINT(1) DEFAULT 0,
    `last_login` DATETIME NULL,
    `otp_code_hash` VARCHAR(255) DEFAULT NULL,
    `otp_expires_at` DATETIME DEFAULT NULL,
    `is_verified` TINYINT(1) DEFAULT 0,
    `otp_method` ENUM('sms','email') DEFAULT 'sms',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('active', 'inactive') DEFAULT 'active'
);

-- Temporary pending registrations table for OTP verified account creation
CREATE TABLE IF NOT EXISTS `pending_registrations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL,
    `email` VARCHAR(100) NOT NULL,
    `password_hash` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `profile_pic_path` VARCHAR(255) DEFAULT NULL,
    `otp_code_hash` VARCHAR(255) DEFAULT NULL,
    `otp_expires_at` DATETIME DEFAULT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Compatibility upgrades: add new columns if they do not exist (safe across versions)
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `profile_pic_path` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `is_admin` TINYINT(1) DEFAULT 0;
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `last_login` DATETIME DEFAULT NULL;

-- Optional: if you have old base64 data in `profile_pic` and want to migrate it to files, create a script to decode and store the images and then update `profile_pic_path` accordingly.

-- Optional: Create an admin user
-- INSERT INTO users (username, email, password, phone) VALUES ('admin', 'admin@4dsigns.com', '$2y$10$examplehashedpassword', '09123456789');