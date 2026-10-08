-- ====================================================
-- SMART HOSPITAL RESOURCE MANAGEMENT & OPTIMIZATION SYSTEM
-- Complete MySQL 8.0 DDL Schema & Initial Dataset
-- Database: smart_hospital
-- Credentials: root:bitsathy@localhost:3306
-- ====================================================

CREATE DATABASE IF NOT EXISTS `smart_hospital` 
    CHARACTER SET utf8mb4 
    COLLATE utf8mb4_unicode_ci;

USE `smart_hospital`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Departments
DROP TABLE IF EXISTS `departments`;
CREATE TABLE `departments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL UNIQUE,
    `code` VARCHAR(20) NOT NULL UNIQUE,
    `head_doctor_name` VARCHAR(150),
    `floor_number` INT DEFAULT 1,
    `contact_extension` VARCHAR(20),
    `bed_capacity` INT DEFAULT 20
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Users (Admin, Doctors, Nurses, Patients, Receptionists)
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'RECEPTIONIST') NOT NULL,
    `full_name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) UNIQUE,
    `phone` VARCHAR(50),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_user_username` (`username`),
    INDEX `idx_user_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Doctors
DROP TABLE IF EXISTS `doctors`;
CREATE TABLE `doctors` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNIQUE,
    `employee_id` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `specialization` VARCHAR(100) NOT NULL,
    `department_id` BIGINT NOT NULL,
    `qualification` VARCHAR(100) NOT NULL,
    `experience_years` INT NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `consultation_fee` DECIMAL(10,2) DEFAULT 50.00,
    `availability_status` ENUM('AVAILABLE', 'IN_CONSULTATION', 'ON_LEAVE', 'OFF_DUTY') DEFAULT 'AVAILABLE',
    `max_patients_per_day` INT DEFAULT 25,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
    INDEX `idx_doc_dept` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Nurses
