import React, { useState } from 'react';
import { Appointment } from '../types.ts';
import { api } from '../services/api.ts';
import {
  CalendarCheck2,
  Search,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Clock
} from 'lucide-react';

interface AppointmentsViewProps {
  appointments: Appointment[];
  onRefresh: () => void;
  onOpenBookModal: () => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  appointments,
  onRefresh,
  onOpenBookModal
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filtered = appointments.filter(a => {
    if (statusFilter && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        (a.patient_name && a.patient_name.toLowerCase().includes(q)) ||
        (a.doctor_name && a.doctor_name.toLowerCase().includes(q)) ||
        a.time_slot.toLowerCase().includes(q) ||
        a.reason.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await api.updateAppointmentStatus(id, status);
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
            <CalendarCheck2 className="w-5 h-5 text-teal-600" />
            <span>Outpatient Appointment &amp; Consultation Roster</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated conflict resolution preventing double booking across hospital clinics.
          </p>
        </div>

        <button
          onClick={onOpenBookModal}
          className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Book Appointment</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient, physician, or appointment reason..."
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
            <option value="">All Statuses</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            title="Refresh appointments"
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
                <th className="px-5 py-3.5">Date &amp; Slot</th>
                <th className="px-4 py-3.5">Patient Details</th>
                <th className="px-4 py-3.5">Doctor &amp; Specialty</th>
                <th className="px-4 py-3.5">Clinical Purpose</th>
                <th className="px-4 py-3.5">Booking Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(a => (
                <tr key={a.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3.5 font-mono">
                    <div className="font-bold text-slate-900">{a.appointment_date}</div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{a.time_slot}</span>
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-semibold text-slate-900">{a.patient_name}</div>
                    <div className="text-[11px] text-teal-700 font-mono">{a.op_number}</div>
                  </td>

                  <td className="px-4 py-3.5">
                    <div className="font-medium text-slate-800">{a.doctor_name}</div>
                    <div className="text-[11px] text-slate-400">{a.specialization}</div>
                  </td>

                  <td className="px-4 py-3.5 text-slate-700 max-w-xs truncate">
                    {a.reason}
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                      a.status === 'CONFIRMED'
                        ? 'bg-emerald-100 text-emerald-800'
                        : a.status === 'COMPLETED'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 text-right space-x-1">
                    {a.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'COMPLETED')}
                          className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md transition-colors"
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(a.id, 'CANCELLED')}
                          className="px-2 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-xs">
                    No appointments scheduled matching search.
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
