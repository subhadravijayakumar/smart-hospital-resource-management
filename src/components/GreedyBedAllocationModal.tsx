import React, { useState } from 'react';
import { Patient, Department } from '../types.ts';
import { api } from '../services/api.ts';
import { X, CheckCircle2, AlertCircle, Cpu, ShieldCheck } from 'lucide-react';

interface GreedyBedAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  patients: Patient[];
  departments: Department[];
  onSuccess: () => void;
}

export const GreedyBedAllocationModal: React.FC<GreedyBedAllocationModalProps> = ({
  isOpen,
  onClose,
  patients,
  departments,
  onSuccess
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>('');
  const [severity, setSeverity] = useState<'EMERGENCY' | 'CRITICAL' | 'HIGH' | 'NORMAL'>('CRITICAL');
  const [departmentId, setDepartmentId] = useState<number | ''>('');
  const [requiresVentilator, setRequiresVentilator] = useState(false);
  const [requiresOxygen, setRequiresOxygen] = useState(true);
  const [preferredBedType, setPreferredBedType] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allocationResult, setAllocationResult] = useState<{
    success: boolean;
    message: string;
    score?: number;
    bed_number?: string;
    ward?: string;
    decision_rationale?: string;
    candidates_evaluated?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Filter patients that are not yet admitted
  const eligiblePatients = patients.filter(p => p.admission_status !== 'ADMITTED');

  const handlePatientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pId = Number(e.target.value);
    setSelectedPatientId(pId);
    const p = patients.find(pat => pat.id === pId);
    if (p) {
      setSeverity(p.severity || 'NORMAL');
      if (p.assigned_department_id) setDepartmentId(p.assigned_department_id);
      if (p.severity === 'CRITICAL' || p.severity === 'EMERGENCY') {
        setRequiresVentilator(true);
      }
    }
  };

  const handleRunAllocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('Please select a patient requiring bed allocation.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setAllocationResult(null);

    try {
      const res = await api.allocateBedGreedy({
        patient_id: Number(selectedPatientId),
        severity,
        requires_ventilator: requiresVentilator,
        requires_oxygen: requiresOxygen,
        preferred_bed_type: preferredBedType || undefined,
        assigned_department_id: departmentId ? Number(departmentId) : undefined
      });

      setAllocationResult({
        success: res.success,
        message: res.message,
        score: res.score,
        bed_number: res.allocated_bed?.bed_number,
        ward: res.allocated_bed?.ward,
        decision_rationale: res.decision_rationale,
        candidates_evaluated: res.alternative_candidates_evaluated
      });
      onSuccess();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <Cpu className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Greedy Bed Allocation Engine</h3>
              <p className="text-xs text-slate-500">Heuristic clinical multi-criteria optimization solver</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRunAllocation} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {allocationResult && (
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-2">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
                <span>Bed Allocated: {allocationResult.bed_number} ({allocationResult.ward})</span>
              </div>
              <div className="text-xs text-teal-800 flex items-center gap-4 font-mono">
                <span>Optimization Score: {allocationResult.score?.toFixed(1)}/100</span>
                <span>Candidates Evaluated: {allocationResult.candidates_evaluated}</span>
              </div>
              <p className="text-xs text-teal-900/80 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-teal-100">
                {allocationResult.decision_rationale}
              </p>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Patient for Bed Allocation *
            </label>
            <select
              value={selectedPatientId}
              onChange={handlePatientChange}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Choose patient --</option>
              {eligiblePatients.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.op_number}) · Severity: {p.severity} · Status: {p.admission_status}
                </option>
              ))}
            </select>
            {eligiblePatients.length === 0 && (
              <p className="text-[11px] text-amber-600 mt-1">All registered patients currently have assigned beds.</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Acuity Priority
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="EMERGENCY">EMERGENCY (Highest Priority)</option>
                <option value="CRITICAL">CRITICAL (ICU Priority)</option>
                <option value="HIGH">HIGH (Step-down / Ward)</option>
                <option value="NORMAL">NORMAL (General Recovery)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Department Affinity
              </label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">-- Any Suitable Department --</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Preferred Bed Type (Optional)
              </label>
              <select
                value={preferredBedType}
                onChange={e => setPreferredBedType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">Auto-Optimized by Acuity</option>
                <option value="ICU">ICU Bed</option>
                <option value="EMERGENCY">Emergency Trauma Bay</option>
                <option value="GENERAL">General Ward Bed</option>
                <option value="SEMI_PRIVATE">Semi-Private Room</option>
                <option value="PRIVATE">Private Suite</option>
              </select>
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresVentilator}
                  onChange={e => setRequiresVentilator(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Requires Mechanical Ventilator</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresOxygen}
                  onChange={e => setRequiresOxygen(e.target.checked)}
                  className="rounded text-teal-600 focus:ring-teal-500"
                />
                <span>Requires Continuous Oxygen Support</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !selectedPatientId}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              {isSubmitting ? 'Evaluating Candidates...' : 'Execute Greedy Allocation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
