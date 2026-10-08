import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.ts';
import { generateToken, authenticateJWT, requireRoles, AuthenticatedRequest, AuthUser } from '../middleware/authMiddleware.ts';
import { runGreedyBedAllocation } from '../algorithms/greedyBedAllocation.ts';
import { getLiveEmergencyPriorityQueue, EmergencyPriorityQueue, EmergencyPatientItem } from '../algorithms/priorityQueueEmergency.ts';
import { generateResourceForecast, trainHospitalPredictionModels } from '../ml/predictionEngine.ts';
import { optimizeNurseShifts } from '../algorithms/nurseShiftOptimizer.ts';
import { clinicalChat, transcribeAudio } from '../ai.ts';
import {
  getDatabaseStatus,
  testMysqlConnection,
  getAllTablesDetails,
  getTableRows,
  executeCustomSql,
  reinitializeDatabase,
  getSchemaScripts,
  applyLocalSchemaToMysql
} from '../services/databaseManager.ts';

export const apiRouter = Router();

// ==========================================
// 1. AUTHENTICATION & SESSION
// ==========================================

apiRouter.post('/auth/login', (req, res) => {
  const { identifier, password } = req.body; // identifier can be username OR op_number

  if (!identifier || !password) {
    return res.status(400).json({ error: 'Please provide both username/OP Number and password.' });
  }

  // Find user by username OR OP number
  const user = db.prepare(`
    SELECT u.*, p.id as patient_id, d.id as doctor_id, n.id as nurse_id
    FROM users u
    LEFT JOIN patients p ON p.user_id = u.id
    LEFT JOIN doctors d ON d.user_id = u.id
    LEFT JOIN nurses n ON n.user_id = u.id
    WHERE u.username = ? OR u.email = ?
  `).get(identifier.trim(), identifier.trim()) as (AuthUser & { password?: string }) | undefined;

  if (!user || !user.password) {
    return res.status(401).json({ error: 'Invalid OP Number / username or password.' });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid OP Number / username or password.' });
  }

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
    email: user.email,
    patient_id: user.patient_id,
    doctor_id: user.doctor_id,
    nurse_id: user.nurse_id
  };

  const token = generateToken(authUser);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (username, role, action, module, record_id, details)
    VALUES (?, ?, 'LOGIN', 'AUTH', ?, 'User successfully logged in via credentials.')
  `).run(authUser.username, authUser.role, String(authUser.id));

  return res.json({ token, user: authUser });
});

apiRouter.get('/auth/me', authenticateJWT, (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });

  // Refresh user payload from database
  const user = db.prepare(`
    SELECT u.id, u.username, u.role, u.full_name, u.email, u.phone,
           p.id as patient_id, p.op_number, p.admission_status, p.current_bed_id,
           d.id as doctor_id, d.specialization,
           n.id as nurse_id, n.skill_level
    FROM users u
    LEFT JOIN patients p ON p.user_id = u.id
    LEFT JOIN doctors d ON d.user_id = u.id
    LEFT JOIN nurses n ON n.user_id = u.id
    WHERE u.id = ?
  `).get(req.user.id);

  return res.json({ user });
});

// Quick role switch for instant evaluation/testing
apiRouter.post('/auth/quick-switch', (req, res) => {
  const { targetRole } = req.body;
  let targetUsername = 'admin';

  if (targetRole === 'DOCTOR') targetUsername = 'dr_mitchell';
  else if (targetRole === 'NURSE') targetUsername = 'nurse_charlotte';
  else if (targetRole === 'PATIENT') targetUsername = 'OP202600123';
  else if (targetRole === 'RECEPTIONIST') targetUsername = 'admin';

  const user = db.prepare(`
    SELECT u.*, p.id as patient_id, d.id as doctor_id, n.id as nurse_id
    FROM users u
    LEFT JOIN patients p ON p.user_id = u.id
    LEFT JOIN doctors d ON d.user_id = u.id
    LEFT JOIN nurses n ON n.user_id = u.id
    WHERE u.username = ?
  `).get(targetUsername) as AuthUser | undefined;

  if (!user) {
    return res.status(404).json({ error: `User with role ${targetRole} not found.` });
  }

  const authUser: AuthUser = {
    id: user.id,
    username: user.username,
    role: user.role,
    full_name: user.full_name,
    email: user.email,
    patient_id: user.patient_id,
    doctor_id: user.doctor_id,
    nurse_id: user.nurse_id
  };

  const token = generateToken(authUser);
  return res.json({ token, user: authUser });
});

// ==========================================
// 2. DASHBOARD AGGREGATED METRICS & STATS
// ==========================================

apiRouter.get('/dashboard/stats', authenticateJWT, (req, res) => {
  const totalPatients = (db.prepare(`SELECT COUNT(*) as count FROM patients`).get() as { count: number }).count;
  const admittedPatients = (db.prepare(`SELECT COUNT(*) as count FROM patients WHERE admission_status = 'ADMITTED'`).get() as { count: number }).count;

  const bedStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied,
      SUM(CASE WHEN status = 'CLEANING' THEN 1 ELSE 0 END) as cleaning,
      SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance,
      SUM(CASE WHEN bed_type = 'ICU' THEN 1 ELSE 0 END) as icu_total,
      SUM(CASE WHEN bed_type = 'ICU' AND status = 'AVAILABLE' THEN 1 ELSE 0 END) as icu_available,
      SUM(CASE WHEN bed_type = 'ICU' AND status = 'OCCUPIED' THEN 1 ELSE 0 END) as icu_occupied
    FROM beds
  `).get() as Record<string, number>;

  const equipmentStats = db.prepare(`
    SELECT
      COUNT(*) as total,
      SUM(CASE WHEN status = 'AVAILABLE' THEN 1 ELSE 0 END) as available,
      SUM(CASE WHEN status = 'IN_USE' THEN 1 ELSE 0 END) as in_use,
      SUM(CASE WHEN status = 'MAINTENANCE' THEN 1 ELSE 0 END) as maintenance
    FROM equipment
  `).get() as Record<string, number>;

  const doctorsAvailable = (db.prepare(`SELECT COUNT(*) as count FROM doctors WHERE availability_status = 'AVAILABLE'`).get() as { count: number }).count;
  const nursesOnDuty = (db.prepare(`SELECT COUNT(*) as count FROM nurses WHERE availability_status IN ('AVAILABLE', 'ON_DUTY')`).get() as { count: number }).count;
  const pendingEmergencies = (db.prepare(`SELECT COUNT(*) as count FROM emergency_cases WHERE status IN ('PENDING', 'TRIAGED')`).get() as { count: number }).count;
  const lowStockCount = (db.prepare(`SELECT COUNT(*) as count FROM inventory WHERE quantity <= minimum_stock`).get() as { count: number }).count;
  const pendingLeaves = (db.prepare(`SELECT COUNT(*) as count FROM leave_requests WHERE status = 'PENDING'`).get() as { count: number }).count;
  const pendingAppointments = (db.prepare(`SELECT COUNT(*) as count FROM appointments WHERE status = 'PENDING'`).get() as { count: number }).count;

  return res.json({
    patients: {
      total: totalPatients,
      admitted: admittedPatients,
      outpatients: totalPatients - admittedPatients
    },
    beds: {
      total: bedStats.total || 0,
      available: bedStats.available || 0,
      occupied: bedStats.occupied || 0,
      cleaning: bedStats.cleaning || 0,
      maintenance: bedStats.maintenance || 0,
      occupancy_rate: bedStats.total ? Number(((bedStats.occupied / bedStats.total) * 100).toFixed(1)) : 0,
      icu: {
        total: bedStats.icu_total || 0,
        available: bedStats.icu_available || 0,
        occupied: bedStats.icu_occupied || 0,
        occupancy_rate: bedStats.icu_total ? Number(((bedStats.icu_occupied / bedStats.icu_total) * 100).toFixed(1)) : 0
      }
    },
    staff: {
      doctors_available: doctorsAvailable,
      nurses_on_duty: nursesOnDuty,
      pending_leaves: pendingLeaves
    },
    operations: {
      pending_emergencies: pendingEmergencies,
      low_stock_alerts: lowStockCount,
      pending_appointments: pendingAppointments,
      equipment_available: equipmentStats.available || 0,
      equipment_maintenance: equipmentStats.maintenance || 0
    }
  });
});

