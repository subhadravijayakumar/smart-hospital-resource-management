-- ====================================================
-- SMART HOSPITAL RESOURCE MANAGEMENT & OPTIMIZATION
-- Seed Data for MySQL 8.0
-- ====================================================

-- 1. Departments
INSERT IGNORE INTO departments (id, name, code, head_doctor_name, floor_number, contact_extension, bed_capacity) VALUES
(1, 'Emergency & Trauma', 'EMERG', 'Dr. Sarah Mitchell', 1, '101', 30),
(2, 'Intensive Care Unit (ICU)', 'ICU', 'Dr. Robert Chen', 2, '201', 20),
(3, 'Cardiology', 'CARD', 'Dr. James Wilson', 3, '301', 25),
(4, 'General Medicine', 'GENMED', 'Dr. Elena Rostova', 2, '202', 40),
(5, 'Orthopedics', 'ORTHO', 'Dr. Marcus Vance', 4, '401', 25),
(6, 'Pediatrics', 'PED', 'Dr. Priya Sharma', 3, '302', 20),
(7, 'Neurology', 'NEURO', 'Dr. Arthur Pendelton', 5, '501', 15);

-- 2. Users (BCrypt hash for Hospital@2026: $2a$10$wE6v9L6qg8f8U8k1q6kIseV5D5N9X9u6l8k8q6kIseV5D5N9X9u6l)
INSERT IGNORE INTO users (id, username, password, role, full_name, email, phone) VALUES
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
(12, 'OP202600125', '$2a$10$0pUj6P0N23xYwN6Z7L5VfeJ7rQ5K4G3X2W1V0U9T8S7R6Q5P4O3N2', 'PATIENT', 'Sophia Garcia', 's.garcia@example.com', '+1 555-0197');

-- 3. Doctors
INSERT IGNORE INTO doctors (id, user_id, employee_id, name, specialization, department_id, qualification, experience_years, phone, email, consultation_fee, availability_status) VALUES
(1, 2, 'DOC-001', 'Dr. Sarah Mitchell', 'Trauma & Emergency Specialist', 1, 'MD, FACS, Critical Care', 14, '+1 555-0111', 's.mitchell@hospital.org', 75.00, 'AVAILABLE'),
(2, 3, 'DOC-002', 'Dr. Robert Chen', 'Intensivist & Pulmonologist', 2, 'MD, FCCP', 12, '+1 555-0112', 'r.chen@hospital.org', 90.00, 'AVAILABLE'),
(3, 4, 'DOC-003', 'Dr. James Wilson', 'Interventional Cardiologist', 3, 'MD, FACC', 16, '+1 555-0113', 'j.wilson@hospital.org', 85.00, 'AVAILABLE'),
(4, 5, 'DOC-004', 'Dr. Elena Rostova', 'Internal Medicine & Diabetologist', 4, 'MBBS, MD', 10, '+1 555-0114', 'e.rostova@hospital.org', 60.00, 'AVAILABLE');

-- 4. Nurses
INSERT IGNORE INTO nurses (id, user_id, employee_id, name, department_id, skill_level, qualification, experience_years, phone, email, current_workload, shift_preference, availability_status) VALUES
(1, 6, 'NUR-001', 'Nurse Charlotte Hayes', 2, 'ICU_CERTIFIED', 'BSN, CCRN', 8, '+1 555-0121', 'c.hayes@hospital.org', 2, 'MORNING', 'AVAILABLE'),
(2, 7, 'NUR-002', 'Nurse David Miller', 1, 'EMERGENCY_TRAINED', 'BSN, CEN', 6, '+1 555-0122', 'd.miller@hospital.org', 3, 'AFTERNOON', 'AVAILABLE'),
(3, 8, 'NUR-003', 'Nurse Grace Hopper', 3, 'SENIOR_STAFF', 'MSN, RN', 11, '+1 555-0123', 'g.hopper@hospital.org', 1, 'MORNING', 'AVAILABLE'),
(4, 9, 'NUR-004', 'Nurse Anita Patel', 4, 'GENERAL_WARD', 'BSN, RN', 4, '+1 555-0124', 'a.patel@hospital.org', 2, 'NIGHT', 'AVAILABLE');

-- 5. Beds
INSERT IGNORE INTO beds (id, bed_number, ward, department_id, bed_type, floor_number, status, has_ventilator, has_oxygen_support) VALUES
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
INSERT IGNORE INTO patients (id, user_id, op_number, name, dob, age, gender, blood_group, phone, email, address, emergency_contact, admission_status, assigned_department_id, assigned_doctor_id, current_bed_id, severity) VALUES
(1, 10, 'OP202600123', 'Eleanor Vance', '1985-04-12', 41, 'Female', 'O+', '+1 555-0199', 'e.vance@example.com', '742 Evergreen Terrace, Springfield', 'James Vance (Spouse) - +1 555-0190', 'ADMITTED', 2, 2, 4, 'CRITICAL'),
(2, 11, 'OP202600124', 'Arthur Bradley', '1962-09-24', 64, 'Male', 'A+', '+1 555-0198', 'a.bradley@example.com', '12 Beacon Hill Ave, Boston', 'Margaret Bradley (Wife) - +1 555-0189', 'ADMITTED', 3, 3, 8, 'HIGH'),
(3, 12, 'OP202600125', 'Sophia Garcia', '1998-11-03', 27, 'Female', 'B-', '+1 555-0197', 's.garcia@example.com', '459 Horizon Blvd, Austin', 'Carlos Garcia (Brother) - +1 555-0188', 'OUTPATIENT', 4, 4, NULL, 'NORMAL');

