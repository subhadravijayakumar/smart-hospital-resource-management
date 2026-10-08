import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(process.cwd(), 'hospital.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  // Create tables according to normalized schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'RECEPTIONIST')),
      full_name TEXT NOT NULL,
      email TEXT UNIQUE,
      phone TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      code TEXT UNIQUE NOT NULL,
      head_doctor_name TEXT,
      floor_number INTEGER DEFAULT 1,
      contact_extension TEXT,
      bed_capacity INTEGER DEFAULT 20
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      op_number TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      dob DATE,
      age INTEGER NOT NULL,
      gender TEXT CHECK(gender IN ('Male', 'Female', 'Other')),
      blood_group TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      emergency_contact TEXT NOT NULL,
      admission_status TEXT DEFAULT 'OUTPATIENT' CHECK(admission_status IN ('OUTPATIENT', 'ADMITTED', 'DISCHARGED', 'IN_TRIAGE')),
      assigned_department_id INTEGER,
      assigned_doctor_id INTEGER,
      current_bed_id INTEGER,
      severity TEXT DEFAULT 'NORMAL' CHECK(severity IN ('EMERGENCY', 'CRITICAL', 'HIGH', 'NORMAL')),
      triage_notes TEXT,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(assigned_department_id) REFERENCES departments(id),
      FOREIGN KEY(assigned_doctor_id) REFERENCES doctors(id),
      FOREIGN KEY(current_bed_id) REFERENCES beds(id)
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      specialization TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      qualification TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      consultation_fee DECIMAL(10,2) DEFAULT 50.00,
      availability_status TEXT DEFAULT 'AVAILABLE' CHECK(availability_status IN ('AVAILABLE', 'IN_CONSULTATION', 'ON_LEAVE', 'OFF_DUTY')),
      max_patients_per_day INTEGER DEFAULT 25,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS nurses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER UNIQUE,
      employee_id TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      skill_level TEXT NOT NULL CHECK(skill_level IN ('ICU_CERTIFIED', 'EMERGENCY_TRAINED', 'SENIOR_STAFF', 'GENERAL_WARD')),
      qualification TEXT NOT NULL,
      experience_years INTEGER NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      current_workload INTEGER DEFAULT 0,
      shift_preference TEXT DEFAULT 'MORNING',
      availability_status TEXT DEFAULT 'AVAILABLE' CHECK(availability_status IN ('AVAILABLE', 'ON_DUTY', 'ON_LEAVE', 'OFF_DUTY')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS beds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bed_number TEXT UNIQUE NOT NULL,
      ward TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      bed_type TEXT NOT NULL CHECK(bed_type IN ('ICU', 'EMERGENCY', 'GENERAL', 'SEMI_PRIVATE', 'PRIVATE', 'PEDIATRIC')),
      floor_number INTEGER NOT NULL,
      status TEXT DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE')),
      current_patient_id INTEGER,
      has_ventilator BOOLEAN DEFAULT 0,
      has_oxygen_support BOOLEAN DEFAULT 1,
      last_cleaned_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(department_id) REFERENCES departments(id),
      FOREIGN KEY(current_patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS bed_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bed_id INTEGER NOT NULL,
      patient_id INTEGER NOT NULL,
      allocation_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      release_time DATETIME,
      algorithm_score REAL,
      decision_rationale TEXT,
      allocated_by TEXT DEFAULT 'SYSTEM_GREEDY_OPT',
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISCHARGED', 'TRANSFERRED')),
      FOREIGN KEY(bed_id) REFERENCES beds(id),
      FOREIGN KEY(patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      department_id INTEGER NOT NULL,
      appointment_date DATE NOT NULL,
      time_slot TEXT NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(doctor_id) REFERENCES doctors(id),
      FOREIGN KEY(department_id) REFERENCES departments(id)
    );

    CREATE TABLE IF NOT EXISTS emergency_cases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      case_number TEXT UNIQUE NOT NULL,
      patient_id INTEGER,
      patient_name TEXT NOT NULL,
      emergency_type TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('CRITICAL_1', 'EMERGENT_2', 'URGENT_3', 'LESS_URGENT_4', 'NON_URGENT_5')),
      triage_score INTEGER NOT NULL,
      arrival_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      assigned_doctor_id INTEGER,
      assigned_nurse_id INTEGER,
      required_bed_type TEXT DEFAULT 'EMERGENCY',
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'TRIAGED', 'IN_TREATMENT', 'RESOLVED')),
      triage_notes TEXT,
      FOREIGN KEY(patient_id) REFERENCES patients(id) ON DELETE SET NULL,
      FOREIGN KEY(assigned_doctor_id) REFERENCES doctors(id) ON DELETE SET NULL,
      FOREIGN KEY(assigned_nurse_id) REFERENCES nurses(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS medical_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      record_type TEXT NOT NULL,
      diagnosis TEXT NOT NULL,
      clinical_notes TEXT,
      vitals_json TEXT,
      record_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      medicines_json TEXT NOT NULL,
      dosage_instructions TEXT NOT NULL,
      duration_days INTEGER NOT NULL,
      prescribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE', 'DISPENSED', 'COMPLETED')),
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS medical_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      doctor_id INTEGER NOT NULL,
      report_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      file_url TEXT,
      report_date DATE DEFAULT (CURRENT_DATE),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(doctor_id) REFERENCES doctors(id)
    );

    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      serial_number TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL,
      department_id INTEGER NOT NULL,
      location TEXT NOT NULL,
      status TEXT DEFAULT 'AVAILABLE' CHECK(status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'DAMAGED', 'OUT_OF_SERVICE')),
      last_maintenance_date DATE,
      next_maintenance_date DATE,
      assigned_patient_id INTEGER,
      FOREIGN KEY(department_id) REFERENCES departments(id),
      FOREIGN KEY(assigned_patient_id) REFERENCES patients(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku_code TEXT UNIQUE NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      minimum_stock INTEGER NOT NULL DEFAULT 20,
      unit TEXT NOT NULL,
      unit_price DECIMAL(10,2) DEFAULT 0.00,
      supplier TEXT NOT NULL,
      expiry_date DATE NOT NULL,
      batch_number TEXT NOT NULL,
      storage_location TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inventory_id INTEGER NOT NULL,
      transaction_type TEXT CHECK(transaction_type IN ('CONSUMPTION', 'RESTOCK', 'ADJUSTMENT')),
      quantity_changed INTEGER NOT NULL,
      performed_by TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(inventory_id) REFERENCES inventory(id)
    );

    CREATE TABLE IF NOT EXISTS nurse_shifts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shift_date DATE NOT NULL,
      shift_type TEXT NOT NULL CHECK(shift_type IN ('MORNING', 'AFTERNOON', 'NIGHT')),
      department_id INTEGER NOT NULL,
      predicted_workload_score REAL NOT NULL,
      required_nurses INTEGER NOT NULL,
      assigned_nurse_id INTEGER NOT NULL,
      status TEXT DEFAULT 'SCHEDULED' CHECK(status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED')),
      optimization_reason TEXT,
      FOREIGN KEY(department_id) REFERENCES departments(id),
      FOREIGN KEY(assigned_nurse_id) REFERENCES nurses(id)
    );

    CREATE TABLE IF NOT EXISTS leave_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      staff_type TEXT NOT NULL CHECK(staff_type IN ('NURSE', 'DOCTOR', 'STAFF')),
      staff_id INTEGER NOT NULL,
      staff_name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT NOT NULL,
      status TEXT DEFAULT 'PENDING' CHECK(status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
      reviewer_remarks TEXT,
      reviewed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      target_role TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      notification_type TEXT NOT NULL CHECK(notification_type IN ('EMERGENCY', 'BED_UPDATE', 'SHIFT_ASSIGN', 'APPOINTMENT', 'INVENTORY_ALERT', 'GENERAL')),
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      role TEXT NOT NULL,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      record_id TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      location TEXT NOT NULL,
      operating_hours TEXT NOT NULL,
      contact_number TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('AVAILABLE', 'BUSY', 'EMERGENCY_ONLY', 'TEMPORARILY_CLOSED')),
      capacity_metric TEXT
    );

    CREATE TABLE IF NOT EXISTS ml_training_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_date DATE NOT NULL,
      day_of_week INTEGER NOT NULL,
      month INTEGER NOT NULL,
      admissions_count INTEGER NOT NULL,
      discharges_count INTEGER NOT NULL,
      emergency_cases_count INTEGER NOT NULL,
      icu_occupied_count INTEGER NOT NULL,
      general_occupied_count INTEGER NOT NULL,
      active_nurses_count INTEGER NOT NULL,
      medicine_units_consumed INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed sample data if empty
  seedDatabaseIfEmpty();
}