// ==========================================
// 3. PATIENT MANAGEMENT
// ==========================================

apiRouter.get('/patients', authenticateJWT, (req: AuthenticatedRequest, res) => {
  // If role is PATIENT, only return their own record!
  if (req.user?.role === 'PATIENT') {
    const patient = db.prepare(`
      SELECT p.*, d.name as department_name, doc.name as doctor_name, b.bed_number, b.ward
      FROM patients p
      LEFT JOIN departments d ON p.assigned_department_id = d.id
      LEFT JOIN doctors doc ON p.assigned_doctor_id = doc.id
      LEFT JOIN beds b ON p.current_bed_id = b.id
      WHERE p.user_id = ?
    `).get(req.user.id);
    return res.json({ patients: patient ? [patient] : [] });
  }

  const { search, department_id, admission_status } = req.query;
  let sql = `
    SELECT p.*, d.name as department_name, doc.name as doctor_name, b.bed_number, b.ward
    FROM patients p
    LEFT JOIN departments d ON p.assigned_department_id = d.id
    LEFT JOIN doctors doc ON p.assigned_doctor_id = doc.id
    LEFT JOIN beds b ON p.current_bed_id = b.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (search) {
    sql += ` AND (p.name LIKE ? OR p.op_number LIKE ? OR p.phone LIKE ?)`;
    const q = `%${search}%`;
    params.push(q, q, q);
  }
  if (department_id) {
    sql += ` AND p.assigned_department_id = ?`;
    params.push(department_id);
  }
  if (admission_status) {
    sql += ` AND p.admission_status = ?`;
    params.push(admission_status);
  }

  sql += ` ORDER BY p.id DESC`;
  const patients = db.prepare(sql).all(...(params as any[]));
  return res.json({ patients });
});

apiRouter.get('/patients/:id', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const patientId = Number(req.params.id);

  // Security: Patient cannot view another patient
  if (req.user?.role === 'PATIENT' && req.user.patient_id !== patientId) {
    return res.status(403).json({ error: 'Access denied: You may only view your own medical profile.' });
  }

  const patient = db.prepare(`
    SELECT p.*, d.name as department_name, doc.name as doctor_name, doc.specialization,
           b.bed_number, b.ward, b.floor_number, b.bed_type
    FROM patients p
    LEFT JOIN departments d ON p.assigned_department_id = d.id
    LEFT JOIN doctors doc ON p.assigned_doctor_id = doc.id
    LEFT JOIN beds b ON p.current_bed_id = b.id
    WHERE p.id = ?
  `).get(patientId);

  if (!patient) return res.status(404).json({ error: 'Patient not found' });
  return res.json({ patient });
});

apiRouter.post('/patients', authenticateJWT, requireRoles('ADMIN', 'DOCTOR', 'RECEPTIONIST'), (req: AuthenticatedRequest, res) => {
  const { name, dob, age, gender, blood_group, phone, email, address, emergency_contact, severity, assigned_department_id, assigned_doctor_id, triage_notes } = req.body;

  if (!name || !phone || !emergency_contact) {
    return res.status(400).json({ error: 'Patient name, phone, and emergency contact are mandatory.' });
  }

  // Generate unique OP number OP2026 + 5-digit sequence
  const latestPatient = db.prepare(`SELECT id FROM patients ORDER BY id DESC LIMIT 1`).get() as { id: number } | undefined;
  const nextSeq = (latestPatient ? latestPatient.id + 1 : 1).toString().padStart(5, '0');
  const opNumber = `OP2026${nextSeq}`;

  try {
    db.exec('BEGIN TRANSACTION;');

    // Create user account for patient login
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync('Patient@123', salt);
    const userId = db.prepare(`
      INSERT INTO users (username, password, role, full_name, email, phone)
      VALUES (?, ?, 'PATIENT', ?, ?, ?)
    `).run(opNumber, hash, name, email || `${opNumber.toLowerCase()}@hospital.org`, phone).lastInsertRowid;

    const patientId = db.prepare(`
      INSERT INTO patients (user_id, op_number, name, dob, age, gender, blood_group, phone, email, address, emergency_contact, severity, assigned_department_id, assigned_doctor_id, triage_notes, admission_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'OUTPATIENT')
    `).run(
      userId, opNumber, name, dob || null, Number(age) || 30, gender || 'Other', blood_group || 'O+',
      phone, email || null, address || null, emergency_contact, severity || 'NORMAL',
      assigned_department_id || 4, assigned_doctor_id || null, triage_notes || null
    ).lastInsertRowid;

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (username, role, action, module, record_id, details)
      VALUES (?, ?, 'REGISTER_PATIENT', 'PATIENT', ?, ?)
    `).run(req.user?.username || 'SYSTEM', req.user?.role || 'ADMIN', String(patientId), `Registered new patient ${name} with OP ${opNumber}`);

    db.exec('COMMIT;');

    return res.status(201).json({
      message: 'Patient registered successfully.',
      patient: { id: patientId, op_number: opNumber, name, phone }
    });
  } catch (err: unknown) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.post('/patients/:id/discharge', authenticateJWT, requireRoles('ADMIN', 'DOCTOR'), (req: AuthenticatedRequest, res) => {
  const patientId = Number(req.params.id);

  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(patientId) as { current_bed_id?: number; name: string } | undefined;
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  try {
    db.exec('BEGIN TRANSACTION;');

    // Release bed if occupied
    if (patient.current_bed_id) {
      db.prepare(`
        UPDATE beds
        SET status = 'CLEANING', current_patient_id = NULL, last_cleaned_time = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(patient.current_bed_id);

      db.prepare(`
        UPDATE bed_allocations
        SET status = 'DISCHARGED', release_time = CURRENT_TIMESTAMP
        WHERE bed_id = ? AND patient_id = ? AND status = 'ACTIVE'
      `).run(patient.current_bed_id, patientId);
    }

    // Update patient status
    db.prepare(`
      UPDATE patients
      SET admission_status = 'DISCHARGED', current_bed_id = NULL
      WHERE id = ?
    `).run(patientId);

    // Audit log
    db.prepare(`
      INSERT INTO audit_logs (username, role, action, module, record_id, details)
      VALUES (?, ?, 'DISCHARGE_PATIENT', 'PATIENT', ?, ?)
    `).run(req.user?.username || 'STAFF', req.user?.role || 'ADMIN', String(patientId), `Discharged patient ${patient.name}. Bed released to CLEANING.`);

    db.exec('COMMIT;');
    return res.json({ message: `Patient ${patient.name} successfully discharged. Assigned bed set to cleaning.` });
  } catch (err: unknown) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ==========================================
// 4. BED MANAGEMENT & GREEDY ALLOCATION
// ==========================================

apiRouter.get('/beds', authenticateJWT, (req, res) => {
  const { status, bed_type, department_id } = req.query;
  let sql = `
    SELECT b.*, d.name as department_name, p.name as current_patient_name, p.op_number as patient_op_number, p.severity as patient_severity
    FROM beds b
    JOIN departments d ON b.department_id = d.id
    LEFT JOIN patients p ON b.current_patient_id = p.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (status) {
    sql += ` AND b.status = ?`;
    params.push(status);
  }
  if (bed_type) {
    sql += ` AND b.bed_type = ?`;
    params.push(bed_type);
  }
  if (department_id) {
    sql += ` AND b.department_id = ?`;
    params.push(department_id);
  }

  sql += ` ORDER BY b.ward ASC, b.bed_number ASC`;
  const beds = db.prepare(sql).all(...(params as any[]));
  return res.json({ beds });
});

apiRouter.post('/beds', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  const { bed_number, ward, department_id, bed_type, floor_number, has_ventilator, has_oxygen_support } = req.body;

  if (!bed_number || !ward || !department_id || !bed_type) {
    return res.status(400).json({ error: 'Missing required bed parameters.' });
  }

  try {
    const id = db.prepare(`
      INSERT INTO beds (bed_number, ward, department_id, bed_type, floor_number, status, has_ventilator, has_oxygen_support)
      VALUES (?, ?, ?, ?, ?, 'AVAILABLE', ?, ?)
    `).run(bed_number, ward, department_id, bed_type, floor_number || 1, has_ventilator ? 1 : 0, has_oxygen_support !== false ? 1 : 0).lastInsertRowid;

    db.prepare(`
      INSERT INTO audit_logs (username, role, action, module, record_id, details)
      VALUES (?, 'ADMIN', 'ADD_BED', 'BED_MANAGEMENT', ?, ?)
    `).run(req.user?.username || 'ADMIN', String(id), `Added bed ${bed_number} in ${ward}`);

    return res.status(201).json({ message: 'Bed added successfully', id });
  } catch (err: unknown) {
    return res.status(400).json({ error: (err as Error).message });
  }
});

apiRouter.put('/beds/:id/status', authenticateJWT, requireRoles('ADMIN', 'NURSE', 'DOCTOR'), (req: AuthenticatedRequest, res) => {
  const bedId = Number(req.params.id);
  const { status } = req.body;

  if (!['AVAILABLE', 'OCCUPIED', 'RESERVED', 'CLEANING', 'MAINTENANCE'].includes(status)) {
    return res.status(400).json({ error: 'Invalid bed status.' });
  }

  db.prepare(`
    UPDATE beds
    SET status = ?, last_cleaned_time = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(status, bedId);

  db.prepare(`
    INSERT INTO audit_logs (username, role, action, module, record_id, details)
    VALUES (?, ?, 'UPDATE_BED_STATUS', 'BED_MANAGEMENT', ?, ?)
  `).run(req.user?.username || 'STAFF', req.user?.role || 'STAFF', String(bedId), `Changed bed #${bedId} status to ${status}`);

  return res.json({ message: `Bed status updated to ${status}.` });
});

// GREEDY BED ALLOCATION ENDPOINT
apiRouter.post('/beds/allocate', authenticateJWT, requireRoles('ADMIN', 'DOCTOR', 'NURSE', 'RECEPTIONIST'), (req: AuthenticatedRequest, res) => {
  const { patient_id, severity, requires_ventilator, requires_oxygen, preferred_bed_type, assigned_department_id } = req.body;

  if (!patient_id) {
    return res.status(400).json({ error: 'patient_id is required for bed allocation.' });
  }

  const patient = db.prepare(`SELECT * FROM patients WHERE id = ?`).get(patient_id) as { id: number; name: string; severity: string; assigned_department_id: number; current_bed_id?: number } | undefined;
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  if (patient.current_bed_id) {
    return res.status(400).json({ error: `Patient already has assigned bed #${patient.current_bed_id}. Release existing bed first.` });
  }

  const result = runGreedyBedAllocation({
    patient_id: patient.id,
    patient_name: patient.name,
    severity: (severity || patient.severity || 'NORMAL') as 'EMERGENCY' | 'CRITICAL' | 'HIGH' | 'NORMAL',
    assigned_department_id: assigned_department_id || patient.assigned_department_id,
    requires_ventilator: Boolean(requires_ventilator),
    requires_oxygen: Boolean(requires_oxygen),
    preferred_bed_type,
    allocated_by: req.user?.username || 'GREEDY_SERVICE'
  });

  if (!result.success) {
    return res.status(409).json(result);
  }

  return res.json(result);
});

// ==========================================
// 5. DOCTORS & APPOINTMENTS
// ==========================================

apiRouter.get('/doctors', authenticateJWT, (req, res) => {
  const { department_id } = req.query;
  let sql = `
    SELECT d.*, dept.name as department_name,
           (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = d.id AND a.appointment_date = CURRENT_DATE) as today_appointments_count
    FROM doctors d
    JOIN departments dept ON d.department_id = dept.id
    WHERE 1=1
  `;
  const params: unknown[] = [];
  if (department_id) {
    sql += ` AND d.department_id = ?`;
    params.push(department_id);
  }
  const doctors = db.prepare(sql).all(...(params as any[]));
  return res.json({ doctors });
});

apiRouter.get('/appointments', authenticateJWT, (req: AuthenticatedRequest, res) => {
  let sql = `
    SELECT a.*, p.name as patient_name, p.op_number, doc.name as doctor_name, doc.specialization, dept.name as department_name
    FROM appointments a
    JOIN patients p ON a.patient_id = p.id
    JOIN doctors doc ON a.doctor_id = doc.id
    JOIN departments dept ON a.department_id = dept.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  // If patient, only show their own appointments
  if (req.user?.role === 'PATIENT') {
    sql += ` AND p.user_id = ?`;
    params.push(req.user.id);
  } else if (req.user?.role === 'DOCTOR') {
    // If doctor, only show appointments booked with them
    sql += ` AND doc.user_id = ?`;
    params.push(req.user.id);
  }

  sql += ` ORDER BY a.appointment_date DESC, a.time_slot ASC`;
  const appointments = db.prepare(sql).all(...(params as any[]));
  return res.json({ appointments });
});

apiRouter.post('/appointments', authenticateJWT, (req: AuthenticatedRequest, res) => {
  let { patient_id, doctor_id, department_id, appointment_date, time_slot, reason } = req.body;

  // If logged in as patient, enforce patient_id to be their own
  if (req.user?.role === 'PATIENT') {
    if (!req.user.patient_id) {
      return res.status(400).json({ error: 'Patient profile not linked to user account.' });
    }
    patient_id = req.user.patient_id;
  }

  if (!patient_id || !doctor_id || !appointment_date || !time_slot) {
    return res.status(400).json({ error: 'Missing mandatory appointment parameters.' });
  }

  // Prevent double booking of same doctor & time slot
  const collision = db.prepare(`
    SELECT id FROM appointments
    WHERE doctor_id = ? AND appointment_date = ? AND time_slot = ? AND status != 'CANCELLED'
  `).get(doctor_id, appointment_date, time_slot);

  if (collision) {
    return res.status(409).json({ error: 'This time slot is already booked for the selected doctor. Please choose another time.' });
  }

  // If department_id wasn't provided, fetch from doctor record
  if (!department_id) {
    const doc = db.prepare(`SELECT department_id FROM doctors WHERE id = ?`).get(doctor_id) as { department_id: number } | undefined;
    department_id = doc?.department_id || 1;
  }

  const apptId = db.prepare(`
    INSERT INTO appointments (patient_id, doctor_id, department_id, appointment_date, time_slot, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'CONFIRMED')
  `).run(patient_id, doctor_id, department_id, appointment_date, time_slot, reason || 'Clinical Consultation').lastInsertRowid;

  // Add notification
  const patient = db.prepare(`SELECT user_id, name FROM patients WHERE id = ?`).get(patient_id) as { user_id: number; name: string } | undefined;
  if (patient) {
    db.prepare(`
      INSERT INTO notifications (user_id, target_role, title, message, notification_type)
      VALUES (?, 'PATIENT', 'Appointment Confirmed', ?, 'APPOINTMENT')
    `).run(patient.user_id, `Your appointment on ${appointment_date} at ${time_slot} is confirmed.`);
  }

  return res.status(201).json({ message: 'Appointment booked and confirmed.', id: apptId });
});

apiRouter.put('/appointments/:id/status', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const apptId = Number(req.params.id);
  const { status } = req.body;

  if (!['CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }

  db.prepare(`UPDATE appointments SET status = ? WHERE id = ?`).run(status, apptId);
  return res.json({ message: `Appointment status updated to ${status}.` });
});

// ==========================================
// 6. EMERGENCY MANAGEMENT & PRIORITY QUEUE
// ==========================================

apiRouter.get('/emergency/queue', authenticateJWT, (req, res) => {
  const queue = getLiveEmergencyPriorityQueue();
  return res.json({ queue, count: queue.length });
});

apiRouter.post('/emergency', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { patient_name, emergency_type, severity, required_bed_type, triage_notes } = req.body;

  if (!patient_name || !emergency_type || !severity) {
    return res.status(400).json({ error: 'Patient name, emergency type, and severity rating are required.' });
  }

  const latestEmerg = db.prepare(`SELECT id FROM emergency_cases ORDER BY id DESC LIMIT 1`).get() as { id: number } | undefined;
  const seq = (latestEmerg ? latestEmerg.id + 1 : 1).toString().padStart(4, '0');
  const caseNumber = `EM-2026-${seq}`;

  let triageScore = 3;
  if (severity === 'CRITICAL_1') triageScore = 1;
  else if (severity === 'EMERGENT_2') triageScore = 2;
  else if (severity === 'URGENT_3') triageScore = 3;
  else if (severity === 'LESS_URGENT_4') triageScore = 4;
  else if (severity === 'NON_URGENT_5') triageScore = 5;

  const id = db.prepare(`
    INSERT INTO emergency_cases (case_number, patient_name, emergency_type, severity, triage_score, required_bed_type, status, triage_notes)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING', ?)
  `).run(caseNumber, patient_name, emergency_type, severity, triageScore, required_bed_type || 'EMERGENCY', triage_notes || null).lastInsertRowid;

  // Real-time broadcast / notification alert
  db.prepare(`
    INSERT INTO notifications (target_role, title, message, notification_type)
    VALUES ('ADMIN', 'Emergency Code Alert', ?, 'EMERGENCY')
  `).run(`Code Red: ${patient_name} presented with ${emergency_type} [Severity: ${severity}]. Triage priority active.`);

  // Audit log
  db.prepare(`
    INSERT INTO audit_logs (username, role, action, module, record_id, details)
    VALUES (?, ?, 'CREATE_EMERGENCY', 'EMERGENCY', ?, ?)
  `).run(req.user?.username || 'STAFF', req.user?.role || 'STAFF', String(id), `Emergency case ${caseNumber} initiated for ${patient_name}`);

  return res.status(201).json({ message: 'Emergency case registered in triage priority queue.', case_number: caseNumber, id });
});

apiRouter.post('/emergency/:id/triage', authenticateJWT, requireRoles('ADMIN', 'DOCTOR', 'NURSE'), (req: AuthenticatedRequest, res) => {
  const caseId = Number(req.params.id);
  const { assigned_doctor_id, assigned_nurse_id, bed_id, notes } = req.body;

  db.prepare(`
    UPDATE emergency_cases
    SET status = 'IN_TREATMENT', assigned_doctor_id = ?, assigned_nurse_id = ?, triage_notes = COALESCE(?, triage_notes)
    WHERE id = ?
  `).run(assigned_doctor_id || null, assigned_nurse_id || null, notes || null, caseId);

  // If a bed was assigned, mark it occupied
  if (bed_id) {
    db.prepare(`UPDATE beds SET status = 'OCCUPIED' WHERE id = ?`).run(bed_id);
  }

  return res.json({ message: 'Emergency triage assigned and patient dispatched for active treatment.' });
});

apiRouter.put('/emergency/:id/resolve', authenticateJWT, requireRoles('ADMIN', 'DOCTOR'), (req, res) => {
  const caseId = Number(req.params.id);
  db.prepare(`UPDATE emergency_cases SET status = 'RESOLVED' WHERE id = ?`).run(caseId);
  return res.json({ message: 'Emergency case resolved and stabilized.' });
});

// ==========================================
// 7. NURSES, SHIFTS & LEAVE MANAGEMENT
// ==========================================

apiRouter.get('/nurses', authenticateJWT, (req, res) => {
  const nurses = db.prepare(`
    SELECT n.*, dept.name as department_name
    FROM nurses n
    JOIN departments dept ON n.department_id = dept.id
  `).all();
  return res.json({ nurses });
});

apiRouter.get('/shifts', authenticateJWT, (req: AuthenticatedRequest, res) => {
  let sql = `
    SELECT ns.*, n.name as nurse_name, n.skill_level, dept.name as department_name
    FROM nurse_shifts ns
    JOIN nurses n ON ns.assigned_nurse_id = n.id
    JOIN departments dept ON ns.department_id = dept.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (req.user?.role === 'NURSE' && req.user.nurse_id) {
    sql += ` AND ns.assigned_nurse_id = ?`;
    params.push(req.user.nurse_id);
  }

  sql += ` ORDER BY ns.shift_date DESC, ns.shift_type ASC LIMIT 50`;
  const shifts = db.prepare(sql).all(...(params as any[]));
  return res.json({ shifts });
});

// Intelligent Nurse Shift Optimization Trigger
apiRouter.post('/shifts/optimize', authenticateJWT, requireRoles('ADMIN'), (req, res) => {
  const targetDate = req.body.target_date || new Date().toISOString().split('T')[0];
  const result = optimizeNurseShifts(targetDate);
  return res.json(result);
});

apiRouter.get('/leaves', authenticateJWT, (req: AuthenticatedRequest, res) => {
  let sql = `SELECT * FROM leave_requests WHERE 1=1`;
  const params: unknown[] = [];

  if (req.user?.role === 'NURSE' && req.user.nurse_id) {
    sql += ` AND staff_type = 'NURSE' AND staff_id = ?`;
    params.push(req.user.nurse_id);
  }

  sql += ` ORDER BY id DESC`;
  const leaves = db.prepare(sql).all(...(params as any[]));
  return res.json({ leaves });
});

apiRouter.post('/leaves', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const { start_date, end_date, reason } = req.body;
  if (!start_date || !end_date || !reason) {
    return res.status(400).json({ error: 'Start date, end date, and reason are required.' });
  }

  const staffType = req.user?.role === 'DOCTOR' ? 'DOCTOR' : 'NURSE';
  const staffId = (req.user?.role === 'DOCTOR' ? req.user.doctor_id : req.user?.nurse_id) || req.user?.id || 1;
  const staffName = req.user?.full_name || 'Staff Member';

  const id = db.prepare(`
    INSERT INTO leave_requests (staff_type, staff_id, staff_name, start_date, end_date, reason, status)
    VALUES (?, ?, ?, ?, ?, ?, 'PENDING')
  `).run(staffType, staffId, staffName, start_date, end_date, reason).lastInsertRowid;

  return res.status(201).json({ message: 'Leave request submitted for administrative review.', id });
});

apiRouter.put('/leaves/:id/approve', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  const leaveId = Number(req.params.id);
  const { remarks } = req.body;

  const leave = db.prepare(`SELECT * FROM leave_requests WHERE id = ?`).get(leaveId) as { staff_type: string; staff_id: number; staff_name: string } | undefined;
  if (!leave) return res.status(404).json({ error: 'Leave request not found' });

  db.prepare(`
    UPDATE leave_requests
    SET status = 'APPROVED', reviewer_remarks = ?, reviewed_by = ?
    WHERE id = ?
  `).run(remarks || 'Approved by Admin', req.user?.username || 'ADMIN', leaveId);

  // If nurse, update availability to ON_LEAVE
  if (leave.staff_type === 'NURSE') {
    db.prepare(`UPDATE nurses SET availability_status = 'ON_LEAVE' WHERE id = ?`).run(leave.staff_id);
  }

  db.prepare(`
    INSERT INTO audit_logs (username, role, action, module, record_id, details)
    VALUES (?, 'ADMIN', 'APPROVE_LEAVE', 'LEAVE_MANAGEMENT', ?, ?)
  `).run(req.user?.username || 'ADMIN', String(leaveId), `Approved leave for ${leave.staff_name}`);

  return res.json({ message: `Leave for ${leave.staff_name} approved. Shift availability updated.` });
});

apiRouter.put('/leaves/:id/reject', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  const leaveId = Number(req.params.id);
  const { remarks } = req.body;

  db.prepare(`
    UPDATE leave_requests
    SET status = 'REJECTED', reviewer_remarks = ?, reviewed_by = ?
    WHERE id = ?
  `).run(remarks || 'Operational staffing requirements', req.user?.username || 'ADMIN', leaveId);

  return res.json({ message: 'Leave request rejected.' });
});

