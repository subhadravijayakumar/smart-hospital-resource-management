import React, { useState, useEffect } from 'react';
import { Facility } from '../types.ts';
import { api } from '../services/api.ts';
import {
  Building2,
  Clock,
  Phone,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Siren,
  Activity
} from 'lucide-react';

export const FacilitiesView: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getFacilities();
        setFacilities(res.facilities);
      } catch (err) {
        console.error('Failed to load facilities:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading hospital facilities directory...</div>;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">AVAILABLE</span>;
      case 'BUSY':
        return <span className="text-[11px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">BUSY</span>;
      case 'EMERGENCY_ONLY':
        return <span className="text-[11px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">EMERGENCY ONLY</span>;
      default:
        return <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">CLOSED</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 className="w-5 h-5 text-teal-600" />
          <span>Hospital Facilities &amp; Clinical Services Directory</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time operating status, service availability, location extensions, and emergency contact numbers.
        </p>
      </div>

      {/* Facilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {facilities.map(facility => (
          <div key={facility.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{facility.name}</h3>
                  <span className="text-xs text-slate-400 font-medium">{facility.category}</span>
                </div>
                <div>{getStatusBadge(facility.status)}</div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                {facility.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{facility.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{facility.operating_hours}</span>
              </div>
              <div className="flex items-center gap-2 font-mono text-slate-700 font-semibold">
                <Phone className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span>{facility.contact_number}</span>
              </div>
              {facility.capacity_metric && (
                <div className="pt-1 text-[11px] font-mono text-teal-800 font-medium">
                  Status metric: {facility.capacity_metric}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
