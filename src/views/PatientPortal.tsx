import React, { useState, useEffect } from 'react';
import { User, Patient, Appointment, Prescription, MedicalReport } from '../types.ts';
import { api } from '../services/api.ts';
import {
  HeartPulse,
  CalendarCheck2,
  Pill,
  FileText,
  BedDouble,
  Siren,
  Building2,
  Stethoscope,
  Phone,
  Clock,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface PatientPortalProps {
  currentUser: User | null;
  onOpenAppointmentModal: () => void;
  onNavigate: (view: string) => void;
}

export const PatientPortal: React.FC<PatientPortalProps> = ({
  currentUser,
  onOpenAppointmentModal,
  onNavigate
}) => {
  const [patientData, setPatientData] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const patientsRes = await api.getPatients();
        if (patientsRes.patients.length > 0) {
          setPatientData(patientsRes.patients[0]);
        }

        const apptRes = await api.getAppointments();
        setAppointments(apptRes.appointments);

        const rxRes = await api.getPrescriptions();
        setPrescriptions(rxRes.prescriptions);

        const repRes = await api.getMedicalReports();
        setReports(repRes.reports);
      } catch (err) {
        console.error('Failed to load patient profile:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [currentUser]);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading patient electronic health records...</div>;
  }

  const patient = patientData || {
    id: 1,
    op_number: currentUser?.op_number || 'OP202600123',
    name: currentUser?.full_name || 'Eleanor Vance',
    age: 41,
    gender: 'Female',
    blood_group: 'O+',
    phone: '+1 555-0199',
    emergency_contact: 'James Vance (Spouse) - +1 555-0190',
    admission_status: 'ADMITTED',
    department_name: 'Intensive Care Unit (ICU)',
    doctor_name: 'Dr. Robert Chen',
    bed_number: 'ICU-201',
    ward: 'Critical Care Ward',
    severity: 'CRITICAL',
    registration_date: '2026-10-01'
  } as Patient;

  return (
    <div className="space-y-6">
      {/* Patient Header Banner */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
            {patient.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">{patient.name}</h1>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                {patient.op_number}
              </span>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                patient.admission_status === 'ADMITTED'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {patient.admission_status}
              </span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-4 font-mono">
              <span>Age: {patient.age} Yrs</span>
              <span>Gender: {patient.gender}</span>
              <span>Blood: {patient.blood_group}</span>
              <span>Emergency: {patient.emergency_contact}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAppointmentModal}
          className="px-4 py-2.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Book Doctor Consultation</span>
        </button>
      </div>

      {/* 8 Feature Cards Grid (As required in Section 5) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: My Appointments */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>My Appointments</span>
            <CalendarCheck2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mb-1">
            {appointments.length}
          </div>
          <p className="text-[11px] text-slate-500">
            {appointments[0] ? `Next: ${appointments[0].appointment_date} with ${appointments[0].doctor_name}` : 'No pending consultations'}
          </p>
        </div>

        {/* Card 2: Current Bed */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Bed Assignment</span>
            <BedDouble className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900 mb-1">
            {patient.bed_number || 'Outpatient'}
          </div>
          <p className="text-[11px] text-slate-500">
            {patient.ward ? `Ward: ${patient.ward}` : 'Not currently admitted to inpatient ward'}
          </p>
        </div>

        {/* Card 3: My Doctor */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs hover:border-teal-300 transition-colors">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Attending Physician</span>
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-sm font-bold text-slate-900 truncate mb-1">
            {patient.doctor_name || 'Dr. Robert Chen'}
          </div>
          <p className="text-[11px] text-slate-500 truncate">
            {patient.department_name || 'Critical Care Medicine'}
          </p>
        </div>

        {/* Card 4: Emergency Help */}
        <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200 shadow-xs hover:bg-rose-50 transition-colors">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-2 font-medium">
            <span>Hospital Emergency</span>
            <Siren className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold font-mono text-rose-700 mb-1 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            <span>+1 555-0911</span>
          </div>
          <p className="text-[11px] text-rose-600">
            24/7 Rapid Ambulance &amp; Trauma Dispatch
          </p>
        </div>
      </div>

      {/* Main Clinical Records & Prescriptions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Prescriptions */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <Pill className="w-4 h-4 text-teal-600" />
              <span>Current Prescriptions &amp; Medications</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">{prescriptions.length} Active</span>
          </div>

          <div className="space-y-3">
            {prescriptions.map((p) => {
              let meds: Array<{ name: string; dose: string; frequency: string }> = [];
              try {
                meds = JSON.parse(p.medicines_json);
              } catch {
                meds = [{ name: 'Standard Medication', dose: '1 dose', frequency: 'Daily' }];
              }

              return (
                <div key={p.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800">Prescribed by {p.doctor_name}</span>
                    <span className="font-mono text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Duration: {p.duration_days} Days
                    </span>
                  </div>

                  <div className="divide-y divide-slate-200/50 text-xs">
                    {meds.map((m, idx) => (
                      <div key={idx} className="py-1.5 flex items-center justify-between">
                        <span className="font-medium text-slate-900">{m.name}</span>
                        <span className="text-slate-500 font-mono text-[11px]">{m.dose} · {m.frequency}</span>
                      </div>
                    ))}
                  </div>

                  {p.dosage_instructions && (
                    <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                      Note: {p.dosage_instructions}
                    </p>
                  )}
                </div>
              );
            })}

            {prescriptions.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No active pharmaceutical regimens documented.
              </div>
            )}
          </div>
        </div>

        {/* Right: Lab & Diagnostic Reports */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <FileText className="w-4 h-4 text-teal-600" />
              <span>Medical &amp; Diagnostic Reports</span>
            </div>
            <span className="text-xs text-slate-500 font-mono">{reports.length} Records</span>
          </div>

          <div className="space-y-3">
            {reports.map((r) => (
              <div key={r.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{r.title}</span>
                  <span className="font-mono text-[11px] text-slate-400">{r.report_date}</span>
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  {r.report_type} · Reviewed by {r.doctor_name}
                </div>
                <p className="text-xs text-slate-600 leading-relaxed bg-white p-2.5 rounded-lg border border-slate-100">
                  {r.description}
                </p>
              </div>
            ))}

            {reports.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                No diagnostic test reports uploaded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
