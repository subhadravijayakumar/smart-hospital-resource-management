import React, { useState, useEffect } from 'react';
import { NurseShift, LeaveRequest, Nurse } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Users,
  CalendarCheck
} from 'lucide-react';

interface ShiftsManagementViewProps {
  onOpenOptimizerModal: () => void;
}

export const ShiftsManagementView: React.FC<ShiftsManagementViewProps> = ({
  onOpenOptimizerModal
}) => {
  const [shifts, setShifts] = useState<NurseShift[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [nurses, setNurses] = useState<Nurse[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    try {
      setLoading(true);
      const [shiftRes, leaveRes, nurseRes] = await Promise.all([
        api.getShifts(),
        api.getLeaves(),
        api.getNurses()
      ]);
      setShifts(shiftRes.shifts);
      setLeaves(leaveRes.leaves);
      setNurses(nurseRes.nurses);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleApproveLeave = async (id: number) => {
    try {
      await api.approveLeave(id, 'Approved by Administrative Shift Manager');
      loadData();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  const handleRejectLeave = async (id: number) => {
    try {
      await api.rejectLeave(id, 'Minimum clinical ward staffing constraint');
      loadData();
    } catch (err: unknown) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>Nurse Shift Allocation &amp; Leave Administration</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Machine-learning predicted workload models coupled with labor constraint solvers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenOptimizerModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run Shift Optimization Engine</span>
          </button>
        </div>
      </div>

      {/* Pending Leave Requests Section */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Staff Leave Requests (Impacting Shift Availability)</h2>
            <p className="text-xs text-slate-500">Approved leaves are automatically excluded from the optimization solver</p>
          </div>
          <button onClick={loadData} className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50">
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {leaves.map(l => (
            <div key={l.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">{l.staff_name}</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  l.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800'
                    : l.status === 'REJECTED'
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {l.status}
                </span>
              </div>
              <div className="text-xs text-slate-600 font-mono">
                {l.start_date} to {l.end_date}
              </div>
              <p className="text-xs text-slate-600 italic">"{l.reason}"</p>

              {l.status === 'PENDING' && (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleRejectLeave(l.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-white hover:bg-rose-50 border border-slate-200 rounded-md"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproveLeave(l.id)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md"
                  >
                    Approve Leave
                  </button>
                </div>
              )}
            </div>
          ))}

          {leaves.length === 0 && (
            <div className="col-span-full py-8 text-center text-xs text-slate-400">
              No leave requests currently logged in system.
            </div>
          )}
        </div>
      </div>

      {/* Scheduled Shifts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Optimized Shifts Roster ({shifts.length} Slots)</h2>
          <span className="text-xs font-mono text-slate-500">Live Clinical Assignments</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Shift Date &amp; Shift</th>
                <th className="px-4 py-3.5">Department</th>
                <th className="px-4 py-3.5">Assigned Nurse</th>
                <th className="px-4 py-3.5">Clinical Competence</th>
                <th className="px-4 py-3.5">ML Workload Index</th>
                <th className="px-5 py-3.5">Algorithm Optimization Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {shifts.map(s => (
                <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono">
                    <div className="font-bold text-slate-900">{s.shift_date}</div>
                    <div className="text-[11px] text-teal-700 font-bold">{s.shift_type} SHIFT</div>
                  </td>

                  <td className="px-4 py-3.5 font-medium text-slate-900">
                    {s.department_name}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-slate-900">{s.nurse_name}</span>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">
                    {s.skill_level}
                  </td>

                  <td className="px-4 py-3.5 font-mono">
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                      Score: {s.predicted_workload_score}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-slate-600 text-[11px] leading-relaxed max-w-sm">
                    {s.optimization_reason}
                  </td>
                </tr>
              ))}

              {shifts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    No nurse shifts currently generated. Click "Run Shift Optimization Engine" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
