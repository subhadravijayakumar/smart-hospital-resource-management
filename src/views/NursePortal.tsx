import React, { useState, useEffect } from 'react';
import { User, NurseShift, LeaveRequest, Patient } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Clock,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  HeartPulse,
  Send
} from 'lucide-react';

interface NursePortalProps {
  currentUser: User | null;
  onRefreshAll: () => void;
}

export const NursePortal: React.FC<NursePortalProps> = ({
  currentUser,
  onRefreshAll
}) => {
  const [shifts, setShifts] = useState<NurseShift[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [inpatients, setInpatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Leave form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);
  const [leaveSuccess, setLeaveSuccess] = useState<string | null>(null);

  async function loadData() {
    try {
      setLoading(true);
      const shiftRes = await api.getShifts();
      setShifts(shiftRes.shifts);

      const leaveRes = await api.getLeaves();
      setLeaves(leaveRes.leaves);

      const patRes = await api.getPatients();
      setInpatients(patRes.patients.filter(p => p.admission_status === 'ADMITTED'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate || !leaveReason) return;

    setSubmittingLeave(true);
    setLeaveSuccess(null);
    try {
      await api.applyLeave({
        start_date: startDate,
        end_date: endDate,
        reason: leaveReason
      });
      setStartDate('');
      setEndDate('');
      setLeaveReason('');
      setLeaveSuccess('Leave application registered. Awaiting supervisory review.');
      loadData();
      onRefreshAll();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setSubmittingLeave(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading nurse station...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <span>Nurse Station &amp; Shift Management Console</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as {currentUser?.full_name || 'Nurse Charlotte Hayes'} · Clinical Roster &amp; Ward Duty
          </p>
        </div>

        <button onClick={loadData} className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50">
          <RotateCcw className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scheduled Shifts */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Assigned Duty Shifts</span>
            </div>
            <span className="text-xs font-mono text-slate-500">{shifts.length} Slots</span>
          </div>

          <div className="space-y-2.5">
            {shifts.map(s => (
              <div key={s.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{s.department_name}</span>
                  <span className="font-mono text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    {s.shift_type} Shift
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center justify-between">
                  <span>Date: {s.shift_date}</span>
                  <span>Workload Score: {s.predicted_workload_score}</span>
                </div>
                {s.optimization_reason && (
                  <p className="text-[11px] text-slate-600 italic pt-1">
                    "{s.optimization_reason}"
                  </p>
                )}
              </div>
            ))}

            {shifts.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No active duty shifts scheduled.
              </div>
            )}
          </div>
        </div>

        {/* Inpatients on Ward */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <HeartPulse className="w-4 h-4 text-teal-600" />
              <span>Ward Inpatient Vitals Monitoring</span>
            </div>
            <span className="text-xs font-mono text-slate-500">{inpatients.length} Inpatients</span>
          </div>

          <div className="space-y-2.5">
            {inpatients.map(p => (
              <div key={p.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900">{p.name} ({p.op_number})</span>
                  <span className="font-mono text-[11px] font-bold text-slate-700">Bed: {p.bed_number}</span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Ward: {p.ward} · Acuity: {p.severity} · Physician: {p.doctor_name}
                </div>
              </div>
            ))}

            {inpatients.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No inpatients currently in this ward.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Leave Application & History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form: Apply for Leave */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Send className="w-4 h-4 text-teal-600" />
            <span>Apply for Planned Medical / Annual Leave</span>
          </div>

          {leaveSuccess && (
            <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{leaveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleApplyLeave} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date *</label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  min={startDate || new Date().toISOString().split('T')[0]}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</label>
              <textarea
                rows={2}
                required
                value={leaveReason}
                onChange={e => setLeaveReason(e.target.value)}
                placeholder="e.g. CME Seminar, Medical recovery, Personal leave..."
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <button
              type="submit"
              disabled={submittingLeave}
              className="w-full py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
            >
              {submittingLeave ? 'Submitting...' : 'Submit Leave Application'}
            </button>
          </form>
        </div>

        {/* Leave Requests Log */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="font-bold text-sm text-slate-900 flex items-center justify-between pb-3 border-b border-slate-100">
            <span>Leave Requests &amp; Approval Status</span>
            <span className="text-xs text-slate-500 font-mono">{leaves.length} Applications</span>
          </div>

          <div className="space-y-2.5">
            {leaves.map(l => (
              <div key={l.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-900 font-mono">
                    {l.start_date} to {l.end_date}
                  </span>
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
                <p className="text-xs text-slate-600">{l.reason}</p>
                {l.reviewer_remarks && (
                  <p className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-100">
                    Remarks: {l.reviewer_remarks}
                  </p>
                )}
              </div>
            ))}

            {leaves.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No leave applications recorded.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
