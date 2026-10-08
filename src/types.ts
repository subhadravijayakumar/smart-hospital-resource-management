export type UserRole = 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PATIENT' | 'RECEPTIONIST';

export interface User {
  id: number;
  username: string;
  role: UserRole;
  full_name: string;
  email?: string;
  phone?: string;
  patient_id?: number;
  doctor_id?: number;
  nurse_id?: number;
  op_number?: string;
}

export interface Patient {
  id: number;
  user_id?: number;
  op_number: string;
  name: string;
  dob?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  blood_group: string;
  phone: string;
  email?: string;
  address?: string;
  emergency_contact: string;
  admission_status: 'OUTPATIENT' | 'ADMITTED' | 'DISCHARGED' | 'IN_TRIAGE';
  assigned_department_id?: number;
  department_name?: string;
  assigned_doctor_id?: number;
  doctor_name?: string;
  current_bed_id?: number;
  bed_number?: string;
  ward?: string;
  severity: 'EMERGENCY' | 'CRITICAL' | 'HIGH' | 'NORMAL';
  triage_notes?: string;
  registration_date: string;
}

export interface Doctor {
  id: number;
  user_id?: number;
  employee_id: string;
  name: string;
  specialization: string;
  department_id: number;
  department_name?: string;
  qualification: string;
  experience_years: number;
  phone: string;
  email: string;
  consultation_fee: number;
  availability_status: 'AVAILABLE' | 'IN_CONSULTATION' | 'ON_LEAVE' | 'OFF_DUTY';
  today_appointments_count?: number;
}

export interface Nurse {
  id: number;
  user_id?: number;
  employee_id: string;
  name: string;
  department_id: number;
  department_name?: string;
  skill_level: 'ICU_CERTIFIED' | 'EMERGENCY_TRAINED' | 'SENIOR_STAFF' | 'GENERAL_WARD';
  qualification: string;
  experience_years: number;
  phone: string;
  email: string;
  current_workload: number;
  shift_preference: string;
  availability_status: 'AVAILABLE' | 'ON_DUTY' | 'ON_LEAVE' | 'OFF_DUTY';
}

export interface Bed {
  id: number;
  bed_number: string;
  ward: string;
  department_id: number;
  department_name?: string;
  bed_type: 'ICU' | 'EMERGENCY' | 'GENERAL' | 'SEMI_PRIVATE' | 'PRIVATE' | 'PEDIATRIC';
  floor_number: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING' | 'MAINTENANCE';
  current_patient_id?: number;
  current_patient_name?: string;
  patient_op_number?: string;
  patient_severity?: string;
  has_ventilator: number | boolean;
  has_oxygen_support: number | boolean;
  last_cleaned_time: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  patient_name?: string;
  op_number?: string;
  doctor_id: number;
  doctor_name?: string;
  specialization?: string;
  department_id: number;
  department_name?: string;
  appointment_date: string;
  time_slot: string;
  reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  created_at: string;
}

export interface EmergencyCase {
  id: number;
  case_number: string;
  patient_id?: number;
  patient_name: string;
  emergency_type: string;
  severity: 'CRITICAL_1' | 'EMERGENT_2' | 'URGENT_3' | 'LESS_URGENT_4' | 'NON_URGENT_5';
  triage_score: number;
  arrival_time: string;
  assigned_doctor_id?: number;
  assigned_doctor_name?: string;
  assigned_nurse_id?: number;
  assigned_nurse_name?: string;
  required_bed_type: string;
  status: 'PENDING' | 'TRIAGED' | 'IN_TREATMENT' | 'RESOLVED';
  triage_notes?: string;
  calculated_priority?: number;
  wait_time_minutes?: number;
}

export interface NurseShift {
  id: number;
  shift_date: string;
  shift_type: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  department_id: number;
  department_name?: string;
  predicted_workload_score: number;
  required_nurses: number;
  assigned_nurse_id: number;
  nurse_name?: string;
  skill_level?: string;
  status: string;
  optimization_reason?: string;
}

export interface LeaveRequest {
  id: number;
  staff_type: 'NURSE' | 'DOCTOR' | 'STAFF';
  staff_id: number;
  staff_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  reviewer_remarks?: string;
  reviewed_by?: string;
  created_at: string;
}

export interface Equipment {
  id: number;
  name: string;
  serial_number: string;
  category: string;
  department_id: number;
  department_name?: string;
  location: string;
  status: 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'DAMAGED' | 'OUT_OF_SERVICE';
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  assigned_patient_name?: string;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  category: string;
  sku_code: string;
  quantity: number;
  minimum_stock: number;
  unit: string;
  unit_price: number;
  supplier: string;
  expiry_date: string;
  batch_number: string;
  storage_location: string;
  is_low_stock?: number | boolean;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  patient_name?: string;
  op_number?: string;
  doctor_id: number;
  doctor_name?: string;
  record_type: string;
  diagnosis: string;
  clinical_notes?: string;
  vitals_json?: string;
  record_date: string;
}