// ==========================================
// 8. EQUIPMENT & INVENTORY
// ==========================================

apiRouter.get('/equipment', authenticateJWT, (req, res) => {
  const equipment = db.prepare(`
    SELECT eq.*, dept.name as department_name, p.name as assigned_patient_name
    FROM equipment eq
    JOIN departments dept ON eq.department_id = dept.id
    LEFT JOIN patients p ON eq.assigned_patient_id = p.id
    ORDER BY eq.category ASC
  `).all();
  return res.json({ equipment });
});

apiRouter.post('/equipment', authenticateJWT, requireRoles('ADMIN'), (req: AuthenticatedRequest, res) => {
  const { name, serial_number, category, department_id, location } = req.body;
  if (!name || !serial_number || !category || !department_id) {
    return res.status(400).json({ error: 'Missing mandatory equipment parameters.' });
  }

  const id = db.prepare(`
    INSERT INTO equipment (name, serial_number, category, department_id, location, status, last_maintenance_date, next_maintenance_date)
    VALUES (?, ?, ?, ?, ?, 'AVAILABLE', CURRENT_DATE, DATE(CURRENT_DATE, '+60 days'))
  `).run(name, serial_number, category, department_id, location || 'General Bay').lastInsertRowid;

  return res.status(201).json({ message: 'Medical device registered successfully.', id });
});