function seedDatabaseIfEmpty() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) return;

  const salt = bcrypt.genSaltSync(10);
  const defaultPassword = bcrypt.hashSync('Hospital@2026', salt);
  const patientPassword = bcrypt.hashSync('Patient@123', salt);

  // 1. Insert Departments
  const insertDept = db.prepare(`
    INSERT INTO departments (name, code, head_doctor_name, floor_number, contact_extension, bed_capacity)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertDept.run('Emergency & Trauma', 'EMERG', 'Dr. Sarah Mitchell', 1, '101', 30);
  insertDept.run('Intensive Care Unit (ICU)', 'ICU', 'Dr. Robert Chen', 2, '201', 20);
  insertDept.run('Cardiology', 'CARD', 'Dr. James Wilson', 3, '301', 25);
  insertDept.run('General Medicine', 'GENMED', 'Dr. Elena Rostova', 2, '202', 40);
  insertDept.run('Orthopedics', 'ORTHO', 'Dr. Marcus Vance', 4, '401', 25);
  insertDept.run('Pediatrics', 'PED', 'Dr. Priya Sharma', 3, '302', 20);
  insertDept.run('Neurology', 'NEURO', 'Dr. Arthur Pendelton', 5, '501', 15);

  // 2. Insert Users
  const insertUser = db.prepare(`
    INSERT INTO users (username, password, role, full_name, email, phone)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  // Admin
  const adminId = insertUser.run('admin', defaultPassword, 'ADMIN', 'Hospital Administrator', 'admin@hospital.org', '+1 555-0100').lastInsertRowid;
  // Doctors
  const d1UserId = insertUser.run('dr_mitchell', defaultPassword, 'DOCTOR', 'Dr. Sarah Mitchell', 's.mitchell@hospital.org', '+1 555-0111').lastInsertRowid;
  const d2UserId = insertUser.run('dr_chen', defaultPassword, 'DOCTOR', 'Dr. Robert Chen', 'r.chen@hospital.org', '+1 555-0112').lastInsertRowid;
  const d3UserId = insertUser.run('dr_wilson', defaultPassword, 'DOCTOR', 'Dr. James Wilson', 'j.wilson@hospital.org', '+1 555-0113').lastInsertRowid;
  const d4UserId = insertUser.run('dr_rostova', defaultPassword, 'DOCTOR', 'Dr. Elena Rostova', 'e.rostova@hospital.org', '+1 555-0114').lastInsertRowid;
  // Nurses
  const n1UserId = insertUser.run('nurse_charlotte', defaultPassword, 'NURSE', 'Nurse Charlotte Hayes', 'c.hayes@hospital.org', '+1 555-0121').lastInsertRowid;
  const n2UserId = insertUser.run('nurse_david', defaultPassword, 'NURSE', 'Nurse David Miller', 'd.miller@hospital.org', '+1 555-0122').lastInsertRowid;
  const n3UserId = insertUser.run('nurse_grace', defaultPassword, 'NURSE', 'Nurse Grace Hopper', 'g.hopper@hospital.org', '+1 555-0123').lastInsertRowid;
  const n4UserId = insertUser.run('nurse_anita', defaultPassword, 'NURSE', 'Nurse Anita Patel', 'a.patel@hospital.org', '+1 555-0124').lastInsertRowid;
  // Patients
  const p1UserId = insertUser.run('OP202600123', patientPassword, 'PATIENT', 'Eleanor Vance', 'e.vance@example.com', '+1 555-0199').lastInsertRowid;
  const p2UserId = insertUser.run('OP202600124', patientPassword, 'PATIENT', 'Arthur Bradley', 'a.bradley@example.com', '+1 555-0198').lastInsertRowid;
  const p3UserId = insertUser.run('OP202600125', patientPassword, 'PATIENT', 'Sophia Garcia', 's.garcia@example.com', '+1 555-0197').lastInsertRowid;

  // 3. Insert Doctors
  const insertDoc = db.prepare(`
    INSERT INTO doctors (user_id, employee_id, name, specialization, department_id, qualification, experience_years, phone, email, consultation_fee, availability_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const d1Id = insertDoc.run(d1UserId, 'DOC-001', 'Dr. Sarah Mitchell', 'Trauma & Emergency Specialist', 1, 'MD, FACS, Critical Care', 14, '+1 555-0111', 's.mitchell@hospital.org', 75.00, 'AVAILABLE').lastInsertRowid;
  const d2Id = insertDoc.run(d2UserId, 'DOC-002', 'Dr. Robert Chen', 'Intensivist & Pulmonologist', 2, 'MD, FCCP', 12, '+1 555-0112', 'r.chen@hospital.org', 90.00, 'AVAILABLE').lastInsertRowid;
  const d3Id = insertDoc.run(d3UserId, 'DOC-003', 'Dr. James Wilson', 'Interventional Cardiologist', 3, 'MD, FACC', 16, '+1 555-0113', 'j.wilson@hospital.org', 85.00, 'AVAILABLE').lastInsertRowid;
  const d4Id = insertDoc.run(d4UserId, 'DOC-004', 'Dr. Elena Rostova', 'Internal Medicine & Diabetologist', 4, 'MBBS, MD', 10, '+1 555-0114', 'e.rostova@hospital.org', 60.00, 'AVAILABLE').lastInsertRowid;

  // 4. Insert Nurses
  const insertNurse = db.prepare(`
    INSERT INTO nurses (user_id, employee_id, name, department_id, skill_level, qualification, experience_years, phone, email, current_workload, shift_preference, availability_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const n1Id = insertNurse.run(n1UserId, 'NUR-001', 'Nurse Charlotte Hayes', 2, 'ICU_CERTIFIED', 'BSN, CCRN', 8, '+1 555-0121', 'c.hayes@hospital.org', 2, 'MORNING', 'AVAILABLE').lastInsertRowid;
  const n2Id = insertNurse.run(n2UserId, 'NUR-002', 'Nurse David Miller', 1, 'EMERGENCY_TRAINED', 'BSN, CEN', 6, '+1 555-0122', 'd.miller@hospital.org', 3, 'AFTERNOON', 'AVAILABLE').lastInsertRowid;
  const n3Id = insertNurse.run(n3UserId, 'NUR-003', 'Nurse Grace Hopper', 3, 'SENIOR_STAFF', 'MSN, RN', 11, '+1 555-0123', 'g.hopper@hospital.org', 1, 'MORNING', 'AVAILABLE').lastInsertRowid;
  const n4Id = insertNurse.run(n4UserId, 'NUR-004', 'Nurse Anita Patel', 4, 'GENERAL_WARD', 'BSN, RN', 4, '+1 555-0124', 'a.patel@hospital.org', 2, 'NIGHT', 'AVAILABLE').lastInsertRowid;

  // 5. Insert Beds
  const insertBed = db.prepare(`
    INSERT INTO beds (bed_number, ward, department_id, bed_type, floor_number, status, has_ventilator, has_oxygen_support)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  // Emergency beds
  insertBed.run('EM-101', 'Trauma Bay A', 1, 'EMERGENCY', 1, 'AVAILABLE', 1, 1);
  insertBed.run('EM-102', 'Trauma Bay B', 1, 'EMERGENCY', 1, 'AVAILABLE', 1, 1);
  insertBed.run('EM-103', 'Triage Bay C', 1, 'EMERGENCY', 1, 'CLEANING', 0, 1);
  // ICU beds
  const bICU1 = insertBed.run('ICU-201', 'Critical Care Ward', 2, 'ICU', 2, 'OCCUPIED', 1, 1).lastInsertRowid;
  insertBed.run('ICU-202', 'Critical Care Ward', 2, 'ICU', 2, 'AVAILABLE', 1, 1);
  insertBed.run('ICU-203', 'Critical Care Ward', 2, 'ICU', 2, 'AVAILABLE', 1, 1);
  insertBed.run('ICU-204', 'Critical Care Ward', 2, 'ICU', 2, 'MAINTENANCE', 1, 1);
  // Cardiology / General beds
  const bGen1 = insertBed.run('GW-301', 'Cardio Recovery', 3, 'GENERAL', 3, 'OCCUPIED', 0, 1).lastInsertRowid;
  insertBed.run('GW-302', 'Cardio Recovery', 3, 'GENERAL', 3, 'AVAILABLE', 0, 1);
  insertBed.run('SP-303', 'Cardio Semi-Private', 3, 'SEMI_PRIVATE', 3, 'AVAILABLE', 0, 1);
  insertBed.run('PV-401', 'Executive Private Suite', 4, 'PRIVATE', 4, 'AVAILABLE', 0, 1);
  insertBed.run('PV-402', 'Private Suite B', 4, 'PRIVATE', 4, 'AVAILABLE', 0, 1);
  insertBed.run('GW-201', 'General Medical Ward', 4, 'GENERAL', 2, 'AVAILABLE', 0, 1);
  insertBed.run('GW-202', 'General Medical Ward', 4, 'GENERAL', 2, 'AVAILABLE', 0, 1);

  // 6. Insert Patients
  const insertPatient = db.prepare(`
    INSERT INTO patients (user_id, op_number, name, dob, age, gender, blood_group, phone, email, address, emergency_contact, admission_status, assigned_department_id, assigned_doctor_id, current_bed_id, severity)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const p1Id = insertPatient.run(
    p1UserId, 'OP202600123', 'Eleanor Vance', '1985-04-12', 41, 'Female', 'O+', '+1 555-0199', 'e.vance@example.com',
    '742 Evergreen Terrace, Springfield', 'James Vance (Spouse) - +1 555-0190',
    'ADMITTED', 2, d2Id, bICU1, 'CRITICAL'
  ).lastInsertRowid;

  const p2Id = insertPatient.run(
    p2UserId, 'OP202600124', 'Arthur Bradley', '1962-09-24', 64, 'Male', 'A+', '+1 555-0198', 'a.bradley@example.com',
    '12 Beacon Hill Ave, Boston', 'Margaret Bradley (Wife) - +1 555-0189',
    'ADMITTED', 3, d3Id, bGen1, 'HIGH'
  ).lastInsertRowid;

  const p3Id = insertPatient.run(
    p3UserId, 'OP202600125', 'Sophia Garcia', '1998-11-03', 27, 'Female', 'B-', '+1 555-0197', 's.garcia@example.com',
    '459 Horizon Blvd, Austin', 'Carlos Garcia (Brother) - +1 555-0188',
    'OUTPATIENT', 4, d4Id, null, 'NORMAL'
  ).lastInsertRowid;

  // Link beds to patients
  db.prepare('UPDATE beds SET current_patient_id = ? WHERE id = ?').run(p1Id, bICU1);
  db.prepare('UPDATE beds SET current_patient_id = ? WHERE id = ?').run(p2Id, bGen1);

  // Bed allocation records
  db.prepare(`
    INSERT INTO bed_allocations (bed_id, patient_id, algorithm_score, decision_rationale, allocated_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(bICU1, p1Id, 98.5, 'Greedy match: High-acuity ICU ventilator requirement matched with ICU-201', 'GREEDY_ALLOCATION_SERVICE');

  db.prepare(`
    INSERT INTO bed_allocations (bed_id, patient_id, algorithm_score, decision_rationale, allocated_by)
    VALUES (?, ?, ?, ?, ?)
  `).run(bGen1, p2Id, 89.2, 'Greedy match: Post-angioplasty telemetry bed in Cardiology ward floor 3', 'GREEDY_ALLOCATION_SERVICE');

  // 7. Insert Appointments
  const insertAppt = db.prepare(`
    INSERT INTO appointments (patient_id, doctor_id, department_id, appointment_date, time_slot, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertAppt.run(p1Id, d2Id, 2, '2026-10-10', '10:00 AM - 10:30 AM', 'Post-ICU Pulmonary Follow-up', 'CONFIRMED');
  insertAppt.run(p2Id, d3Id, 3, '2026-10-12', '02:00 PM - 02:30 PM', 'Echocardiogram Review', 'CONFIRMED');
  insertAppt.run(p3Id, d4Id, 4, '2026-10-09', '11:30 AM - 12:00 PM', 'Annual Health Assessment & Blood Panel', 'CONFIRMED');

  // 8. Insert Medical Records & Prescriptions
  db.prepare(`
    INSERT INTO medical_records (patient_id, doctor_id, record_type, diagnosis, clinical_notes, vitals_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    p1Id, d2Id, 'ICU Admission Assessment', 'Acute Respiratory Distress Syndrome (ARDS) secondary to viral pneumonia',
    'Patient admitted via ED with SpO2 86% on room air. Initiated high-flow nasal cannula then mechanical ventilation. Arterial blood gas improving.',
    JSON.stringify({ bp: '124/82', hr: 88, spo2: 96, temp: '38.1 C', resp: 18 })
  );

  db.prepare(`
    INSERT INTO medical_records (patient_id, doctor_id, record_type, diagnosis, clinical_notes, vitals_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    p2Id, d3Id, 'Inpatient Cardiology Consult', 'Coronary Artery Disease - Post Percutaneous Coronary Intervention',
    'Drug-eluting stent placed in proximal LAD. Hemodynamically stable. Femoral site clean and dry without hematoma.',
    JSON.stringify({ bp: '130/78', hr: 72, spo2: 98, temp: '36.8 C', resp: 16 })
  );

  db.prepare(`
    INSERT INTO prescriptions (patient_id, doctor_id, medicines_json, dosage_instructions, duration_days, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    p2Id, d3Id,
    JSON.stringify([
      { name: 'Aspirin', dose: '81mg', frequency: 'Once daily with meals' },
      { name: 'Atorvastatin', dose: '40mg', frequency: 'At bedtime' },
      { name: 'Metoprolol Succinate', dose: '25mg', frequency: 'Once daily morning' }
    ]),
    'Take cardiac medications consistently at the same hour each day. Report any unusual bleeding immediately.',
    30, 'ACTIVE'
  );

  // 9. Medical Reports
  db.prepare(`
    INSERT INTO medical_reports (patient_id, doctor_id, report_type, title, description, file_url, report_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    p1Id, d2Id, 'Laboratory', 'Arterial Blood Gas Analysis (ABG)',
    'pH: 7.39, PaCO2: 41 mmHg, PaO2: 92 mmHg, HCO3: 24 mEq/L, SaO2: 97%. Normalizing oxygenation parameters.',
    '/reports/abg_lab_p1.pdf', '2026-10-07'
  );

  db.prepare(`
    INSERT INTO medical_reports (patient_id, doctor_id, report_type, title, description, file_url, report_date)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    p2Id, d3Id, 'Radiology', 'Post-Op Coronary Angiogram & Chest X-Ray',
    'Successful revascularization of LAD with 0% residual stenosis. Clear lung fields bilaterally without pulmonary edema.',
    '/reports/coronary_angio_p2.pdf', '2026-10-06'
  );

  // 10. Equipment
  const insertEquip = db.prepare(`
    INSERT INTO equipment (name, serial_number, category, department_id, location, status, last_maintenance_date, next_maintenance_date, assigned_patient_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEquip.run('Dräger Evita V800 ICU Ventilator', 'EQ-VENT-001', 'Respiratory', 2, 'ICU Bed 201', 'IN_USE', '2026-09-15', '2026-11-15', p1Id);
  insertEquip.run('Mindray SV300 Portable Ventilator', 'EQ-VENT-002', 'Respiratory', 1, 'Emergency Trauma 1', 'AVAILABLE', '2026-09-20', '2026-11-20', null);
  insertEquip.run('Philips IntelliVue MX750 Patient Monitor', 'EQ-MON-001', 'Monitoring', 2, 'ICU Bed 201', 'IN_USE', '2026-08-10', '2026-12-10', p1Id);
  insertEquip.run('GE Healthcare MAC 2000 ECG Machine', 'EQ-ECG-001', 'Diagnostics', 3, 'Cardio Suite 305', 'AVAILABLE', '2026-07-01', '2026-11-01', null);
  insertEquip.run('Zoll R Series Defibrillator', 'EQ-DEF-001', 'Resuscitation', 1, 'Crash Cart Bay A', 'AVAILABLE', '2026-09-01', '2026-10-25', null);
  insertEquip.run('Siemens Somatom go.Top CT Scanner', 'EQ-CT-001', 'Radiology', 1, 'Radiology Room 1', 'MAINTENANCE', '2026-09-05', '2026-10-12', null);

  // 11. Inventory
  const insertInv = db.prepare(`
    INSERT INTO inventory (item_name, category, sku_code, quantity, minimum_stock, unit, unit_price, supplier, expiry_date, batch_number, storage_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertInv.run('Enoxaparin Sodium 40mg/0.4mL Injection', 'Cardiovascular', 'MED-ENOX-40', 140, 50, 'Prefilled Syringe', 18.50, 'Sanofi Healthcare', '2027-08-30', 'BT-7729', 'Pharmacy Cold Storage A');
  insertInv.run('Norepinephrine Bitartrate 4mg/4mL', 'Emergency Drugs', 'MED-NOREP-4', 24, 40, 'Vial', 34.00, 'Pfizer Hospital', '2027-03-15', 'BT-9912', 'ICU Emergency Lockbox'); // LOW STOCK
  insertInv.run('Propofol 1% 20mL Emulsion', 'Anesthesia', 'MED-PROP-20', 85, 30, 'Ampoule', 12.20, 'Fresenius Kabi', '2026-12-20', 'BT-4481', 'OT Anesthesia Rack');
  insertInv.run('N95 Particulate Respirator Masks', 'PPE Supplies', 'PPE-N95-01', 320, 100, 'Box of 20', 25.00, '3M HealthCare', '2029-01-01', 'BT-1029', 'Central Supply Rm 102');
  insertInv.run('Sterile Surgical Gloves 7.5', 'Consumables', 'GLV-SURG-75', 450, 150, 'Pairs', 1.80, 'Ansell Medical', '2028-06-15', 'BT-3320', 'Floor 2 Sterile Store');
  insertInv.run('Normal Saline 0.9% 500mL IV Bags', 'IV Fluids', 'IV-NS-500', 38, 80, 'Bags', 2.50, 'Baxter Healthcare', '2027-10-10', 'BT-8891', 'Fluid Bay Central'); // LOW STOCK

  // 12. Emergency Cases
  const insertEmerg = db.prepare(`
    INSERT INTO emergency_cases (case_number, patient_name, emergency_type, severity, triage_score, assigned_doctor_id, assigned_nurse_id, required_bed_type, status, triage_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEmerg.run('EM-2026-0081', 'Marcus Vance', 'Severe Chest Pain / Suspected STEMI', 'CRITICAL_1', 1, d1Id, n2Id, 'ICU', 'IN_TREATMENT', 'Onset 45 min prior. ST elevation in anterior leads. Cath lab activated.');
  insertEmerg.run('EM-2026-0082', 'Liam Chen', 'Motorcycle Collision / Multiple Contusions', 'EMERGENT_2', 2, d1Id, n2Id, 'EMERGENCY', 'TRIAGED', 'Conscious, GCS 14. Abdominal tenderness, FAST exam scheduled.');
  insertEmerg.run('EM-2026-0083', 'Nora Kelly', 'Acute Asthmatic Bronchospasm', 'URGENT_3', 3, d4Id, n4Id, 'EMERGENCY', 'PENDING', 'Wheezing bilaterally, peak flow 50% baseline. Nebulizer started.');

  // 13. Nurse Shifts
  const insertShift = db.prepare(`
    INSERT INTO nurse_shifts (shift_date, shift_type, department_id, predicted_workload_score, required_nurses, assigned_nurse_id, status, optimization_reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertShift.run('2026-10-08', 'MORNING', 2, 8.4, 2, n1Id, 'IN_PROGRESS', 'ML workload score 8.4: High ICU occupancy requires CCRN certification.');
  insertShift.run('2026-10-08', 'AFTERNOON', 1, 7.8, 3, n2Id, 'SCHEDULED', 'ML peak trauma intake pattern between 14:00 - 20:00.');
  insertShift.run('2026-10-08', 'NIGHT', 4, 4.2, 1, n4Id, 'SCHEDULED', 'Standard ward night observation roster.');

  // 14. Leave Requests
  db.prepare(`
    INSERT INTO leave_requests (staff_type, staff_id, staff_name, start_date, end_date, reason, status, reviewer_remarks)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('NURSE', n3Id, 'Nurse Grace Hopper', '2026-10-15', '2026-10-17', 'Continuing Medical Education (CME) Cardiac Seminar', 'APPROVED', 'Approved by Nurse Superintendent');

  // 15. Facilities
  const insertFacility = db.prepare(`
    INSERT INTO facilities (name, category, description, location, operating_hours, contact_number, status, capacity_metric)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertFacility.run('Emergency & Level 1 Trauma Center', 'Critical Care', '24/7 dedicated acute resuscitation, triage bays, and ambulance receiving docks.', 'Ground Floor, North Wing', '24 Hours / 7 Days', '+1 555-0911', 'AVAILABLE', '8 Trauma Bays Open');
  insertFacility.run('Intensive Care Unit (ICU)', 'Critical Care', 'Advanced closed-loop multi-parameter monitoring with dedicated HEPA isolation suites.', 'Building B, 2nd Floor', '24 Hours (Restricted Visiting)', '+1 555-0201', 'BUSY', '85% Capacity (17/20 Beds)');
  insertFacility.run('Cardiac Catheterization Laboratory', 'Diagnostics & Intervention', 'Biplane angiography suites for emergent coronary angioplasty and stenting.', 'Building A, 3rd Floor', '24/7 On-Call Emergent / 08:00 - 18:00 Elective', '+1 555-0305', 'AVAILABLE', '2 Cath Labs Active');
  insertFacility.run('Main 24/7 Outpatient & Inpatient Pharmacy', 'Pharmacy', 'Automated robotic dispensing, intravenous admixture, and controlled substance management.', 'Ground Floor, Central Atrium', '24 Hours / 7 Days', '+1 555-0150', 'AVAILABLE', '4 Counters Open');
  insertFacility.run('Central Diagnostic Laboratory & Pathology', 'Laboratory', 'Fully automated hematology, biochemistry, immunology, and rapid PCR testing.', 'Basement 1, East Wing', '24 Hours / 7 Days', '+1 555-0160', 'AVAILABLE', 'Rapid Turnaround Active');
  insertFacility.run('Advanced Diagnostic Radiology & MRI', 'Imaging', '3 Tesla MRI, 256-slice dual-energy CT, digital fluoroscopy, and ultrasound.', 'Ground Floor, South Wing', '07:00 - 23:00 (Emergency 24/7)', '+1 555-0170', 'AVAILABLE', 'Emergency CT Priority Active');
  insertFacility.run('Regional Blood Bank & Transfusion Medicine', 'Blood Bank', 'Whole blood, packed red cells, fresh frozen plasma, and apheresis platelet unit storage.', 'Building B, 1st Floor', '24 Hours / 7 Days', '+1 555-0180', 'AVAILABLE', 'O-Negative Stock Stable');
  insertFacility.run('Fleet Ambulance & Mobile Intensive Care', 'Transport', 'Type III Advanced Life Support (ALS) ambulances with onboard telemedicine links.', 'Ambulance Bay, West Entrance', '24 Hours / 7 Days', '+1 555-0199', 'AVAILABLE', '4 Units on Standby');

  // 16. Audit Logs
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (username, role, action, module, record_id, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertAudit.run('admin', 'ADMIN', 'SYSTEM_INITIALIZATION', 'CORE', '0', 'Hospital database schema bootstrapped and seed records loaded.');
  insertAudit.run('SYSTEM_GREEDY_OPT', 'SYSTEM', 'BED_ALLOCATION', 'BEDS', 'ICU-201', 'Assigned bed ICU-201 to Eleanor Vance (OP202600123) with score 98.5.');
  insertAudit.run('dr_wilson', 'DOCTOR', 'PRESCRIPTION_CREATED', 'PRESCRIPTIONS', '1', 'Cardiology medication regimen issued for Arthur Bradley (OP202600124).');

  // 17. Notifications
  const insertNotif = db.prepare(`
    INSERT INTO notifications (user_id, target_role, title, message, notification_type)
    VALUES (?, ?, ?, ?, ?)
  `);
  insertNotif.run(null, 'ADMIN', 'Low Stock Alert', 'Norepinephrine Bitartrate 4mg/4mL has fallen below minimum stock limit (Current: 24, Min: 40).', 'INVENTORY_ALERT');
  insertNotif.run(null, 'ADMIN', 'ICU Bed Occupancy High', 'ICU ward occupancy has exceeded 80% threshold. Consider proactive step-down evaluation.', 'BED_UPDATE');
  insertNotif.run(p1UserId, 'PATIENT', 'Admission Confirmed', 'Your bed assignment in ICU-201 has been confirmed under Dr. Robert Chen.', 'BED_UPDATE');
  insertNotif.run(p2UserId, 'PATIENT', 'Appointment Confirmed', 'Your Echocardiogram appointment with Dr. James Wilson is confirmed for 2026-10-12 at 02:00 PM.', 'APPOINTMENT');

  // 18. Historical ML Training Data (90 realistic days for regression model)
  const insertML = db.prepare(`
    INSERT INTO ml_training_data (record_date, day_of_week, month, admissions_count, discharges_count, emergency_cases_count, icu_occupied_count, general_occupied_count, active_nurses_count, medicine_units_consumed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const startDate = new Date('2026-07-01');
  for (let i = 0; i < 90; i++) {
    const cur = new Date(startDate);
    cur.setDate(startDate.getDate() + i);
    const dateStr = cur.toISOString().split('T')[0];
    const dow = cur.getDay(); // 0-6
    const month = cur.getMonth() + 1;

    // Realistic patterns: Mondays & Tuesdays have higher admissions, weekends have higher emergency trauma
    const isWeekend = dow === 0 || dow === 6;
    const baseAdm = isWeekend ? 14 : 28 + (dow === 1 ? 8 : (dow === 2 ? 6 : 0));
    const noiseAdm = Math.floor(Math.sin(i * 0.3) * 4) + Math.floor(Math.random() * 5);
    const admissions = Math.max(10, baseAdm + noiseAdm);

    const discharges = Math.max(8, Math.floor(admissions * 0.88) + (isWeekend ? -4 : 2));
    const emergency = Math.max(5, (isWeekend ? 22 : 14) + Math.floor(Math.random() * 6));
    const icuOcc = Math.min(20, Math.max(11, 14 + Math.floor(Math.sin(i * 0.2) * 3) + (emergency > 18 ? 2 : 0)));
    const genOcc = Math.min(100, Math.max(50, 70 + Math.floor(Math.sin(i * 0.15) * 12)));
    const nurses = Math.max(12, Math.floor((icuOcc * 0.5) + (genOcc * 0.12) + (emergency * 0.25)));
    const meds = admissions * 14 + icuOcc * 8 + Math.floor(Math.random() * 20);

    insertML.run(dateStr, dow, month, admissions, discharges, emergency, icuOcc, genOcc, nurses, meds);
  }
}