export interface Prescription {
  id: number;
  patient_id: number;
  patient_name?: string;
  op_number?: string;
  doctor_id: number;
  doctor_name?: string;
  medicines_json: string;
  dosage_instructions: string;
  duration_days: number;
  prescribed_at: string;
  status: 'ACTIVE' | 'DISPENSED' | 'COMPLETED';
}

export interface MedicalReport {
  id: number;
  patient_id: number;
  patient_name?: string;
  op_number?: string;
  doctor_id: number;
  doctor_name?: string;
  report_type: string;
  title: string;
  description?: string;
  file_url?: string;
  report_date: string;
}

export interface Facility {
  id: number;
  name: string;
  category: string;
  description: string;
  location: string;
  operating_hours: string;
  contact_number: string;
  status: 'AVAILABLE' | 'BUSY' | 'EMERGENCY_ONLY' | 'TEMPORARILY_CLOSED';
  capacity_metric?: string;
}

export interface AuditLog {
  id: number;
  username: string;
  role: string;
  action: string;
  module: string;
  record_id?: string;
  details?: string;
  created_at: string;
}

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  notification_type: 'EMERGENCY' | 'BED_UPDATE' | 'SHIFT_ASSIGN' | 'APPOINTMENT' | 'INVENTORY_ALERT' | 'GENERAL';
  is_read: boolean | number;
  created_at: string;
}

export interface DashboardStats {
  patients: {
    total: number;
    admitted: number;
    outpatients: number;
  };
  beds: {
    total: number;
    available: number;
    occupied: number;
    cleaning: number;
    maintenance: number;
    occupancy_rate: number;
    icu: {
      total: number;
      available: number;
      occupied: number;
      occupancy_rate: number;
    };
  };
  staff: {
    doctors_available: number;
    nurses_on_duty: number;
    pending_leaves: number;
  };
  operations: {
    pending_emergencies: number;
    low_stock_alerts: number;
    pending_appointments: number;
    equipment_available: number;
    equipment_maintenance: number;
  };
}

export interface PredictionDay {
  date: string;
  day_of_week: string;
  predicted_admissions: number;
  predicted_discharges: number;
  predicted_bed_demand: number;
  predicted_icu_demand: number;
  predicted_nurse_requirement: number;
  predicted_medicine_units: number;
  confidence_lower_95: number;
  confidence_upper_95: number;
}

export interface PredictionReport {
  model_name: string;
  algorithm: string;
  metrics: {
    r2_score: number;
    rmse: number;
    mape: number;
    training_sample_count: number;
    last_trained_timestamp: string;
  };
  seven_day_forecast: PredictionDay[];
  summary: {
    peak_demand_date: string;
    expected_bed_occupancy_rate: number;
    recommended_active_nurses: number;
    icu_surge_risk: 'LOW' | 'MODERATE' | 'HIGH';
    resource_alerts: string[];
  };
}

export interface Department {
  id: number;
  name: string;
  code: string;
  head_doctor_name?: string;
  floor_number: number;
  contact_extension?: string;
  bed_capacity: number;
}

export interface TableColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
  defaultValue: any;
  foreignKey?: {
    table: string;
    toColumn: string;
  };
}

export interface TableSummary {
  name: string;
  rowCount: number;
  columns: TableColumnInfo[];
  description: string;
}

export interface DatabaseStatus {
  activeEngine: {
    name: string;
    mode: string;
    description: string;
    status: string;
    totalTables: number;
    totalRecords: number;
  };
  mysqlCredentials: {
    host: string;
    port: number;
    database: string;
    username: string;
    passwordMasked: string;
    driver: string;
    testResult?: {
      success: boolean;
      latencyMs?: number;
      message: string;
      suggestion?: string;
      errorCode?: string;
      tableCount?: number;
    };
  };
  schemaMetadata: {
    ddlFormat: string;
    foreignKeysEnforced: boolean;
    walMode: boolean;
  };
}

export interface TableRowsResponse {
  tableName: string;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  rows: any[];
}

export interface SqlExecutionResult {
  success: boolean;
  isSelect?: boolean;
  rowCount?: number;
  columns?: string[];
  rows?: any[];
  changes?: number;
  lastInsertRowid?: number;
  executionTimeMs: number;
  message?: string;
  error?: string;
}

export interface SchemaScripts {
  schemaSql: string;
  dataSql: string;
}

