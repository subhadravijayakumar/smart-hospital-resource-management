import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Users,
  BedDouble,
  Siren,
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
  LogOut,
  Sparkles,
  GitMerge,
  Flame,
  ClipboardList,
  Calendar,
  Settings
} from 'lucide-react';

interface SidebarProps {
  onCloseMobile?: () => void;
  pendingEmergencyCount?: number;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile,
  pendingEmergencyCount = 0,
  lowStockCount = 0
}) => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const role = currentUser?.role || 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
      isActive
        ? 'bg-teal-600 text-white font-semibold shadow-2xs'
        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
    }`;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 min-h-[calc(100vh-53px)] border-r border-slate-800 text-xs">
      {/* Role Badge */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-0.5">
            Portal Access
          </div>
          <div className="text-sm font-bold text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span>
              {role === 'PATIENT'
                ? 'Patient Portal'
                : role === 'DOCTOR'
                ? 'Physician Console'
                : role === 'NURSE'
                ? 'Nurse Station'
                : 'Hospital Admin'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {/* PATIENT NAVIGATION */}
        {role === 'PATIENT' && (
          <div className="space-y-1">
            <NavLink to="/patient/dashboard" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <HeartPulse className="w-4 h-4 text-teal-400" />
                <span>Dashboard</span>
              </div>
            </NavLink>
            <NavLink to="/patient/profile" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>My Profile</span>
              </div>
            </NavLink>
            <NavLink to="/patient/appointments" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <CalendarCheck2 className="w-4 h-4" />
                <span>Appointments</span>
              </div>
            </NavLink>
            <NavLink to="/patient/doctors" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-4 h-4" />
                <span>Find a Doctor</span>
              </div>
            </NavLink>
            <NavLink to="/patient/medical-reports" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Medical Reports</span>
              </div>
            </NavLink>
            <NavLink to="/patient/prescriptions" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Pill className="w-4 h-4" />
                <span>Prescriptions</span>
              </div>
            </NavLink>
            <NavLink to="/patient/bed" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <BedDouble className="w-4 h-4" />
                <span>My Bed</span>
              </div>
            </NavLink>
            <NavLink to="/patient/emergency" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Siren className="w-4 h-4 text-rose-400" />
                <span className="text-rose-200">Emergency Help</span>
              </div>
            </NavLink>
            <NavLink to="/patient/facilities" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Hospital Facilities</span>
              </div>
            </NavLink>
          </div>
        )}

        {/* DOCTOR NAVIGATION */}
        {role === 'DOCTOR' && (
          <div className="space-y-1">
            <NavLink to="/doctor/dashboard" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-teal-400" />
                <span>Dashboard</span>
              </div>
            </NavLink>
            <NavLink to="/doctor/appointments" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <CalendarCheck2 className="w-4 h-4" />
                <span>Appointments</span>
              </div>
            </NavLink>
            <NavLink to="/doctor/patients" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>My Patients</span>
              </div>
            </NavLink>
            <NavLink to="/doctor/medical-records" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4" />
                <span>Medical Records (EHR)</span>
              </div>
            </NavLink>
            <NavLink to="/doctor/availability" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>Doctor Availability</span>
              </div>
            </NavLink>
            <NavLink to="/doctor/profile" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Stethoscope className="w-4 h-4" />
                <span>Profile Credentials</span>
              </div>
            </NavLink>
          </div>
        )}

        {/* NURSE NAVIGATION */}
        {role === 'NURSE' && (
          <div className="space-y-1">
            <NavLink to="/nurse/dashboard" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className="w-4 h-4 text-teal-400" />
                <span>Dashboard</span>
              </div>
            </NavLink>
            <NavLink to="/nurse/patients" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>My Patients &amp; Vitals</span>
              </div>
            </NavLink>
            <NavLink to="/nurse/shift" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4" />
                <span>My Shift</span>
              </div>
            </NavLink>
            <NavLink to="/nurse/schedule" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4" />
                <span>Shift Schedule</span>
              </div>
            </NavLink>
            <NavLink to="/nurse/emergency" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <Siren className="w-4 h-4 text-rose-400" />
                <span>Emergency Triage</span>
              </div>
              {pendingEmergencyCount > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                  {pendingEmergencyCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/nurse/leave" onClick={onCloseMobile} className={navLinkClass}>
              <div className="flex items-center gap-2.5">
                <ClipboardList className="w-4 h-4" />
                <span>Apply Leave</span>
              </div>
            </NavLink>
          </div>
        )}

        {/* ADMIN CATEGORIZED NAVIGATION */}
        {role === 'ADMIN' && (
          <div className="space-y-4">
            <div>
              <NavLink to="/admin/dashboard" onClick={onCloseMobile} className={navLinkClass}>
                <div className="flex items-center gap-2.5">
                  <LayoutDashboard className="w-4 h-4 text-teal-400" />
                  <span>Operations Dashboard</span>
                </div>
              </NavLink>
            </div>

            {/* Patient Management */}
            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Patient Management
              </div>
              <div className="space-y-0.5">
                <NavLink to="/admin/patients" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Patients Registry</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/patient-flow" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <GitMerge className="w-3.5 h-3.5" />
                    <span>Patient Journey Flow</span>
                  </div>
                </NavLink>
              </div>
            </div>

            {/* Staff Management */}
            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Staff Management
              </div>
              <div className="space-y-0.5">
                <NavLink to="/admin/doctors" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Stethoscope className="w-3.5 h-3.5" />
                    <span>Doctors &amp; Clinics</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/nurses" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Nurses &amp; Clinical Staff</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/departments" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Departments</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/leave" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-3.5 h-3.5" />
                    <span>Staff Leave Requests</span>
                  </div>
                </NavLink>
              </div>
            </div>

            {/* Resource Management */}
            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Resource Management
              </div>
              <div className="space-y-0.5">
                <NavLink to="/admin/beds" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <BedDouble className="w-3.5 h-3.5" />
                    <span>Bed Inventory</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/beds/allocation" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                    <span>Greedy Bed Allocator</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/equipment" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Equipment &amp; Biomed</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/inventory" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Package className="w-3.5 h-3.5" />
                    <span>Pharmacy Supplies</span>
                  </div>
                  {lowStockCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500 text-white">
                      {lowStockCount}
                    </span>
                  )}
                </NavLink>
              </div>
            </div>

            {/* Operations */}
            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Operations &amp; Triage
              </div>
              <div className="space-y-0.5">
                <NavLink to="/admin/emergency" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Siren className="w-3.5 h-3.5 text-rose-400" />
                    <span>Emergency Priority Queue</span>
                  </div>
                  {pendingEmergencyCount > 0 && (
                    <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-rose-500 text-white">
                      {pendingEmergencyCount}
                    </span>
                  )}
                </NavLink>
                <NavLink to="/admin/icu" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>ICU Critical Telemetry</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/appointments" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <CalendarCheck2 className="w-3.5 h-3.5" />
                    <span>Appointments Roster</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/shifts" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Nurse Shift Optimizer</span>
                  </div>
                </NavLink>
              </div>
            </div>

            {/* Analytics */}
            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Analytics &amp; Intelligence
              </div>
              <div className="space-y-0.5">
                <NavLink to="/admin/analytics" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Operations Analytics</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/predictions" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    <span>ML Demand Predictions</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/reports" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Clinical Reports Export</span>
                  </div>
                </NavLink>
              </div>
            </div>

            {/* Administration */}
            <div>
              <div className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                Administration
              </div>
              <div className="space-y-0.5">
                <NavLink to="/admin/facilities" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Facilities Directory</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/audit-logs" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Audit Logs</span>
                  </div>
                </NavLink>
                <NavLink to="/admin/settings" onClick={onCloseMobile} className={navLinkClass}>
                  <div className="flex items-center gap-2.5">
                    <Settings className="w-3.5 h-3.5" />
                    <span>Hospital Settings</span>
                  </div>
                </NavLink>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer / Sign Out */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs font-semibold"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
