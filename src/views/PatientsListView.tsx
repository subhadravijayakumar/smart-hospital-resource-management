import React, { useState } from 'react';
import { Patient } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Users,
  Search,
  UserPlus,
  BedDouble,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface PatientsListViewProps {
  patients: Patient[];
  onRefresh: () => void;
  onOpenRegisterModal: () => void;
  onOpenGreedyAllocation: () => void;
}

export const PatientsListView: React.FC<PatientsListViewProps> = ({
  patients,
  onRefresh,
  onOpenRegisterModal,
  onOpenGreedyAllocation
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dischargingId, setDischargingId] = useState<number | null>(null);

  const filtered = patients.filter(p => {
    if (statusFilter && p.admission_status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.op_number.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        (p.doctor_name && p.doctor_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDischarge = async (patientId: number) => {
    if (!confirm('Are you sure you want to discharge this patient? This will automatically release their assigned bed into the CLEANING state.')) {
      return;
    }

    setDischargingId(patientId);
    try {
      await api.dischargePatient(patientId);
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setDischargingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-teal-600" />
            <span>Master Patient Directory &amp; EHR Index</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Outpatient (OP) registrations, inpatient bed occupancy tracking, and electronic health record dossiers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenRegisterModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register New Patient</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name, OP number, or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs border-none focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          >
            <option value="">All Patient Statuses</option>
            <option value="ADMITTED">ADMITTED</option>
            <option value="OUTPATIENT">OUTPATIENT</option>
            <option value="DISCHARGED">DISCHARGED</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            title="Refresh patient list"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Patient &amp; OP Number</th>
                <th className="px-4 py-3.5">Age / Gender / Blood</th>
                <th className="px-4 py-3.5">Status &amp; Severity</th>
                <th className="px-4 py-3.5">Assigned Ward &amp; Bed</th>
                <th className="px-4 py-3.5">Attending Physician</th>
                <th className="px-4 py-3.5">Emergency Contact</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-semibold text-slate-900">{p.name}</div>
                    <div className="text-[11px] text-teal-700 font-mono font-bold">{p.op_number}</div>
                  </td>

                  <td className="px-4 py-3.5 font-mono text-[11px]">
                    <div>{p.age} Yrs · {p.gender}</div>
                    <div className="text-slate-400 font-semibold">{p.blood_group}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      p.admission_status === 'ADMITTED'
                        ? 'bg-amber-100 text-amber-800'
                        : p.admission_status === 'DISCHARGED'
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {p.admission_status}
                    </span>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Severity: {p.severity}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    {p.bed_number ? (
                      <div>
                        <span className="font-mono font-bold text-slate-900">{p.bed_number}</span>
                        <div className="text-[11px] text-slate-400">{p.ward}</div>
                      </div>
                    ) : (
                      <span className="text-slate-400 font-mono text-[11px]">—</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-800">{p.doctor_name || 'Unassigned'}</div>
                    <div className="text-[11px] text-slate-400">{p.department_name}</div>
                  </td>

                  <td className="px-4 py-3.5 text-[11px] text-slate-500">
                    {p.emergency_contact}
                  </td>

                  <td className="px-5 py-3.5 text-right space-x-1">
                    {p.admission_status === 'ADMITTED' ? (
                      <button
                        disabled={dischargingId === p.id}
                        onClick={() => handleDischarge(p.id)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors border border-rose-200"
                      >
                        {dischargingId === p.id ? 'Processing...' : 'Discharge Patient'}
                      </button>
                    ) : (
                      <button
                        onClick={onOpenGreedyAllocation}
                        className="px-2.5 py-1 text-[11px] font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-md transition-colors border border-teal-200"
                      >
                        Allocate Bed
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    No patient records found matching query.
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