apiRouter.put('/equipment/:id/status', authenticateJWT, requireRoles('ADMIN', 'DOCTOR', 'NURSE'), (req, res) => {
  const equipId = Number(req.params.id);
  const { status } = req.body;

  db.prepare(`UPDATE equipment SET status = ? WHERE id = ?`).run(status, equipId);
  return res.json({ message: `Equipment status updated to ${status}.` });
});

apiRouter.get('/inventory', authenticateJWT, (req, res) => {
  const inventory = db.prepare(`
    SELECT *, (quantity <= minimum_stock) as is_low_stock
    FROM inventory
    ORDER BY is_low_stock DESC, category ASC
  `).all();
  return res.json({ inventory });
});

apiRouter.post('/inventory/restock', authenticateJWT, requireRoles('ADMIN', 'STAFF', 'RECEPTIONIST'), (req: AuthenticatedRequest, res) => {
  const { item_id, quantity, notes } = req.body;
  const numQty = Number(quantity);
  if (!item_id || !numQty || numQty <= 0) {
    return res.status(400).json({ error: 'Valid item_id and positive quantity required.' });
  }

  db.prepare(`UPDATE inventory SET quantity = quantity + ? WHERE id = ?`).run(numQty, item_id);

  db.prepare(`
    INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity_changed, performed_by, notes)
    VALUES (?, 'RESTOCK', ?, ?, ?)
  `).run(item_id, numQty, req.user?.username || 'ADMIN', notes || 'Shipment Restock Batch');

  return res.json({ message: `Restocked ${numQty} units successfully.` });
});

