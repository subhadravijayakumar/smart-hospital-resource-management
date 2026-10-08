import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { X, Clock, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react';

interface ShiftOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ShiftOptimizerModal: React.FC<ShiftOptimizerModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    shift_date: string;
    assignments_created: number;
    roster: Array<{
      shift_type: string;
      department_name: string;
      nurse_name: string;
      skill_level: string;
      predicted_workload_score: number;
      optimization_reason: string;
    }>;
    unassigned_shortfalls: string[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRunOptimizer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.optimizeShifts(targetDate);
      setResult(res);
      onSuccess();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Intelligent Nurse Shift Optimization</h3>
              <p className="text-xs text-slate-500">ML Workload Model + Hard Constraints Solver (Leaves, Hours, Acuity)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleRunOptimizer} className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Optimization Date:
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={e => setTargetDate(e.target.value)}
                className="w-full text-xs px-3 py-1.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              />
            </div>
            <div className="pt-5">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50 shrink-0"
              >
                <Sparkles className="w-4 h-4" />
                {isSubmitting ? 'Solving Constraints...' : 'Run Auto-Allocation'}
              </button>
            </div>
          </form>

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 px-1">
                <span>Optimization Output ({result.assignments_created} Shift Slots Assigned)</span>
                <span className="font-mono text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                  Date: {result.shift_date}
                </span>
              </div>

              {result.unassigned_shortfalls.length > 0 && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Staffing Shortfall Constraints:</span>
                  </div>
                  {result.unassigned_shortfalls.map((s, idx) => (
                    <div key={idx} className="text-[11px] pl-5">• {s}</div>
                  ))}
                </div>
              )}

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {result.roster.map((item, idx) => (
                  <div key={idx} className="p-3 text-xs bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-900">{item.nurse_name}</span>
                      <span className="font-mono text-[11px] text-slate-500">
                        {item.department_name} · {item.shift_type} Shift
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600">
                      <span>Reason: {item.optimization_reason}</span>
                      <span className="font-mono text-teal-700 font-semibold">
                        ML Workload: {item.predicted_workload_score}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
