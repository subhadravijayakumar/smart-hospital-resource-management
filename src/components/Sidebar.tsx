import React from 'react';
import { UserRole } from '../types.ts';
import {
  LayoutDashboard,
  BedDouble,
  Siren,
  Users,
  Stethoscope,
  CalendarCheck2,
  Cpu,
  Package,
  LineChart,
  Building2,
  FileText,
  Clock,
  HeartPulse,
  Pill,
  ShieldCheck,
  Database
} from 'lucide-react';

interface SidebarProps {
  role: UserRole;
  activeView: string;
  onSelectView: (view: string) => void;
  pendingEmergencyCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role,
  activeView,
  onSelectView,
  pendingEmergencyCount = 0,
  lowStockCount = 0
}) => {
  // Navigation schemas for different roles
  const getNavItems = () => {
    if (role === 'PATIENT') {
      return [
        { id: 'patient_portal', label: 'My Health Portal', icon: HeartPulse },
        { id: 'appointments', label: 'Book Appointment', icon: CalendarCheck2 },
        { id: 'prescriptions', label: 'My Prescriptions', icon: Pill },
        { id: 'reports', label: 'Medical Reports', icon: FileText },
        { id: 'facilities', label: 'Hospital Facilities', icon: Building2 },
        { id: 'emergency', label: 'Emergency Help', icon: Siren }
      ];
    }

    if (role === 'DOCTOR') {
      return [
        { id: 'doctor_portal', label: 'Doctor Schedule', icon: Stethoscope },
        { id: 'patients', label: 'Assigned Inpatients', icon: Users },
        { id: 'appointments', label: 'Consultation Calendar', icon: CalendarCheck2 },
        { id: 'emergency', label: 'Emergency Triage', icon: Siren, badge: pendingEmergencyCount },
        { id: 'facilities', label: 'Hospital Facilities', icon: Building2 }
      ];
    }

    if (role === 'NURSE') {
      return [
        { id: 'nurse_portal', label: 'My Shift & Ward', icon: Clock },
        { id: 'beds', label: 'Bed Status & Ward', icon: BedDouble },
        { id: 'emergency', label: 'Emergency Triage', icon: Siren, badge: pendingEmergencyCount },
        { id: 'inventory', label: 'Ward Inventory', icon: Package, badge: lowStockCount },
        { id: 'facilities', label: 'Hospital Facilities', icon: Building2 }
      ];
    }

    // ADMIN or RECEPTIONIST
    return [
      { id: 'admin_overview', label: 'Resource Dashboard', icon: LayoutDashboard },
      { id: 'beds', label: 'Beds & Greedy Allocation', icon: BedDouble },
      { id: 'emergency', label: 'Emergency Priority Queue', icon: Siren, badge: pendingEmergencyCount },
      { id: 'patients', label: 'Patient Directory & EHR', icon: Users },
      { id: 'doctors', label: 'Doctors & Schedules', icon: Stethoscope },
      { id: 'shifts', label: 'Nurse Shift Optimizer', icon: Clock },
      { id: 'appointments', label: 'Appointments Roster', icon: CalendarCheck2 },
      { id: 'equipment', label: 'Equipment & Biomedical', icon: Cpu },
      { id: 'inventory', label: 'Medical Supplies & Stock', icon: Package, badge: lowStockCount },
      { id: 'analytics', label: 'ML Predictive Analytics', icon: LineChart },
      { id: 'facilities', label: 'Facilities Directory', icon: Building2 },
      { id: 'database_schema', label: 'Database & Schema', icon: Database },
      { id: 'audit_logs', label: 'Audit Logs & Reports', icon: ShieldCheck }
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-57px)] border-r border-slate-800">
      <div className="p-4 border-b border-slate-800/80">
        <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-1">
          Workspace Mode
        </div>
        <div className="text-sm font-semibold text-white flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          {role === 'PATIENT' ? 'Patient Access' : role === 'DOCTOR' ? 'Physician Console' : role === 'NURSE' ? 'Nurse Station' : 'Executive Administration'}
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-600/90 text-white shadow-sm font-semibold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-rose-500/80 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* System Status info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 leading-relaxed">
        <div className="flex items-center justify-between text-slate-300 font-medium mb-1">
          <span>Relational Engine</span>
          <span className="text-emerald-400 font-mono">ONLINE</span>
        </div>
        <div className="flex items-center justify-between text-slate-300 font-medium">
          <span>Optimization Models</span>
          <span className="text-teal-400 font-mono">CALIBRATED</span>
        </div>
      </div>
    </aside>
  );
};