DROP TABLE IF EXISTS `nurses`;
CREATE TABLE `nurses` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNIQUE,
    `employee_id` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `department_id` BIGINT NOT NULL,
    `skill_level` ENUM('ICU_CERTIFIED', 'EMERGENCY_TRAINED', 'SENIOR_STAFF', 'GENERAL_WARD') NOT NULL,
    `qualification` VARCHAR(100) NOT NULL,
    `experience_years` INT NOT NULL,
    `phone` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150) NOT NULL,
    `current_workload` INT DEFAULT 0,
    `shift_preference` VARCHAR(20) DEFAULT 'MORNING',
    `availability_status` ENUM('AVAILABLE', 'ON_DUTY', 'ON_LEAVE', 'OFF_DUTY') DEFAULT 'AVAILABLE',
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
    INDEX `idx_nurse_dept` (`department_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Beds
DROP TABLE IF EXISTS `beds`;
CREATE TABLE `beds` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `bed_number` VARCHAR(50) NOT NULL UNIQUE,
    `ward` VARCHAR(100) NOT NULL,
    `department_id` BIGINT NOT NULL,
    `bed_type` ENUM('ICU', 'EMERGENCY', 'GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'PEDIATRIC') NOT NULL,
    `floor_number` INT NOT NULL,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    `current_patient_id` BIGINT,
    `has_ventilator` BOOLEAN DEFAULT FALSE,
    `has_oxygen_support` BOOLEAN DEFAULT TRUE,
    `last_cleaned_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
    INDEX `idx_bed_status` (`status`),
    INDEX `idx_bed_type` (`bed_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Patients
DROP TABLE IF EXISTS `patients`;
CREATE TABLE `patients` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT UNIQUE,
    `op_number` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `dob` DATE,
    `age` INT NOT NULL,
    `gender` ENUM('Male', 'Female', 'Other'),
    `blood_group` VARCHAR(10),
    `phone` VARCHAR(50) NOT NULL,
    `email` VARCHAR(150),
    `address` TEXT,
    `emergency_contact` VARCHAR(200) NOT NULL,
    `admission_status` ENUM('OUTPATIENT', 'ADMITTED', 'DISCHARGED', 'IN_TRIAGE') DEFAULT 'OUTPATIENT',
    `assigned_department_id` BIGINT,
    `assigned_doctor_id` BIGINT,
    `current_bed_id` BIGINT,
    `severity` ENUM('EMERGENCY', 'CRITICAL', 'HIGH', 'NORMAL') DEFAULT 'NORMAL',
    `triage_notes` TEXT,
    `registration_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`assigned_department_id`) REFERENCES `departments`(`id`),
    FOREIGN KEY (`assigned_doctor_id`) REFERENCES `doctors`(`id`),
    FOREIGN KEY (`current_bed_id`) REFERENCES `beds`(`id`),
    INDEX `idx_patient_op` (`op_number`),
    INDEX `idx_patient_status` (`admission_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bed current patient constraint
ALTER TABLE `beds` ADD CONSTRAINT `fk_beds_patient` FOREIGN KEY (`current_patient_id`) REFERENCES `patients`(`id`) ON DELETE SET NULL;

-- 7. Bed Allocations (Greedy Algorithm Results)
DROP TABLE IF EXISTS `bed_allocations`;
CREATE TABLE `bed_allocations` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `bed_id` BIGINT NOT NULL,
    `patient_id` BIGINT NOT NULL,
    `allocation_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `release_time` TIMESTAMP NULL,
    `algorithm_score` DOUBLE,
    `decision_rationale` TEXT,
    `allocated_by` VARCHAR(100) DEFAULT 'SYSTEM_GREEDY_OPT',
    `status` ENUM('ACTIVE', 'DISCHARGED', 'TRANSFERRED') DEFAULT 'ACTIVE',
    FOREIGN KEY (`bed_id`) REFERENCES `beds`(`id`),
    FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Appointments
DROP TABLE IF EXISTS `appointments`;
CREATE TABLE `appointments` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `patient_id` BIGINT NOT NULL,
    `doctor_id` BIGINT NOT NULL,
    `department_id` BIGINT NOT NULL,
    `appointment_date` DATE NOT NULL,
    `time_slot` VARCHAR(50) NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'PENDING',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`),
    FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`),
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
    UNIQUE KEY `uq_doc_slot` (`doctor_id`, `appointment_date`, `time_slot`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Emergency Cases
DROP TABLE IF EXISTS `emergency_cases`;
CREATE TABLE `emergency_cases` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `case_number` VARCHAR(50) NOT NULL UNIQUE,
    `patient_id` BIGINT NULL,
    `patient_name` VARCHAR(150) NOT NULL,
    `emergency_type` VARCHAR(150) NOT NULL,
    `severity` ENUM('CRITICAL_1', 'EMERGENT_2', 'URGENT_3', 'LESS_URGENT_4', 'NON_URGENT_5') NOT NULL,
    `triage_score` INT NOT NULL,
    `arrival_time` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `assigned_doctor_id` BIGINT NULL,
    `assigned_nurse_id` BIGINT NULL,
    `required_bed_type` VARCHAR(50) DEFAULT 'EMERGENCY',
    `status` ENUM('PENDING', 'TRIAGED', 'IN_TREATMENT', 'RESOLVED') DEFAULT 'PENDING',
    `triage_notes` TEXT,
    FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`assigned_doctor_id`) REFERENCES `doctors`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`assigned_nurse_id`) REFERENCES `nurses`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 10. Medical Records (EHR)
DROP TABLE IF EXISTS `medical_records`;
CREATE TABLE `medical_records` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `patient_id` BIGINT NOT NULL,
    `doctor_id` BIGINT NOT NULL,
    `record_type` VARCHAR(100) NOT NULL,
    `diagnosis` TEXT NOT NULL,
    `clinical_notes` TEXT,
    `vitals_json` JSON,
    `record_date` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`),
    FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 11. Prescriptions
DROP TABLE IF EXISTS `prescriptions`;
CREATE TABLE `prescriptions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `patient_id` BIGINT NOT NULL,
    `doctor_id` BIGINT NOT NULL,
    `medicines_json` JSON NOT NULL,
    `dosage_instructions` TEXT NOT NULL,
    `duration_days` INT NOT NULL,
    `prescribed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `status` ENUM('ACTIVE', 'DISPENSED', 'COMPLETED') DEFAULT 'ACTIVE',
    FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`),
    FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 12. Medical Reports
DROP TABLE IF EXISTS `medical_reports`;
CREATE TABLE `medical_reports` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `patient_id` BIGINT NOT NULL,
    `doctor_id` BIGINT NOT NULL,
    `report_type` VARCHAR(100) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT,
    `file_url` VARCHAR(500),
    `report_date` DATE DEFAULT (CURRENT_DATE),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`patient_id`) REFERENCES `patients`(`id`),
    FOREIGN KEY (`doctor_id`) REFERENCES `doctors`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 13. Biomedical Equipment
