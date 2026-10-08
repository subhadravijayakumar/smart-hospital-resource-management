-- ====================================================
-- SMART HOSPITAL RESOURCE MANAGEMENT & OPTIMIZATION
-- MySQL 8.0 DDL Schema
-- ====================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'RECEPTIONIST') NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE,
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_username (username),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS departments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    head_doctor_name VARCHAR(150),
    floor_number INT DEFAULT 1,
    contact_extension VARCHAR(20),
    bed_capacity INT DEFAULT 20
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS doctors (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    department_id BIGINT NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    consultation_fee DECIMAL(10,2) DEFAULT 50.00,
    availability_status ENUM('AVAILABLE', 'IN_CONSULTATION', 'ON_LEAVE', 'OFF_DUTY') DEFAULT 'AVAILABLE',
    max_patients_per_day INT DEFAULT 25,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_doc_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nurses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    employee_id VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    department_id BIGINT NOT NULL,
    skill_level ENUM('ICU_CERTIFIED', 'EMERGENCY_TRAINED', 'SENIOR_STAFF', 'GENERAL_WARD') NOT NULL,
    qualification VARCHAR(100) NOT NULL,
    experience_years INT NOT NULL,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150) NOT NULL,
    current_workload INT DEFAULT 0,
    shift_preference VARCHAR(20) DEFAULT 'MORNING',
    availability_status ENUM('AVAILABLE', 'ON_DUTY', 'ON_LEAVE', 'OFF_DUTY') DEFAULT 'AVAILABLE',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_nurse_dept (department_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS beds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bed_number VARCHAR(50) NOT NULL UNIQUE,
    ward VARCHAR(100) NOT NULL,
    department_id BIGINT NOT NULL,
    bed_type ENUM('ICU', 'EMERGENCY', 'GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'PEDIATRIC') NOT NULL,
    floor_number INT NOT NULL,
    status ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    current_patient_id BIGINT,
    has_ventilator BOOLEAN DEFAULT FALSE,
    has_oxygen_support BOOLEAN DEFAULT TRUE,
    last_cleaned_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    INDEX idx_bed_status (status),
    INDEX idx_bed_type (bed_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS patients (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNIQUE,
    op_number VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    dob DATE,
    age INT NOT NULL,
    gender ENUM('Male', 'Female', 'Other'),
    blood_group VARCHAR(10),
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    emergency_contact VARCHAR(200) NOT NULL,
    admission_status ENUM('OUTPATIENT', 'ADMITTED', 'DISCHARGED', 'IN_TRIAGE') DEFAULT 'OUTPATIENT',
    assigned_department_id BIGINT,
    assigned_doctor_id BIGINT,
    current_bed_id BIGINT,
    severity ENUM('EMERGENCY', 'CRITICAL', 'HIGH', 'NORMAL') DEFAULT 'NORMAL',
    triage_notes TEXT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_department_id) REFERENCES departments(id),
    FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (current_bed_id) REFERENCES beds(id),
    INDEX idx_patient_op (op_number),
    INDEX idx_patient_status (admission_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Complete circular foreign key for beds
ALTER TABLE beds ADD CONSTRAINT fk_beds_patient FOREIGN KEY (current_patient_id) REFERENCES patients(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS bed_allocations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    bed_id BIGINT NOT NULL,
    patient_id BIGINT NOT NULL,
    allocation_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    release_time TIMESTAMP NULL,
    algorithm_score DOUBLE,
    decision_rationale TEXT,
    allocated_by VARCHAR(100) DEFAULT 'SYSTEM_GREEDY_OPT',
    status ENUM('ACTIVE', 'DISCHARGED', 'TRANSFERRED') DEFAULT 'ACTIVE',
    FOREIGN KEY (bed_id) REFERENCES beds(id),
    FOREIGN KEY (patient_id) REFERENCES patients(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS appointments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    department_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    time_slot VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id),
    FOREIGN KEY (department_id) REFERENCES departments(id),
    UNIQUE KEY uq_doc_slot (doctor_id, appointment_date, time_slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS emergency_cases (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_number VARCHAR(50) NOT NULL UNIQUE,
    patient_id BIGINT NULL,
    patient_name VARCHAR(150) NOT NULL,
    emergency_type VARCHAR(150) NOT NULL,
    severity ENUM('CRITICAL_1', 'EMERGENT_2', 'URGENT_3', 'LESS_URGENT_4', 'NON_URGENT_5') NOT NULL,
    triage_score INT NOT NULL,
    arrival_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_doctor_id BIGINT NULL,
    assigned_nurse_id BIGINT NULL,
    required_bed_type VARCHAR(50) DEFAULT 'EMERGENCY',
    status ENUM('PENDING', 'TRIAGED', 'IN_TREATMENT', 'RESOLVED') DEFAULT 'PENDING',
    triage_notes TEXT,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_nurse_id) REFERENCES nurses(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medical_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    record_type VARCHAR(100) NOT NULL,
    diagnosis TEXT NOT NULL,
    clinical_notes TEXT,
    vitals_json JSON,
    record_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS prescriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    medicines_json JSON NOT NULL,
    dosage_instructions TEXT NOT NULL,
    duration_days INT NOT NULL,
    prescribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('ACTIVE', 'DISPENSED', 'COMPLETED') DEFAULT 'ACTIVE',
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS medical_reports (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    doctor_id BIGINT NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_url VARCHAR(500),
    report_date DATE DEFAULT (CURRENT_DATE),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id),
    FOREIGN KEY (doctor_id) REFERENCES doctors(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS equipment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    serial_number VARCHAR(100) NOT NULL UNIQUE,
    category VARCHAR(100) NOT NULL,
    department_id BIGINT NOT NULL,
    location VARCHAR(100) NOT NULL,
    status ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DAMAGED', 'OUT_OF_SERVICE') DEFAULT 'AVAILABLE',
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    assigned_patient_id BIGINT NULL,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (assigned_patient_id) REFERENCES patients(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    sku_code VARCHAR(100) NOT NULL UNIQUE,
    quantity INT NOT NULL DEFAULT 0,
    minimum_stock INT NOT NULL DEFAULT 20,
    unit VARCHAR(50) NOT NULL,
    unit_price DECIMAL(10,2) DEFAULT 0.00,
    supplier VARCHAR(150) NOT NULL,
    expiry_date DATE NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    storage_location VARCHAR(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    inventory_id BIGINT NOT NULL,
    transaction_type ENUM('CONSUMPTION', 'RESTOCK', 'ADJUSTMENT') NOT NULL,
    quantity_changed INT NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inventory_id) REFERENCES inventory(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS nurse_shifts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    shift_date DATE NOT NULL,
    shift_type ENUM('MORNING', 'AFTERNOON', 'NIGHT') NOT NULL,
    department_id BIGINT NOT NULL,
    predicted_workload_score DOUBLE NOT NULL,
    required_nurses INT NOT NULL,
    assigned_nurse_id BIGINT NOT NULL,
    status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED') DEFAULT 'SCHEDULED',
    optimization_reason TEXT,
    FOREIGN KEY (department_id) REFERENCES departments(id),
    FOREIGN KEY (assigned_nurse_id) REFERENCES nurses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leave_requests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    staff_type ENUM('NURSE', 'DOCTOR', 'STAFF') NOT NULL,
    staff_id BIGINT NOT NULL,
    staff_name VARCHAR(150) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED') DEFAULT 'PENDING',
    reviewer_remarks TEXT,
    reviewed_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS facilities (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(150) NOT NULL,
    operating_hours VARCHAR(100) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    status ENUM('AVAILABLE', 'BUSY', 'EMERGENCY_ONLY', 'TEMPORARILY_CLOSED') NOT NULL,
    capacity_metric VARCHAR(100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    module VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NULL,
    target_role VARCHAR(50),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    notification_type ENUM('EMERGENCY', 'BED_UPDATE', 'SHIFT_ASSIGN', 'APPOINTMENT', 'INVENTORY_ALERT', 'GENERAL') NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ml_training_data (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    record_date DATE NOT NULL,
    day_of_week INT NOT NULL,
    month INT NOT NULL,
    admissions_count INT NOT NULL,
    discharges_count INT NOT NULL,
    emergency_cases_count INT NOT NULL,
    icu_occupied_count INT NOT NULL,
    general_occupied_count INT NOT NULL,
    active_nurses_count INT NOT NULL,
    medicine_units_consumed INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