apiRouter.post('/inventory/consume', authenticateJWT, requireRoles('ADMIN', 'DOCTOR', 'NURSE'), (req: AuthenticatedRequest, res) => {
  const { item_id, quantity, notes } = req.body;
  const numQty = Number(quantity);
  if (!item_id || !numQty || numQty <= 0) {
    return res.status(400).json({ error: 'Valid item_id and positive quantity required.' });
  }

  const item = db.prepare(`SELECT * FROM inventory WHERE id = ?`).get(item_id) as { quantity: number; minimum_stock: number; item_name: string } | undefined;
  if (!item) return res.status(404).json({ error: 'Item not found' });
  if (item.quantity < numQty) {
    return res.status(400).json({ error: `Insufficient stock. Current available: ${item.quantity}` });
  }

  const remaining = item.quantity - numQty;
  db.prepare(`UPDATE inventory SET quantity = ? WHERE id = ?`).run(remaining, item_id);

  db.prepare(`
    INSERT INTO inventory_transactions (inventory_id, transaction_type, quantity_changed, performed_by, notes)
    VALUES (?, 'CONSUMPTION', ?, ?, ?)
  `).run(item_id, -numQty, req.user?.username || 'STAFF', notes || 'Clinical Ward Dispensation');

  // Trigger alert if low stock
  if (remaining <= item.minimum_stock) {
    db.prepare(`
      INSERT INTO notifications (target_role, title, message, notification_type)
      VALUES ('ADMIN', 'Low Stock Alert', ?, 'INVENTORY_ALERT')
    `).run(`Critical Alert: ${item.item_name} has fallen to ${remaining} units (Min threshold: ${item.minimum_stock}).`);
  }

  return res.json({ message: `Dispensed ${numQty} units. Remaining: ${remaining}` });
});