DROP TABLE IF EXISTS `equipment`;
CREATE TABLE `equipment` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `serial_number` VARCHAR(100) NOT NULL UNIQUE,
    `category` VARCHAR(100) NOT NULL,
    `department_id` BIGINT NOT NULL,
    `location` VARCHAR(100) NOT NULL,
    `status` ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DAMAGED', 'OUT_OF_SERVICE') DEFAULT 'AVAILABLE',
    `last_maintenance_date` DATE,
    `next_maintenance_date` DATE,
    `assigned_patient_id` BIGINT NULL,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
    FOREIGN KEY (`assigned_patient_id`) REFERENCES `patients`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 14. Inventory / Supplies
DROP TABLE IF EXISTS `inventory`;
CREATE TABLE `inventory` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `item_name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `sku_code` VARCHAR(100) NOT NULL UNIQUE,
    `quantity` INT NOT NULL DEFAULT 0,
    `minimum_stock` INT NOT NULL DEFAULT 20,
    `unit` VARCHAR(50) NOT NULL,
    `unit_price` DECIMAL(10,2) DEFAULT 0.00,
    `supplier` VARCHAR(150) NOT NULL,
    `expiry_date` DATE NOT NULL,
    `batch_number` VARCHAR(100) NOT NULL,
    `storage_location` VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 15. Inventory Transactions
DROP TABLE IF EXISTS `inventory_transactions`;
CREATE TABLE `inventory_transactions` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `inventory_id` BIGINT NOT NULL,
    `transaction_type` ENUM('CONSUMPTION', 'RESTOCK', 'ADJUSTMENT') NOT NULL,
    `quantity_changed` INT NOT NULL,
    `performed_by` VARCHAR(100) NOT NULL,
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`inventory_id`) REFERENCES `inventory`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 16. Nurse Shifts
DROP TABLE IF EXISTS `nurse_shifts`;
CREATE TABLE `nurse_shifts` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `shift_date` DATE NOT NULL,
    `shift_type` ENUM('MORNING', 'AFTERNOON', 'NIGHT') NOT NULL,
    `department_id` BIGINT NOT NULL,
    `predicted_workload_score` DOUBLE NOT NULL,
    `required_nurses` INT NOT NULL,
    `assigned_nurse_id` BIGINT NOT NULL,
    `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'SCHEDULED',
    `optimization_reason` TEXT,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`),
    FOREIGN KEY (`assigned_nurse_id`) REFERENCES `nurses`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 17. Leave Requests
DROP TABLE IF EXISTS `leave_requests`;
CREATE TABLE `leave_requests` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `staff_type` ENUM('NURSE', 'DOCTOR', 'STAFF') NOT NULL,
    `staff_id` BIGINT NOT NULL,
    `staff_name` VARCHAR(150) NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,
    `reason` TEXT NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    `reviewer_remarks` TEXT,
    `reviewed_by` VARCHAR(100),
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 18. Facilities
DROP TABLE IF EXISTS `facilities`;
CREATE TABLE `facilities` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(150) NOT NULL,
    `category` VARCHAR(100) NOT NULL,
    `description` TEXT NOT NULL,
    `location` VARCHAR(150) NOT NULL,
    `operating_hours` VARCHAR(100) NOT NULL,
    `contact_number` VARCHAR(50) NOT NULL,
    `status` ENUM('AVAILABLE', 'BUSY', 'EMERGENCY_ONLY', 'TEMPORARILY_CLOSED') NOT NULL,
    `capacity_metric` VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 19. Audit Logs
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(100) NOT NULL,
    `role` VARCHAR(50) NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `module` VARCHAR(100) NOT NULL,
    `record_id` VARCHAR(100),
    `details` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 20. Notifications
DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `user_id` BIGINT NULL,
    `target_role` VARCHAR(50),
    `title` VARCHAR(150) NOT NULL,
    `message` TEXT NOT NULL,
    `notification_type` ENUM('EMERGENCY', 'BED_UPDATE', 'SHIFT_ASSIGN', 'APPOINTMENT', 'INVENTORY_ALERT', 'GENERAL') NOT NULL,
    `is_read` BOOLEAN DEFAULT FALSE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 21. Machine Learning Telemetry
DROP TABLE IF EXISTS `ml_training_data`;
CREATE TABLE `ml_training_data` (
    `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
    `record_date` DATE NOT NULL,
    `day_of_week` INT NOT NULL,
    `month` INT NOT NULL,
    `admissions_count` INT NOT NULL,
    `discharges_count` INT NOT NULL,
    `emergency_cases_count` INT NOT NULL,
    `icu_occupied_count` INT NOT NULL,
    `general_occupied_count` INT NOT NULL,
    `active_nurses_count` INT NOT NULL,
    `medicine_units_consumed` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ====================================================
