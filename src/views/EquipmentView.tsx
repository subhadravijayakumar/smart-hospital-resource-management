import React, { useState } from 'react';
import { Equipment } from '../types.ts';
import { api } from '../services/api.ts';
import { Cpu, Search, CheckCircle2, Wrench, AlertTriangle, RotateCcw } from 'lucide-react';

interface EquipmentViewProps {
  equipment: Equipment[];
  onRefresh: () => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  equipment,
  onRefresh
}) => {
  const [search, setSearch] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const filtered = equipment.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      return (
        e.name.toLowerCase().includes(q) ||
        e.serial_number.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleStatusChange = async (id: number, status: string) => {
    setUpdatingId(id);
    try {
      await api.updateEquipmentStatus(id, status);
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Cpu className="w-5 h-5 text-teal-600" />
            <span>Biomedical Equipment &amp; Diagnostics Registry</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ventilator utilization, diagnostic scanners, telemetry monitors, and scheduled preventive maintenance.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50"
          title="Refresh Equipment"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 max-w-sm flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search device, serial, or modality..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs border-none focus:outline-none"
        />
      </div>

      {/* Grid of Equipment */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(item => {
          const isMaint = item.status === 'MAINTENANCE';
          const isInUse = item.status === 'IN_USE';

          return (
            <div key={item.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{item.name}</h3>
                  <span className="font-mono text-xs text-slate-400">{item.serial_number}</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  item.status === 'AVAILABLE'
                    ? 'bg-emerald-100 text-emerald-800'
                    : isInUse
                    ? 'bg-teal-100 text-teal-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {item.status}
                </span>
              </div>

              <div className="text-xs text-slate-600 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span>{item.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span>{item.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Next Service:</span>
                  <span>{item.next_maintenance_date || '2026-12-01'}</span>
                </div>
              </div>

              {item.assigned_patient_name && (
                <div className="p-2 rounded-lg bg-teal-50 border border-teal-100 text-xs text-teal-900">
                  <span className="font-semibold">Connected:</span> {item.assigned_patient_name}
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                {item.status === 'AVAILABLE' ? (
                  <button
                    disabled={updatingId === item.id}
                    onClick={() => handleStatusChange(item.id, 'MAINTENANCE')}
                    className="text-xs text-slate-600 hover:text-rose-600 flex items-center gap-1"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Send for Maintenance</span>
                  </button>
                ) : isMaint ? (
                  <button
                    disabled={updatingId === item.id}
                    onClick={() => handleStatusChange(item.id, 'AVAILABLE')}
                    className="w-full py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200"
                  >
                    Complete Maintenance (Make Available)
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400 font-mono">Bedside In-Use</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
