import React, { useState } from 'react';
import { EmergencyCase, Doctor, Nurse, Bed } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Siren,
  Clock,
  UserCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  BedDouble
} from 'lucide-react';

interface EmergencyTriageViewProps {
  queue: EmergencyCase[];
  doctors: Doctor[];
  nurses: Nurse[];
  beds: Bed[];
  onRefresh: () => void;
  onOpenEmergencyModal: () => void;
}

export const EmergencyTriageView: React.FC<EmergencyTriageViewProps> = ({
  queue,
  doctors,
  nurses,
  beds,
  onRefresh,
  onOpenEmergencyModal
}) => {
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [assignedDoctorId, setAssignedDoctorId] = useState<number | ''>('');
  const [assignedNurseId, setAssignedNurseId] = useState<number | ''>('');
  const [selectedBedId, setSelectedBedId] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBeds = beds.filter(b => b.status === 'AVAILABLE');

  const handleTriageDispatch = async (caseId: number) => {
    setIsSubmitting(true);
    try {
      await api.triageEmergencyCase(caseId, {
        assigned_doctor_id: assignedDoctorId ? Number(assignedDoctorId) : undefined,
        assigned_nurse_id: assignedNurseId ? Number(assignedNurseId) : undefined,
        bed_id: selectedBedId ? Number(selectedBedId) : undefined,
        notes: 'Dispatched via Priority Queue Triage Console'
      });
      setSelectedCaseId(null);
      setAssignedDoctorId('');
      setAssignedNurseId('');
      setSelectedBedId('');
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async (caseId: number) => {
    try {
      await api.resolveEmergencyCase(caseId);
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Siren className="w-5 h-5 text-rose-600" />
            <span>Emergency Department Live Priority Queue</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time algorithmic prioritization sorting by Emergency Severity Index (ESI) and wait-time aging factor.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
            title="Refresh Priority Queue"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={onOpenEmergencyModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Siren className="w-4 h-4" />
            <span>+ Dispatch Inbound Emergency</span>
          </button>
        </div>
      </div>

      {/* Priority Queue Explanation Banner */}
      <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 font-mono">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
          <span>Priority Function: P = ESI_Base + (Wait_Time_Minutes * 1.5) + ICU_Bonus</span>
        </div>
        <div className="text-slate-400 text-[11px]">
          Aging factor guarantees no clinical starvation of moderate acuity cases.
        </div>
      </div>

      {/* Priority Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Ranked Queue ({queue.length} Active Patients)</span>
          <span className="text-[11px] font-mono text-slate-500">Sorted descending by Priority Score</span>
        </div>

        <div className="divide-y divide-slate-100">
          {queue.map((item, index) => {
            const isSelected = selectedCaseId === item.id;
            const isLevel1 = item.severity === 'CRITICAL_1';
            const isLevel2 = item.severity === 'EMERGENT_2';

            return (
              <div
                key={item.id}
                className={`p-5 transition-colors ${
                  isLevel1 ? 'bg-rose-50/20' : isLevel2 ? 'bg-amber-50/20' : 'bg-white'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  {/* Rank & Case Bio */}
                  <div className="flex items-start gap-4">
                    <div className="flex flex-col items-center justify-center w-10 h-10 rounded-xl bg-slate-900 text-white font-mono font-bold text-sm shadow-xs shrink-0">
                      <span>#{index + 1}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">{item.patient_name}</span>
                        <span className="text-xs font-mono text-slate-400">{item.case_number}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isLevel1
                            ? 'bg-rose-100 text-rose-800'
                            : isLevel2
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          ESI {item.triage_score} · {item.severity.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 font-medium">
                        {item.emergency_type}
                      </div>

                      {item.triage_notes && (
                        <p className="text-[11px] text-slate-500 italic max-w-xl">
                          "{item.triage_notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Priority Telemetry & Actions */}
                  <div className="flex items-center gap-6 self-end md:self-center">
                    <div className="text-right font-mono text-xs">
                      <div className="font-bold text-slate-900 text-sm">
                        Score: {item.calculated_priority || 750}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Wait: {item.wait_time_minutes || 4}m</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.status !== 'IN_TREATMENT' ? (
                        <button
                          onClick={() => setSelectedCaseId(isSelected ? null : item.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs"
                        >
                          {isSelected ? 'Close Dispatch' : 'Triage Dispatch'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleResolve(item.id)}
                          className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Stabilized</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inline Dispatch Drawer */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Assign Attending Physician:
                      </label>
                      <select
                        value={assignedDoctorId}
                        onChange={e => setAssignedDoctorId(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">-- Select Doctor --</option>
                        {doctors.map(d => (
                          <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Assign Triage Nurse:
                      </label>
                      <select
                        value={assignedNurseId}
                        onChange={e => setAssignedNurseId(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">-- Select Nurse --</option>
                        {nurses.map(n => (
                          <option key={n.id} value={n.id}>{n.name} ({n.skill_level})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Assign Trauma/ICU Bed:
                      </label>
                      <select
                        value={selectedBedId}
                        onChange={e => setSelectedBedId(Number(e.target.value))}
                        className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      >
                        <option value="">-- Select Bed --</option>
                        {availableBeds.map(b => (
                          <option key={b.id} value={b.id}>{b.bed_number} ({b.ward} · {b.bed_type})</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        disabled={isSubmitting}
                        onClick={() => handleTriageDispatch(item.id)}
                        className="w-full py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                      >
                        {isSubmitting ? 'Dispatching...' : 'Confirm Dispatch to Treatment'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {queue.length === 0 && (
            <div className="p-12 text-center text-xs text-slate-400">
              Emergency queue is clear. No active triage cases pending.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