-- INITIAL REALISTIC HOSPITAL SEED DATA
-- ====================================================

-- 1. Departments
INSERT IGNORE INTO `departments` (`id`, `name`, `code`, `head_doctor_name`, `floor_number`, `contact_extension`, `bed_capacity`) VALUES
(1, 'Emergency & Trauma', 'EMERG', 'Dr. Sarah Mitchell', 1, '101', 30),
(2, 'Intensive Care Unit (ICU)', 'ICU', 'Dr. Robert Chen', 2, '201', 20),
(3, 'Cardiology', 'CARD', 'Dr. James Wilson', 3, '301', 25),
(4, 'General Medicine', 'GENMED', 'Dr. Elena Rostova', 2, '202', 40),
(5, 'Orthopedics', 'ORTHO', 'Dr. Marcus Vance', 4, '401', 25),
(6, 'Pediatrics', 'PED', 'Dr. Priya Sharma', 3, '302', 20),
(7, 'Neurology', 'NEURO', 'Dr. Arthur Pendelton', 5, '501', 15);

-- 2. Users (Password: Hospital@2026 for staff, Patient@123 for patients)
INSERT IGNORE INTO `users` (`id`, `username`, `password`, `role`, `full_name`, `email`, `phone`) VALUES
(1, 'admin', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'ADMIN', 'Hospital Administrator', 'admin@hospital.org', '+1 555-0100'),
(2, 'dr_mitchell', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'DOCTOR', 'Dr. Sarah Mitchell', 's.mitchell@hospital.org', '+1 555-0111'),
(3, 'dr_chen', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'DOCTOR', 'Dr. Robert Chen', 'r.chen@hospital.org', '+1 555-0112'),
(4, 'dr_wilson', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'DOCTOR', 'Dr. James Wilson', 'j.wilson@hospital.org', '+1 555-0113'),
(5, 'dr_rostova', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'DOCTOR', 'Dr. Elena Rostova', 'e.rostova@hospital.org', '+1 555-0114'),
(6, 'nurse_charlotte', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'NURSE', 'Nurse Charlotte Hayes', 'c.hayes@hospital.org', '+1 555-0121'),
(7, 'nurse_david', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'NURSE', 'Nurse David Miller', 'd.miller@hospital.org', '+1 555-0122'),
(8, 'nurse_grace', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'NURSE', 'Nurse Grace Hopper', 'g.hopper@hospital.org', '+1 555-0123'),
(9, 'nurse_anita', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'NURSE', 'Nurse Anita Patel', 'a.patel@hospital.org', '+1 555-0124'),
(10, 'OP202600123', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'PATIENT', 'Eleanor Vance', 'e.vance@example.com', '+1 555-0199'),
(11, 'OP202600124', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'PATIENT', 'Arthur Bradley', 'a.bradley@example.com', '+1 555-0198'),
(12, 'OP202600125', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'PATIENT', 'Sophia Garcia', 's.garcia@example.com', '+1 555-0197'),
(13, 'reception', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'RECEPTIONIST', 'Front Desk Receptionist', 'frontdesk@hospital.org', '+1 555-0105');

-- 3. Doctors
INSERT IGNORE INTO `doctors` (`id`, `user_id`, `employee_id`, `name`, `specialization`, `department_id`, `qualification`, `experience_years`, `phone`, `email`, `consultation_fee`, `availability_status`) VALUES
(1, 2, 'DOC-001', 'Dr. Sarah Mitchell', 'Trauma & Emergency Specialist', 1, 'MD, FACS, Critical Care', 14, '+1 555-0111', 's.mitchell@hospital.org', 75.00, 'AVAILABLE'),
(2, 3, 'DOC-002', 'Dr. Robert Chen', 'Intensivist & Pulmonologist', 2, 'MD, FCCP', 12, '+1 555-0112', 'r.chen@hospital.org', 90.00, 'AVAILABLE'),
(3, 4, 'DOC-003', 'Dr. James Wilson', 'Interventional Cardiologist', 3, 'MD, FACC', 16, '+1 555-0113', 'j.wilson@hospital.org', 85.00, 'AVAILABLE'),
(4, 5, 'DOC-004', 'Dr. Elena Rostova', 'Internal Medicine & Diabetologist', 4, 'MBBS, MD', 10, '+1 555-0114', 'e.rostova@hospital.org', 60.00, 'AVAILABLE');