// ==========================================
// 9. MEDICAL RECORDS, PRESCRIPTIONS & REPORTS
// ==========================================

apiRouter.get('/medical-records', authenticateJWT, (req: AuthenticatedRequest, res) => {
  let sql = `
    SELECT mr.*, p.name as patient_name, p.op_number, doc.name as doctor_name
    FROM medical_records mr
    JOIN patients p ON mr.patient_id = p.id
    JOIN doctors doc ON mr.doctor_id = doc.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (req.user?.role === 'PATIENT') {
    sql += ` AND p.user_id = ?`;
    params.push(req.user.id);
  } else if (req.query.patient_id) {
    sql += ` AND mr.patient_id = ?`;
    params.push(req.query.patient_id);
  }

  sql += ` ORDER BY mr.record_date DESC`;
  const records = db.prepare(sql).all(...(params as any[]));
  return res.json({ records });
});

apiRouter.post('/medical-records', authenticateJWT, requireRoles('DOCTOR', 'ADMIN'), (req: AuthenticatedRequest, res) => {
  const { patient_id, record_type, diagnosis, clinical_notes, vitals } = req.body;
  const doctorId = req.user?.doctor_id || 1;

  if (!patient_id || !diagnosis) {
    return res.status(400).json({ error: 'Patient ID and diagnosis are mandatory.' });
  }

  const id = db.prepare(`
    INSERT INTO medical_records (patient_id, doctor_id, record_type, diagnosis, clinical_notes, vitals_json)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(patient_id, doctorId, record_type || 'General Consultation', diagnosis, clinical_notes || null, JSON.stringify(vitals || {})).lastInsertRowid;

  return res.status(201).json({ message: 'Medical assessment documented in electronic health record.', id });
});

