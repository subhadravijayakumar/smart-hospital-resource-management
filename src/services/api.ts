import {
  User,
  DashboardStats,
  Patient,
  Bed,
  Doctor,
  Nurse,
  Appointment,
  EmergencyCase,
  NurseShift,
  LeaveRequest,
  Equipment,
  InventoryItem,
  MedicalRecord,
  Prescription,
  MedicalReport,
  Facility,
  AuditLog,
  NotificationItem,
  PredictionReport,
  Department,
  DatabaseStatus,
  TableSummary,
  TableRowsResponse,
  SqlExecutionResult,
  SchemaScripts
} from '../types.ts';

const API_BASE = '/api';

export function getStoredToken(): string | null {
  return localStorage.getItem('hospital_jwt_token');
}

export function setStoredToken(token: string | null) {
  if (token) localStorage.setItem('hospital_jwt_token', token);
  else localStorage.removeItem('hospital_jwt_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  if (!res.ok) {
    let errorMsg = `Server error ${res.status}`;
    try {
      const data = await res.json();
      if (data.error) errorMsg = data.error;
      else if (data.message) errorMsg = data.message;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  login: (identifier: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    }),

  getCurrentUser: () =>
    request<{ user: User }>('/auth/me'),

  quickSwitchRole: (targetRole: string) =>
    request<{ token: string; user: User }>('/auth/quick-switch', {
      method: 'POST',
      body: JSON.stringify({ targetRole })
    }),

  // Dashboard & Metrics
  getDashboardStats: () =>
    request<DashboardStats>('/dashboard/stats'),

  getAnalyticsCharts: () =>
    request<{
      deptOccupancy: Array<{ name: string; total_beds: number; occupied_beds: number; available_beds: number }>;
      emergencySeverity: Array<{ severity: string; count: number }>;
      historicalFlow: Array<{ record_date: string; admissions_count: number; discharges_count: number; emergency_cases_count: number; icu_occupied_count: number }>;
    }>('/analytics/charts'),

  // Patients
  getPatients: (params?: { search?: string; department_id?: number; admission_status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.department_id) q.append('department_id', String(params.department_id));
    if (params?.admission_status) q.append('admission_status', params.admission_status);
    return request<{ patients: Patient[] }>(`/patients?${q.toString()}`);
  },

  getPatientById: (id: number) =>
    request<{ patient: Patient }>(`/patients/${id}`),

  registerPatient: (data: Partial<Patient>) =>
    request<{ message: string; patient: { id: number; op_number: string; name: string } }>('/patients', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  dischargePatient: (id: number) =>
    request<{ message: string }>(`/patients/${id}/discharge`, {
      method: 'POST'
    }),

  // Beds & Greedy Allocation
  getBeds: (params?: { status?: string; bed_type?: string; department_id?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.bed_type) q.append('bed_type', params.bed_type);
    if (params?.department_id) q.append('department_id', String(params.department_id));
    return request<{ beds: Bed[] }>(`/beds?${q.toString()}`);
  },

  addBed: (data: Partial<Bed>) =>
    request<{ message: string; id: number }>('/beds', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateBedStatus: (id: number, status: string) =>
    request<{ message: string }>(`/beds/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  allocateBedGreedy: (payload: {
    patient_id: number;
    severity?: string;
    requires_ventilator?: boolean;
    requires_oxygen?: boolean;
    preferred_bed_type?: string;
    assigned_department_id?: number;
  }) =>
    request<{
      success: boolean;
      message: string;
      allocated_bed: Bed;
      score: number;
      decision_rationale: string;
      alternative_candidates_evaluated: number;
    }>('/beds/allocate', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  // Emergency & Priority Queue
  getEmergencyQueue: () =>
    request<{ queue: EmergencyCase[]; count: number }>('/emergency/queue'),

  registerEmergency: (data: {
    patient_name: string;
    emergency_type: string;
    severity: string;
    required_bed_type?: string;
    triage_notes?: string;
  }) =>
    request<{ message: string; case_number: string; id: number }>('/emergency', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  triageEmergencyCase: (id: number, data: { assigned_doctor_id?: number; assigned_nurse_id?: number; bed_id?: number; notes?: string }) =>
    request<{ message: string }>(`/emergency/${id}/triage`, {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  resolveEmergencyCase: (id: number) =>
    request<{ message: string }>(`/emergency/${id}/resolve`, {
      method: 'PUT'
    }),

  // Doctors & Appointments
  getDoctors: (deptId?: number) =>
    request<{ doctors: Doctor[] }>(`/doctors${deptId ? `?department_id=${deptId}` : ''}`),

  getAppointments: () =>
    request<{ appointments: Appointment[] }>('/appointments'),

  bookAppointment: (data: {
    patient_id?: number;
    doctor_id: number;
    department_id?: number;
    appointment_date: string;
    time_slot: string;
    reason: string;
  }) =>
    request<{ message: string; id: number }>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateAppointmentStatus: (id: number, status: string) =>
    request<{ message: string }>(`/appointments/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  // Nurses, Shifts & Leaves
  getNurses: () =>
    request<{ nurses: Nurse[] }>('/nurses'),

  getShifts: () =>
    request<{ shifts: NurseShift[] }>('/shifts'),

  optimizeShifts: (targetDate?: string) =>
    request<{
      success: boolean;
      shift_date: string;
      assignments_created: number;
      roster: Array<{
        shift_type: 'MORNING' | 'AFTERNOON' | 'NIGHT';
        department_name: string;
        nurse_name: string;
        skill_level: string;
        predicted_workload_score: number;
        optimization_reason: string;
      }>;
      unassigned_shortfalls: string[];
    }>('/shifts/optimize', {
      method: 'POST',
      body: JSON.stringify({ target_date: targetDate })
    }),

  getLeaves: () =>
    request<{ leaves: LeaveRequest[] }>('/leaves'),

  applyLeave: (data: { start_date: string; end_date: string; reason: string }) =>
    request<{ message: string; id: number }>('/leaves', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  approveLeave: (id: number, remarks?: string) =>
    request<{ message: string }>(`/leaves/${id}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ remarks })
    }),

  rejectLeave: (id: number, remarks?: string) =>
    request<{ message: string }>(`/leaves/${id}/reject`, {
      method: 'PUT',
      body: JSON.stringify({ remarks })
    }),

  // Equipment & Inventory
  getEquipment: () =>
    request<{ equipment: Equipment[] }>('/equipment'),

  updateEquipmentStatus: (id: number, status: string) =>
    request<{ message: string }>(`/equipment/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  getInventory: () =>
    request<{ inventory: InventoryItem[] }>('/inventory'),

  restockInventory: (itemId: number, quantity: number, notes?: string) =>
    request<{ message: string }>('/inventory/restock', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity, notes })
    }),

  consumeInventory: (itemId: number, quantity: number, notes?: string) =>
    request<{ message: string }>('/inventory/consume', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, quantity, notes })
    }),

  // Medical Records, Prescriptions, Reports
  getMedicalRecords: (patientId?: number) =>
    request<{ records: MedicalRecord[] }>(`/medical-records${patientId ? `?patient_id=${patientId}` : ''}`),

  createMedicalRecord: (data: {
    patient_id: number;
    record_type?: string;
    diagnosis: string;
    clinical_notes?: string;
    vitals?: Record<string, string | number>;
  }) =>
    request<{ message: string; id: number }>('/medical-records', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getPrescriptions: (patientId?: number) =>
    request<{ prescriptions: Prescription[] }>(`/prescriptions${patientId ? `?patient_id=${patientId}` : ''}`),

  createPrescription: (data: {
    patient_id: number;
    medicines: Array<{ name: string; dose: string; frequency: string }>;
    dosage_instructions: string;
    duration_days: number;
  }) =>
    request<{ message: string; id: number }>('/prescriptions', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMedicalReports: (patientId?: number) =>
    request<{ reports: MedicalReport[] }>(`/reports${patientId ? `?patient_id=${patientId}` : ''}`),

  // ML Predictions
  getForecast: () =>
    request<PredictionReport>('/predictions/resource-forecast'),

  retrainMLModels: () =>
    request<{ message: string; metrics: PredictionReport['metrics']; forecast: PredictionReport }>('/predictions/retrain', {
      method: 'POST'
    }),

  // Facilities, Audit, Notifications
  getFacilities: () =>
    request<{ facilities: Facility[] }>('/facilities'),

  getAuditLogs: (module?: string) =>
    request<{ logs: AuditLog[] }>(`/audit-logs${module ? `?module=${module}` : ''}`),

  getNotifications: () =>
    request<{ notifications: NotificationItem[] }>('/notifications'),

  markNotificationRead: (id: number) =>
    request<{ message: string }>(`/notifications/${id}/read`, {
      method: 'PUT'
    }),

  getDepartments: () =>
    request<{ departments: Department[] }>('/departments'),

  getBedById: (id: number) =>
    request<{ bed: Bed }>(`/beds/${id}`),

  getDoctorById: (id: number) =>
    request<{ doctor: Doctor }>(`/doctors/${id}`),

  getNurseById: (id: number) =>
    request<{ nurse: Nurse }>(`/nurses/${id}`),

  getEquipmentById: (id: number) =>
    request<{ equipment: Equipment }>(`/equipment/${id}`),

  getInventoryById: (id: number) =>
    request<{ item: InventoryItem }>(`/inventory/${id}`),

  getEmergencyById: (id: number) =>
    request<{ emergency: EmergencyCase }>(`/emergency/${id}`),

  getFacilityById: (id: number) =>
    request<{ facility: Facility }>(`/facilities/${id}`),

  // Gemini Clinical AI & Audio Transcription
  sendAiChat: (message: string, history: Array<{ role: 'user' | 'model'; text: string }>) =>
    request<{ reply: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history })
    }),

  transcribeAudio: (audioBase64: string, mimeType: string = 'audio/webm') =>
    request<{ text: string }>('/ai/transcribe', {
      method: 'POST',
      body: JSON.stringify({ audioBase64, mimeType })
    }),

  // Database & Schema Explorer
  getDatabaseStatus: () =>
    request<DatabaseStatus>('/database/status'),

  testDatabaseConnection: (customConfig?: any) =>
    request<{
      success: boolean;
      latencyMs?: number;
      message: string;
      suggestion?: string;
      errorCode?: string;
      tableCount?: number;
      config?: any;
    }>('/database/test-connection', {
      method: 'POST',
      body: JSON.stringify(customConfig || {})
    }),

  getDatabaseTables: () =>
    request<{ tables: TableSummary[] }>('/database/tables'),

  getTableRows: (tableName: string, page = 1, limit = 25, search = '') =>
    request<TableRowsResponse>(`/database/tables/${tableName}?page=${page}&limit=${limit}&search=${encodeURIComponent(search)}`),

  executeSql: (query: string) =>
    request<SqlExecutionResult>('/database/execute', {
      method: 'POST',
      body: JSON.stringify({ query })
    }),

  reinitializeDatabase: () =>
    request<{ success: boolean; message: string }>('/database/reinitialize', {
      method: 'POST'
    }),

  getDatabaseScripts: () =>
    request<SchemaScripts>('/database/scripts'),

  applyLocalSchema: (customConfig?: any) =>
    request<{ success: boolean; message: string; tableCount?: number; tables?: string[] }>('/database/apply-local-schema', {
      method: 'POST',
      body: JSON.stringify(customConfig || {})
    })
};