-- 4. Nurses
INSERT IGNORE INTO `nurses` (`id`, `user_id`, `employee_id`, `name`, `department_id`, `skill_level`, `qualification`, `experience_years`, `phone`, `email`, `current_workload`, `shift_preference`, `availability_status`) VALUES
(1, 6, 'NUR-001', 'Nurse Charlotte Hayes', 2, 'ICU_CERTIFIED', 'BSN, CCRN', 8, '+1 555-0121', 'c.hayes@hospital.org', 2, 'MORNING', 'AVAILABLE'),
(2, 7, 'NUR-002', 'Nurse David Miller', 1, 'EMERGENCY_TRAINED', 'BSN, CEN', 6, '+1 555-0122', 'd.miller@hospital.org', 3, 'AFTERNOON', 'AVAILABLE'),
(3, 8, 'NUR-003', 'Nurse Grace Hopper', 3, 'SENIOR_STAFF', 'MSN, RN', 11, '+1 555-0123', 'g.hopper@hospital.org', 1, 'MORNING', 'AVAILABLE'),
(4, 9, 'NUR-004', 'Nurse Anita Patel', 4, 'GENERAL_WARD', 'BSN, RN', 4, '+1 555-0124', 'a.patel@hospital.org', 2, 'NIGHT', 'AVAILABLE');

-- 5. Beds
INSERT IGNORE INTO `beds` (`id`, `bed_number`, `ward`, `department_id`, `bed_type`, `floor_number`, `status`, `has_ventilator`, `has_oxygen_support`) VALUES
(1, 'EM-101', 'Trauma Bay A', 1, 'EMERGENCY', 1, 'AVAILABLE', TRUE, TRUE),
(2, 'EM-102', 'Trauma Bay B', 1, 'EMERGENCY', 1, 'AVAILABLE', TRUE, TRUE),
(3, 'EM-103', 'Triage Bay C', 1, 'EMERGENCY', 1, 'CLEANING', FALSE, TRUE),
(4, 'ICU-201', 'Critical Care Ward', 2, 'ICU', 2, 'OCCUPIED', TRUE, TRUE),
(5, 'ICU-202', 'Critical Care Ward', 2, 'ICU', 2, 'AVAILABLE', TRUE, TRUE),
(6, 'ICU-203', 'Critical Care Ward', 2, 'ICU', 2, 'AVAILABLE', TRUE, TRUE),
(7, 'ICU-204', 'Critical Care Ward', 2, 'ICU', 2, 'MAINTENANCE', TRUE, TRUE),
(8, 'GW-301', 'Cardio Recovery', 3, 'GENERAL', 3, 'OCCUPIED', FALSE, TRUE),
(9, 'GW-302', 'Cardio Recovery', 3, 'GENERAL', 3, 'AVAILABLE', FALSE, TRUE),
(10, 'SP-303', 'Cardio Semi-Private', 3, 'SEMI_PRIVATE', 3, 'AVAILABLE', FALSE, TRUE),
(11, 'PV-401', 'Executive Private Suite', 4, 'PRIVATE', 4, 'AVAILABLE', FALSE, TRUE),
(12, 'PV-402', 'Private Suite B', 4, 'PRIVATE', 4, 'AVAILABLE', FALSE, TRUE),
(13, 'GW-201', 'General Medical Ward', 4, 'GENERAL', 2, 'AVAILABLE', FALSE, TRUE),
(14, 'GW-202', 'General Medical Ward', 4, 'GENERAL', 2, 'AVAILABLE', FALSE, TRUE);