apiRouter.get('/prescriptions', authenticateJWT, (req: AuthenticatedRequest, res) => {
  let sql = `
    SELECT pr.*, p.name as patient_name, p.op_number, doc.name as doctor_name
    FROM prescriptions pr
    JOIN patients p ON pr.patient_id = p.id
    JOIN doctors doc ON pr.doctor_id = doc.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (req.user?.role === 'PATIENT') {
    sql += ` AND p.user_id = ?`;
    params.push(req.user.id);
  } else if (req.query.patient_id) {
    sql += ` AND pr.patient_id = ?`;
    params.push(req.query.patient_id);
  }

  sql += ` ORDER BY pr.prescribed_at DESC`;
  const prescriptions = db.prepare(sql).all(...(params as any[]));
  return res.json({ prescriptions });
});

apiRouter.post('/prescriptions', authenticateJWT, requireRoles('DOCTOR', 'ADMIN'), (req: AuthenticatedRequest, res) => {
  const { patient_id, medicines, dosage_instructions, duration_days } = req.body;
  const doctorId = req.user?.doctor_id || 1;

  if (!patient_id || !medicines) {
    return res.status(400).json({ error: 'Patient ID and medicine details are required.' });
  }

  const id = db.prepare(`
    INSERT INTO prescriptions (patient_id, doctor_id, medicines_json, dosage_instructions, duration_days, status)
    VALUES (?, ?, ?, ?, ?, 'ACTIVE')
  `).run(patient_id, doctorId, JSON.stringify(medicines), dosage_instructions || '', duration_days || 7).lastInsertRowid;

  return res.status(201).json({ message: 'Electronic prescription issued.', id });
});

apiRouter.get('/reports', authenticateJWT, (req: AuthenticatedRequest, res) => {
  let sql = `
    SELECT mr.*, p.name as patient_name, p.op_number, doc.name as doctor_name
    FROM medical_reports mr
    JOIN patients p ON mr.patient_id = p.id
    JOIN doctors doc ON mr.doctor_id = doc.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (req.user?.role === 'PATIENT') {
    sql += ` AND p.user_id = ?`;
    params.push(req.user.id);
  } else if (req.query.patient_id) {
    sql += ` AND mr.patient_id = ?`;
    params.push(req.query.patient_id);
  }

  sql += ` ORDER BY mr.report_date DESC`;
  const reports = db.prepare(sql).all(...(params as any[]));
  return res.json({ reports });
});

// ==========================================
// 10. ML PREDICTIONS & ANALYTICS
// ==========================================

apiRouter.get('/predictions/resource-forecast', authenticateJWT, (req, res) => {
  const forecast = generateResourceForecast(7);
  return res.json(forecast);
});

apiRouter.post('/predictions/retrain', authenticateJWT, requireRoles('ADMIN'), (req, res) => {
  trainHospitalPredictionModels();
  const updatedForecast = generateResourceForecast(7);
  return res.json({
    message: 'Machine learning models retrained successfully against updated dataset.',
    metrics: updatedForecast.metrics,
    forecast: updatedForecast
  });
});

apiRouter.get('/analytics/charts', authenticateJWT, (req, res) => {
  // 1. Bed occupancy distribution by department
  const deptOccupancy = db.prepare(`
    SELECT d.name,
      COUNT(b.id) as total_beds,
      SUM(CASE WHEN b.status = 'OCCUPIED' THEN 1 ELSE 0 END) as occupied_beds,
      SUM(CASE WHEN b.status = 'AVAILABLE' THEN 1 ELSE 0 END) as available_beds
    FROM departments d
    LEFT JOIN beds b ON b.department_id = d.id
    GROUP BY d.id
  `).all();

  // 2. Emergency severity breakdown
  const emergencySeverity = db.prepare(`
    SELECT severity, COUNT(*) as count
    FROM emergency_cases
    GROUP BY severity
  `).all();

  // 3. 7-day Historical Admissions vs Discharges
  const historicalFlow = db.prepare(`
    SELECT record_date, admissions_count, discharges_count, emergency_cases_count, icu_occupied_count
    FROM ml_training_data
    ORDER BY record_date DESC
    LIMIT 7
  `).all().reverse();

  return res.json({
    deptOccupancy,
    emergencySeverity,
    historicalFlow
  });
});

// ==========================================
// 11. FACILITIES, NOTIFICATIONS & AUDIT LOGS
// ==========================================

apiRouter.get('/facilities', (req, res) => {
  const facilities = db.prepare(`SELECT * FROM facilities ORDER BY id ASC`).all();
  return res.json({ facilities });
});