UPDATE beds SET current_patient_id = 1 WHERE id = 4;
UPDATE beds SET current_patient_id = 2 WHERE id = 8;

-- 7. Facilities
INSERT IGNORE INTO facilities (id, name, category, description, location, operating_hours, contact_number, status, capacity_metric) VALUES
(1, 'Emergency & Level 1 Trauma Center', 'Critical Care', '24/7 acute resuscitation, triage bays, and ambulance docks.', 'Ground Floor, North Wing', '24 Hours / 7 Days', '+1 555-0911', 'AVAILABLE', '8 Trauma Bays Open'),
(2, 'Intensive Care Unit (ICU)', 'Critical Care', 'Advanced multi-parameter telemetry with negative pressure HEPA isolation.', 'Building B, 2nd Floor', '24 Hours (Restricted Visiting)', '+1 555-0201', 'BUSY', '85% Capacity (17/20 Beds)'),
(3, 'Cardiac Catheterization Laboratory', 'Diagnostics & Intervention', 'Biplane angiography suites for emergent coronary angioplasty.', 'Building A, 3rd Floor', '24/7 Emergent / 08:00 - 18:00 Elective', '+1 555-0305', 'AVAILABLE', '2 Cath Labs Active'),
(4, 'Main 24/7 Pharmacy', 'Pharmacy', 'Automated robotic dispensing and intravenous compounding.', 'Ground Floor, Central Atrium', '24 Hours / 7 Days', '+1 555-0150', 'AVAILABLE', '4 Counters Open'),
(5, 'Central Diagnostic Laboratory & Pathology', 'Laboratory', 'Automated hematology, clinical chemistry, and rapid PCR.', 'Basement 1, East Wing', '24 Hours / 7 Days', '+1 555-0160', 'AVAILABLE', 'Rapid Turnaround Active'),
(6, 'Advanced Diagnostic Radiology & MRI', 'Imaging', '3 Tesla MRI, dual-energy CT, digital fluoroscopy, and ultrasound.', 'Ground Floor, South Wing', '07:00 - 23:00 (Emergency 24/7)', '+1 555-0170', 'AVAILABLE', 'Emergency CT Priority Active'),
(7, 'Regional Blood Bank & Transfusion Medicine', 'Blood Bank', 'Whole blood, packed red cells, fresh frozen plasma, and platelets.', 'Building B, 1st Floor', '24 Hours / 7 Days', '+1 555-0180', 'AVAILABLE', 'O-Negative Stock Stable'),
(8, 'Fleet Ambulance & Mobile Intensive Care', 'Transport', 'Type III Advanced Life Support (ALS) ambulances with telemedicine.', 'Ambulance Bay, West Entrance', '24 Hours / 7 Days', '+1 555-0199', 'AVAILABLE', '4 Units on Standby');

-- 8. Inventory
INSERT IGNORE INTO inventory (id, item_name, category, sku_code, quantity, minimum_stock, unit, unit_price, supplier, expiry_date, batch_number, storage_location) VALUES
(1, 'Enoxaparin Sodium 40mg/0.4mL Injection', 'Cardiovascular', 'MED-ENOX-40', 140, 50, 'Prefilled Syringe', 18.50, 'Sanofi Healthcare', '2027-08-30', 'BT-7729', 'Pharmacy Cold Storage A'),
(2, 'Norepinephrine Bitartrate 4mg/4mL', 'Emergency Drugs', 'MED-NOREP-4', 24, 40, 'Vial', 34.00, 'Pfizer Hospital', '2027-03-15', 'BT-9912', 'ICU Emergency Lockbox'),
(3, 'Propofol 1% 20mL Emulsion', 'Anesthesia', 'MED-PROP-20', 85, 30, 'Ampoule', 12.20, 'Fresenius Kabi', '2026-12-20', 'BT-4481', 'OT Anesthesia Rack'),
(4, 'N95 Particulate Respirator Masks', 'PPE Supplies', 'PPE-N95-01', 320, 100, 'Box of 20', 25.00, '3M HealthCare', '2029-01-01', 'BT-1029', 'Central Supply Rm 102'),
(5, 'Sterile Surgical Gloves 7.5', 'Consumables', 'GLV-SURG-75', 450, 150, 'Pairs', 1.80, 'Ansell Medical', '2028-06-15', 'BT-3320', 'Floor 2 Sterile Store'),
(6, 'Normal Saline 0.9% 500mL IV Bags', 'IV Fluids', 'IV-NS-500', 38, 80, 'Bags', 2.50, 'Baxter Healthcare', '2027-10-10', 'BT-8891', 'Fluid Bay Central');