-- 6. Patients
INSERT IGNORE INTO `patients` (`id`, `user_id`, `op_number`, `name`, `dob`, `age`, `gender`, `blood_group`, `phone`, `email`, `address`, `emergency_contact`, `admission_status`, `assigned_department_id`, `assigned_doctor_id`, `current_bed_id`, `severity`, `triage_notes`) VALUES
(1, 10, 'OP202600123', 'Eleanor Vance', '1984-04-12', 42, 'Female', 'O_POS', '+1 555-0199', 'e.vance@example.com', '742 Evergreen Terrace, Springfield', 'Thomas Vance (+1 555-0191)', 'ADMITTED', 2, 2, 4, 'CRITICAL', 'Post-operative severe respiratory monitoring. Arterial line connected.'),
(2, 11, 'OP202600124', 'Arthur Bradley', '1961-09-28', 65, 'Male', 'A_POS', '+1 555-0198', 'a.bradley@example.com', '12 Baker Street, London', 'Martha Bradley (+1 555-0192)', 'ADMITTED', 3, 3, 8, 'HIGH', 'Acute coronary syndrome; stabilized on dual antiplatelet therapy.'),
(3, 12, 'OP202600125', 'Sophia Garcia', '1995-11-03', 31, 'Female', 'B_POS', '+1 555-0197', 's.garcia@example.com', '45 Ocean Avenue, Santa Monica', 'Mateo Garcia (+1 555-0193)', 'OUTPATIENT', 4, 4, NULL, 'NORMAL', 'Type 2 Diabetes routine HbA1c review and insulin adjustment.'),
(4, NULL, 'OP202600126', 'Marcus Sterling', '1976-02-14', 50, 'Male', 'AB_POS', '+1 555-0196', 'm.sterling@example.com', '88 Wall Street, New York', 'Claire Sterling (+1 555-0194)', 'IN_TRIAGE', 1, 1, NULL, 'EMERGENCY', 'Severe blunt chest trauma following vehicular collision; tachypneic.');

-- Update bed occupancy references
UPDATE `beds` SET `current_patient_id` = 1, `status` = 'OCCUPIED' WHERE `id` = 4;
UPDATE `beds` SET `current_patient_id` = 2, `status` = 'OCCUPIED' WHERE `id` = 8;

-- 7. Appointments
INSERT IGNORE INTO `appointments` (`id`, `patient_id`, `doctor_id`, `department_id`, `appointment_date`, `time_slot`, `reason`, `status`) VALUES
(1, 3, 4, 4, '2026-10-09', '09:00 - 09:30', 'Quarterly diabetes review & blood work review', 'CONFIRMED'),
(2, 2, 3, 3, '2026-10-10', '10:30 - 11:00', 'Post-infarction echocardiogram assessment', 'CONFIRMED'),
(3, 1, 2, 2, '2026-10-11', '14:00 - 14:30', 'Pulmonary function test consultation', 'PENDING');

-- 8. Emergency Cases
INSERT IGNORE INTO `emergency_cases` (`id`, `case_number`, `patient_id`, `patient_name`, `emergency_type`, `severity`, `triage_score`, `assigned_doctor_id`, `assigned_nurse_id`, `required_bed_type`, `status`, `triage_notes`) VALUES
(1, 'EM-2026-0089', 4, 'Marcus Sterling', 'Multiple Trauma (MVC)', 'CRITICAL_1', 98, 1, 2, 'EMERGENCY', 'TRIAGED', 'SpO2 88%, BP 85/50. FAST exam positive for peritoneal fluid.'),
(2, 'EM-2026-0090', NULL, 'Jane Doe (Unidentified)', 'Anaphylactic Shock', 'EMERGENT_2', 85, 1, 2, 'ICU', 'PENDING', 'Severe bronchospasm and facial angioedema following bee sting. Epinephrine IM administered.');

-- 9. Equipment
INSERT IGNORE INTO `equipment` (`id`, `name`, `serial_number`, `category`, `department_id`, `location`, `status`, `last_maintenance_date`, `next_maintenance_date`, `assigned_patient_id`) VALUES
(1, 'Hamilton G5 Mechanical Ventilator', 'VENT-H5-8831', 'VENTILATOR', 2, 'ICU Bed 201', 'IN_USE', '2026-09-01', '2026-12-01', 1),
(2, 'Philips IntelliVue MX800 Patient Monitor', 'MON-PH-9920', 'MONITOR', 2, 'ICU Bed 201', 'IN_USE', '2026-09-15', '2026-12-15', 1),
(3, 'Zoll R Series Defibrillator & Pacer', 'DEF-ZR-1044', 'DEFIBRILLATOR', 1, 'Trauma Bay A', 'AVAILABLE', '2026-09-20', '2026-10-20', NULL),
(4, 'GE Vivid E95 4D Echocardiograph', 'ECHO-GE-3319', 'DIAGNOSTIC_IMAGING', 3, 'Cardio Lab 2', 'AVAILABLE', '2026-08-10', '2026-11-10', NULL),
(5, 'Alaris Infusion Pump Unit A', 'INF-AL-7712', 'INFUSION_PUMP', 3, 'Ward 3 GW-301', 'IN_USE', '2026-09-25', '2026-12-25', 2);

