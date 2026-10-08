import React, { useState } from 'react';
import { Bed } from '../types.ts';
import { api } from '../services/api.ts';
import {
  BedDouble,
  ShieldCheck,
  Wind,
  Droplets,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RotateCcw
} from 'lucide-react';

interface BedsManagementViewProps {
  beds: Bed[];
  onRefresh: () => void;
  onOpenGreedyAllocation: () => void;
}

export const BedsManagementView: React.FC<BedsManagementViewProps> = ({
  beds,
  onRefresh,
  onOpenGreedyAllocation
}) => {
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [updatingBedId, setUpdatingBedId] = useState<number | null>(null);

  const filteredBeds = beds.filter(bed => {
    if (statusFilter && bed.status !== statusFilter) return false;
    if (typeFilter && bed.bed_type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        bed.bed_number.toLowerCase().includes(q) ||
        bed.ward.toLowerCase().includes(q) ||
        (bed.current_patient_name && bed.current_patient_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleUpdateStatus = async (bedId: number, newStatus: string) => {
    setUpdatingBedId(bedId);
    try {
      await api.updateBedStatus(bedId, newStatus);
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setUpdatingBedId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="text-emerald-700 font-semibold font-mono text-[11px]">AVAILABLE</span>;
      case 'OCCUPIED':
        return <span className="text-teal-700 font-semibold font-mono text-[11px]">OCCUPIED</span>;
      case 'CLEANING':
        return <span className="text-amber-700 font-semibold font-mono text-[11px]">CLEANING</span>;
      case 'MAINTENANCE':
        return <span className="text-rose-700 font-semibold font-mono text-[11px]">MAINTENANCE</span>;
      default:
        return <span className="text-slate-600 font-mono text-[11px]">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BedDouble className="w-5 h-5 text-teal-600" />
            <span>Bed Inventory &amp; Algorithmic Allocation</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time telemetry of critical care units, step-down telemetry beds, and automated greedy heuristic placement.
          </p>
        </div>

        <button
          onClick={onOpenGreedyAllocation}
          className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Launch Greedy Bed Allocator</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search bed number, ward, or patient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs border-none focus:outline-none placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">AVAILABLE</option>
              <option value="OCCUPIED">OCCUPIED</option>
              <option value="CLEANING">CLEANING</option>
              <option value="MAINTENANCE">MAINTENANCE</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
            >
              <option value="">All Bed Types</option>
              <option value="ICU">ICU</option>
              <option value="EMERGENCY">EMERGENCY</option>
              <option value="GENERAL">GENERAL</option>
              <option value="SEMI_PRIVATE">SEMI_PRIVATE</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
          </div>

          <button
            onClick={onRefresh}
            title="Refresh bed statuses"
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Bed Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBeds.map(bed => (
          <div
            key={bed.id}
            className={`p-4 rounded-xl border transition-all ${
              bed.status === 'OCCUPIED'
                ? 'bg-white border-slate-200 shadow-xs'
                : bed.status === 'AVAILABLE'
                ? 'bg-emerald-50/20 border-emerald-200/80 shadow-xs'
                : bed.status === 'CLEANING'
                ? 'bg-amber-50/20 border-amber-200/80'
                : 'bg-rose-50/20 border-rose-200/80'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono font-bold text-sm text-slate-900 flex items-center gap-1.5">
                <BedDouble className="w-4 h-4 text-slate-600" />
                {bed.bed_number}
              </span>
              <div>{getStatusBadge(bed.status)}</div>
            </div>

            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <div className="flex justify-between">
                <span className="text-slate-400">Ward:</span>
                <span className="font-medium">{bed.ward}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Floor &amp; Type:</span>
                <span className="font-medium font-mono">Floor {bed.floor_number} · {bed.bed_type}</span>
              </div>
            </div>

            {/* Life support capabilities */}
            <div className="flex items-center gap-3 py-2 border-t border-slate-100 text-[11px] text-slate-500 font-mono">
              <span className={`flex items-center gap-1 ${bed.has_ventilator ? 'text-teal-700 font-semibold' : 'text-slate-400'}`}>
                <Wind className="w-3.5 h-3.5" />
                {bed.has_ventilator ? 'Ventilator' : 'No Vent'}
              </span>
              <span className={`flex items-center gap-1 ${bed.has_oxygen_support ? 'text-teal-700 font-semibold' : 'text-slate-400'}`}>
                <Droplets className="w-3.5 h-3.5" />
                {bed.has_oxygen_support ? 'O2 Support' : 'No O2'}
              </span>
            </div>

            {/* Assigned Patient Info */}
            {bed.current_patient_name ? (
              <div className="mt-2.5 p-2 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="text-[10px] text-slate-400 uppercase tracking-wide font-semibold">Current Patient</div>
                <div className="font-semibold text-slate-900 truncate">{bed.current_patient_name}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {bed.patient_op_number} {bed.patient_severity ? `· ${bed.patient_severity}` : ''}
                </div>
              </div>
            ) : (
              <div className="mt-2.5 p-2 rounded-lg bg-slate-50/50 border border-dashed border-slate-200 text-center text-[11px] text-slate-400">
                Ready for triage assignment
              </div>
            )}

            {/* Fast status actions */}
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              {bed.status === 'CLEANING' && (
                <button
                  disabled={updatingBedId === bed.id}
                  onClick={() => handleUpdateStatus(bed.id, 'AVAILABLE')}
                  className="w-full py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
                >
                  Mark Cleaning Complete (Available)
                </button>
              )}
              {bed.status === 'AVAILABLE' && (
                <button
                  disabled={updatingBedId === bed.id}
                  onClick={() => handleUpdateStatus(bed.id, 'MAINTENANCE')}
                  className="text-[11px] text-slate-500 hover:text-slate-800"
                >
                  Mark Maintenance
                </button>
              )}
              {bed.status === 'MAINTENANCE' && (
                <button
                  disabled={updatingBedId === bed.id}
                  onClick={() => handleUpdateStatus(bed.id, 'AVAILABLE')}
                  className="w-full py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Return to Service (Available)
                </button>
              )}
              {bed.status === 'OCCUPIED' && (
                <div className="text-[11px] text-slate-400 font-mono">
                  Release upon discharge
                </div>
              )}
            </div>
          </div>
        ))}

        {filteredBeds.length === 0 && (
          <div className="col-span-full py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200">
            No hospital beds found matching current filter parameters.
          </div>
        )}
      </div>
    </div>
  );
};