apiRouter.get('/notifications', authenticateJWT, (req: AuthenticatedRequest, res) => {
  const role = req.user?.role || 'ADMIN';
  const userId = req.user?.id;

  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ? OR target_role = ? OR target_role IS NULL
    ORDER BY created_at DESC LIMIT 30
  `).all(userId || null, role);

  return res.json({ notifications });
});

apiRouter.put('/notifications/:id/read', authenticateJWT, (req, res) => {
  const id = Number(req.params.id);
  db.prepare(`UPDATE notifications SET is_read = 1 WHERE id = ?`).run(id);
  return res.json({ message: 'Marked as read' });
});

apiRouter.get('/audit-logs', authenticateJWT, requireRoles('ADMIN'), (req, res) => {
  const { module, limit } = req.query;
  let sql = `SELECT * FROM audit_logs WHERE 1=1`;
  const params: unknown[] = [];

  if (module) {
    sql += ` AND module = ?`;
    params.push(module);
  }

  sql += ` ORDER BY id DESC LIMIT ?`;
  params.push(Number(limit) || 100);

  const logs = db.prepare(sql).all(...(params as any[]));
  return res.json({ logs });
});

apiRouter.get('/departments', authenticateJWT, (req, res) => {
  const departments = db.prepare(`SELECT * FROM departments ORDER BY id ASC`).all();
  return res.json({ departments });
});

// ==========================================
// 12. DETAILED SINGLE RESOURCE ENDPOINTS
// ==========================================

apiRouter.get('/beds/:id', authenticateJWT, (req, res) => {
  const id = Number(req.params.id);
  const bed = db.prepare(`
    SELECT b.*, d.name as department_name, p.name as current_patient_name, p.op_number as patient_op_number, p.severity as patient_severity
    FROM beds b
    JOIN departments d ON b.department_id = d.id
    LEFT JOIN patients p ON b.current_patient_id = p.id
    WHERE b.id = ?
  `).get(id);
  if (!bed) return res.status(404).json({ error: 'Bed not found' });
  return res.json({ bed });
});

apiRouter.get('/doctors/:id', authenticateJWT, (req, res) => {
  const id = Number(req.params.id);
  const doctor = db.prepare(`
    SELECT d.*, dept.name as department_name
    FROM doctors d
    JOIN departments dept ON d.department_id = dept.id
    WHERE d.id = ?
  `).get(id);
  if (!doctor) return res.status(404).json({ error: 'Doctor not found' });
  return res.json({ doctor });
});

apiRouter.get('/nurses/:id', authenticateJWT, (req, res) => {
  const id = Number(req.params.id);
  const nurse = db.prepare(`
    SELECT n.*, dept.name as department_name
    FROM nurses n
    JOIN departments dept ON n.department_id = dept.id
    WHERE n.id = ?
  `).get(id);
  if (!nurse) return res.status(404).json({ error: 'Nurse not found' });
  return res.json({ nurse });
});

apiRouter.get('/equipment/:id', authenticateJWT, (req, res) => {
  const id = Number(req.params.id);
  const equipment = db.prepare(`
    SELECT eq.*, dept.name as department_name, p.name as assigned_patient_name
    FROM equipment eq
    JOIN departments dept ON eq.department_id = dept.id
    LEFT JOIN patients p ON eq.assigned_patient_id = p.id
    WHERE eq.id = ?
  `).get(id);
  if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
  return res.json({ equipment });
});

apiRouter.get('/inventory/:id', authenticateJWT, (req, res) => {
  const id = Number(req.params.id);
  const item = db.prepare(`SELECT * FROM inventory WHERE id = ?`).get(id);
  if (!item) return res.status(404).json({ error: 'Inventory item not found' });
  return res.json({ item });
});

apiRouter.get('/emergency/:id', authenticateJWT, (req, res) => {
  const id = Number(req.params.id);
  const emergencyCase = db.prepare(`
    SELECT e.*, d.name as assigned_doctor_name, n.name as assigned_nurse_name
    FROM emergency_cases e
    LEFT JOIN doctors d ON e.assigned_doctor_id = d.id
    LEFT JOIN nurses n ON e.assigned_nurse_id = n.id
    WHERE e.id = ?
  `).get(id);
  if (!emergencyCase) return res.status(404).json({ error: 'Emergency case not found' });
  return res.json({ emergency: emergencyCase });
});

apiRouter.get('/facilities/:id', (req, res) => {
  const id = Number(req.params.id);
  const facility = db.prepare(`SELECT * FROM facilities WHERE id = ?`).get(id);
  if (!facility) return res.status(404).json({ error: 'Facility not found' });
  return res.json({ facility });
});

// ==========================================
// 13. GEMINI CLINICAL ASSISTANT & AUDIO
// ==========================================

apiRouter.post('/ai/chat', authenticateJWT, async (req: AuthenticatedRequest, res) => {
  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: 'Message is required.' });

  try {
    const reply = await clinicalChat(history || [], message, req.user?.role || 'STAFF');
    return res.json({ reply });
  } catch (err: unknown) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

apiRouter.post('/ai/transcribe', authenticateJWT, async (req, res) => {
  const { audioBase64, mimeType } = req.body;
  if (!audioBase64) return res.status(400).json({ error: 'Audio payload is required.' });

  try {
    const text = await transcribeAudio(audioBase64, mimeType || 'audio/webm');
    return res.json({ text });
  } catch (err: unknown) {
    return res.status(500).json({ error: (err as Error).message });
  }
});

// ==========================================
// 14. DATABASE & SCHEMA MANAGEMENT
// ==========================================

apiRouter.get('/database/status', async (req, res) => {
  try {
    const status = await getDatabaseStatus();
    return res.json(status);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/database/test-connection', async (req, res) => {
  try {
    const customConfig = req.body;
    const testResult = await testMysqlConnection(customConfig);
    return res.json(testResult);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/database/tables', (req, res) => {
  try {
    const tables = getAllTablesDetails();
    return res.json({ tables });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/database/tables/:tableName', (req, res) => {
  try {
    const { tableName } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 25));
    const search = String(req.query.search || '');

    const result = getTableRows(tableName, page, limit, search);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/database/execute', (req, res) => {
  try {
    const { query } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required.' });
    }

    const result = executeCustomSql(query);
    return res.json(result);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

apiRouter.post('/database/reinitialize', (req, res) => {
  try {
    const result = reinitializeDatabase();
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/database/scripts', (req, res) => {
  try {
    const scripts = getSchemaScripts();
    return res.json(scripts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/database/apply-local-schema', async (req, res) => {
  try {
    const customConfig = req.body;
    const result = await applyLocalSchemaToMysql(customConfig);
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message, code: err.code });
  }
});