-- 10. Inventory
INSERT IGNORE INTO `inventory` (`id`, `item_name`, `category`, `sku_code`, `quantity`, `minimum_stock`, `unit`, `unit_price`, `supplier`, `expiry_date`, `batch_number`, `storage_location`) VALUES
(1, 'Epinephrine 1mg/mL Auto-Injectors', 'EMERGENCY_MEDICINE', 'MED-EPI-001', 14, 25, 'Ampoules', 32.50, 'Pfizer Healthcare', '2027-04-30', 'EP-2026-X8', 'Trauma Bay Crash Cart 1'),
(2, 'Normal Saline IV 0.9% 1000mL', 'IV_FLUIDS', 'FL-NS-1000', 140, 50, 'Bags', 4.20, 'Baxter Medical', '2028-01-15', 'NS-99120', 'Central Pharmacy Bay A'),
(3, 'Endotracheal Tubes 7.5mm Cuffed', 'AIRWAY_MANAGEMENT', 'AIR-ETT-75', 18, 30, 'Units', 8.90, 'Medtronic Clinical', '2028-06-30', 'ET-44312', 'ICU Airway Cart 2'),
(4, 'Sterile Surgical Gloves Size 7.5', 'SURGICAL_CONSUMABLES', 'GLV-SUR-75', 380, 100, 'Pairs', 1.85, 'Ansell Healthcare', '2029-02-28', 'SG-88190', 'Sterile Supply Depot B'),
(5, 'Propofol 10mg/mL 20mL Vial', 'ANESTHETIC_SEDATIVE', 'MED-PRO-20', 8, 20, 'Vials', 19.50, 'Fresenius Kabi', '2027-02-14', 'PF-55102', 'Narcotics Secure Safe 3');

-- 11. Facilities
INSERT IGNORE INTO `facilities` (`id`, `name`, `category`, `description`, `location`, `operating_hours`, `contact_number`, `status`, `capacity_metric`) VALUES
(1, 'Level-1 Emergency Trauma Center', 'EMERGENCY', 'Immediate resuscitation, trauma surgery bays, and rapid diagnostic CT suite.', 'Building A, Ground Floor', '24 Hours / 7 Days', '+1 555-0101', 'AVAILABLE', '8 Active Resuscitation Bays'),
(2, 'Surgical Suites & Hybrid OR', 'SURGERY', '6 laminar air flow operating rooms equipped for open heart, neuro, and orthopedic surgeries.', 'Building B, 3rd Floor', '06:00 - 22:00 (Emergency 24h)', '+1 555-0102', 'BUSY', '6 Operating Theatres'),
(3, '24/7 Outpatient & Stat Pharmacy', 'PHARMACY', 'Automated dispensing system for inpatient stat doses and outpatient prescriptions.', 'Building A, 1st Floor Concourse', '24 Hours / 7 Days', '+1 555-0103', 'AVAILABLE', '4 Dispensing Counters');

-- 12. Audit Logs
INSERT IGNORE INTO `audit_logs` (`id`, `username`, `role`, `action`, `module`, `record_id`, `details`) VALUES
(1, 'system', 'SYSTEM', 'DB_INIT', 'SYSTEM', '1', 'Normalized 21-table hospital schema initialized with foreign key constraints.'),
(2, 'admin', 'ADMIN', 'RESOURCE_OPTIMIZATION', 'BED_ALLOCATION', 'EM-101', 'Greedy algorithm executed for bed optimization across trauma and ICU wards.'),
(3, 'dr_mitchell', 'DOCTOR', 'TRIAGE_CASE_ASSESSMENT', 'EMERGENCY', 'EM-2026-0089', 'Marcus Sterling triaged as ESI-1 Critical Trauma. Bed reservation queued.');

SET FOREIGN_KEY_CHECKS = 1;

-- ====================================================
-- SCHEMA CREATION & VERIFICATION COMPLETE
-- ====================================================
