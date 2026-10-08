import React, { useState, useEffect } from 'react';
import { User, Appointment, Patient } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Stethoscope,
  CalendarCheck2,
  Users,
  FilePlus2,
  Pill,
  CheckCircle2,
  Clock,
  RotateCcw
} from 'lucide-react';

interface DoctorPortalProps {
  currentUser: User | null;
  onRefreshAll: () => void;
}

export const DoctorPortal: React.FC<DoctorPortalProps> = ({
  currentUser,
  onRefreshAll
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states for creating diagnosis note
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [diagnosis, setDiagnosis] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [vitals, setVitals] = useState({ bp: '120/80', hr: '75', spo2: '98', temp: '37.0 C' });
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteSuccess, setNoteSuccess] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const apptRes = await api.getAppointments();
      setAppointments(apptRes.appointments);

      const patRes = await api.getPatients();
      setPatients(patRes.patients);
      if (patRes.patients.length > 0) {
        setSelectedPatientId(patRes.patients[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleRecordDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId || !diagnosis) return;

    setSubmittingNote(true);
    setNoteSuccess(null);
    try {
      await api.createMedicalRecord({
        patient_id: Number(selectedPatientId),
        record_type: 'Outpatient Clinical Evaluation',
        diagnosis,
        clinical_notes: clinicalNotes,
        vitals
      });
      setDiagnosis('');
      setClinicalNotes('');
      setNoteSuccess('Electronic clinical evaluation saved into patient health record.');
      onRefreshAll();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleDischargeInpatient = async (patientId: number) => {
    if (!confirm('Authorize inpatient discharge? This releases their assigned bed into the CLEANING state.')) return;
    try {
      await api.dischargePatient(patientId);
      loadData();
      onRefreshAll();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading physician console...</div>;
  }

  const assignedPatients = patients.filter(p => p.admission_status === 'ADMITTED');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-teal-600" />
            <span>Physician Clinical Workspace &amp; Consultation Roster</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as {currentUser?.full_name || 'Dr. Sarah Mitchell'} · Attending Physician Console
          </p>
        </div>

        <button onClick={loadData} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
          <RotateCcw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      {/* Grid: Schedule and Inpatients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Consultations */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CalendarCheck2 className="w-4 h-4 text-teal-600" />
              <span>Today's Clinic Consultations</span>
            </div>
            <span className="text-xs font-mono text-slate-500">{appointments.length} Consults</span>
          </div>

          <div className="space-y-2.5">
            {appointments.map(a => (
              <div key={a.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{a.patient_name}</span>
                  <span className="font-mono text-[11px] text-teal-700 font-bold">{a.time_slot}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  OP: {a.op_number} · Reason: {a.reason}
                </div>
              </div>
            ))}

            {appointments.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No consultations currently scheduled for today.
              </div>
            )}
          </div>
        </div>

        {/* Admitted Inpatients Under Doctor's Care */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-teal-600" />
              <span>Active Inpatients Under Care</span>
            </div>
            <span className="text-xs font-mono text-slate-500">{assignedPatients.length} Admitted</span>
          </div>

          <div className="space-y-2.5">
            {assignedPatients.map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-slate-900">{p.name} ({p.op_number})</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Bed: {p.bed_number || 'ICU-201'} ({p.ward}) · Acuity: {p.severity}
                  </div>
                </div>

                <button
                  onClick={() => handleDischargeInpatient(p.id)}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors"
                >
                  Order Discharge
                </button>
              </div>
            ))}

            {assignedPatients.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No active inpatients assigned.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Record Clinical Diagnosis EHR Form */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
          <FilePlus2 className="w-4 h-4 text-teal-600" />
          <span>Document Clinical Diagnosis &amp; Assessment (EHR)</span>
        </div>

        {noteSuccess && (
          <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
            <span>{noteSuccess}</span>
          </div>
        )}

        <form onSubmit={handleRecordDiagnosis} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Patient:
              </label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(Number(e.target.value))}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white"
              >
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.op_number})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Clinical Diagnosis:
              </label>
              <input
                type="text"
                required
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Coronary Syndrome / Lobar Pneumonia"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs">
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold">Blood Pressure</label>
              <input
                type="text"
                value={vitals.bp}
                onChange={e => setVitals({ ...vitals, bp: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 mt-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold">Heart Rate (bpm)</label>
              <input
                type="text"
                value={vitals.hr}
                onChange={e => setVitals({ ...vitals, hr: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 mt-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold">SpO2 (%)</label>
              <input
                type="text"
                value={vitals.spo2}
                onChange={e => setVitals({ ...vitals, spo2: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 mt-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 uppercase font-semibold">Temp (C)</label>
              <input
                type="text"
                value={vitals.temp}
                onChange={e => setVitals({ ...vitals, temp: e.target.value })}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1 mt-1 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Physician Consultation Notes &amp; Plan:
            </label>
            <textarea
              rows={3}
              value={clinicalNotes}
              onChange={e => setClinicalNotes(e.target.value)}
              placeholder="Treatment plan, pending lab results, and medication recommendations..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submittingNote}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submittingNote ? 'Documenting...' : 'Save Assessment to Patient EHR'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
