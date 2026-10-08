import React, { useState } from 'react';
import { User, NotificationItem, UserRole } from '../types.ts';
import {
  Bell,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Activity,
  UserCircle,
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
  Clock,
  HeartPulse,
  Pill,
  ShieldCheck,
  Database,
  Menu,
  X,
  ChevronDown
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  activeView: string;
  onSelectView: (view: string) => void;
  notifications: NotificationItem[];
  onQuickSwitch: (role: UserRole) => void;
  onLogout: () => void;
  onOpenLogin: () => void;
  onMarkNotificationRead: (id: number) => void;
  pendingEmergencyCount?: number;
  lowStockCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  activeView,
  onSelectView,
  notifications,
  onQuickSwitch,
  onLogout,
  onOpenLogin,
  onMarkNotificationRead,
  pendingEmergencyCount = 0,
  lowStockCount = 0
}) => {
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const unreadCount = notifications.filter(n => !n.is_read).length;

  const role = currentUser?.role || 'ADMIN';

  // Role-specific top menu navigation schemas
  const getNavItems = () => {
    if (role === 'PATIENT') {
      return [
        { id: 'patient_portal', label: 'My Health Portal', icon: HeartPulse },
        { id: 'appointments', label: 'Book Appointment', icon: CalendarCheck2 },
        { id: 'facilities', label: 'Hospital Facilities', icon: Building2 },
        { id: 'emergency', label: 'Emergency Help', icon: Siren }
      ];
    }

    if (role === 'DOCTOR') {
      return [
        { id: 'doctor_portal', label: 'Doctor Schedule & EHR', icon: Stethoscope },
        { id: 'patients', label: 'Assigned Inpatients', icon: Users },
        { id: 'appointments', label: 'Consultations', icon: CalendarCheck2 },
        { id: 'emergency', label: 'Emergency Triage', icon: Siren, badge: pendingEmergencyCount, badgeColor: 'bg-rose-500 text-white' },
        { id: 'facilities', label: 'Facilities', icon: Building2 }
      ];
    }

    if (role === 'NURSE') {
      return [
        { id: 'nurse_portal', label: 'My Shift & Ward', icon: Clock },
        { id: 'beds', label: 'Bed Status & Ward', icon: BedDouble },
        { id: 'emergency', label: 'Emergency Triage', icon: Siren, badge: pendingEmergencyCount, badgeColor: 'bg-rose-500 text-white' },
        { id: 'inventory', label: 'Ward Supplies', icon: Package, badge: lowStockCount, badgeColor: 'bg-amber-500 text-white' },
        { id: 'facilities', label: 'Facilities', icon: Building2 }
      ];
    }

    // ADMIN or RECEPTIONIST
    return [
      { id: 'admin_overview', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'beds', label: 'Bed Allocation', icon: BedDouble },
      { id: 'emergency', label: 'Emergency Triage', icon: Siren, badge: pendingEmergencyCount, badgeColor: 'bg-rose-500 text-white' },
      { id: 'patients', label: 'Patients & EHR', icon: Users },
      { id: 'appointments', label: 'Appointments', icon: CalendarCheck2 },
      { id: 'shifts', label: 'Nurse Shifts', icon: Clock },
      { id: 'equipment', label: 'Equipment', icon: Cpu },
      { id: 'inventory', label: 'Supplies & Stock', icon: Package, badge: lowStockCount, badgeColor: 'bg-amber-500 text-white' },
      { id: 'analytics', label: 'ML Analytics', icon: LineChart },
      { id: 'facilities', label: 'Facilities', icon: Building2 },
      { id: 'database_schema', label: 'Database & Schema', icon: Database },
      { id: 'audit_logs', label: 'Audit Logs', icon: ShieldCheck }
    ];
  };

  const navItems = getNavItems();

  const getWorkspaceTitle = () => {
    switch (role) {
      case 'PATIENT': return 'Patient Portal';
      case 'DOCTOR': return 'Physician Console';
      case 'NURSE': return 'Nurse Station';
      case 'RECEPTIONIST': return 'Front Desk Reception';
      default: return 'Hospital Administration';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Tier 1: Brand, Mode, Quick Role Switcher, Alerts & User Controls */}
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-100 bg-white">
        {/* Left: Brand Wordmark & Mode Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-700 to-teal-500 text-white flex items-center justify-center font-bold text-base shadow-sm ring-1 ring-teal-600/20">
              <Activity className="w-5 h-5" />
            </span>
            <div>
              <div className="text-base font-extrabold tracking-tight text-slate-900 leading-none flex items-center gap-2">
                <span>AURA Hospital</span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
                  {getWorkspaceTitle()}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Clinical Resource &amp; Optimization System
              </div>
            </div>
          </div>
        </div>

        {/* Center: Quick Demo Role Switcher */}
        <div className="hidden xl:flex items-center gap-1 p-1 bg-slate-100/90 rounded-xl text-xs font-medium border border-slate-200/60">
          <span className="px-2 text-slate-500 font-semibold text-[11px]">Role Switch:</span>
          {(['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'RECEPTIONIST'] as UserRole[]).map((r) => {
            const isActive = currentUser?.role === r;
            const labels: Record<UserRole, string> = {
              ADMIN: 'Admin',
              DOCTOR: 'Doctor',
              NURSE: 'Nurse',
              PATIENT: 'Patient',
              RECEPTIONIST: 'Reception'
            };
            return (
              <button
                key={r}
                type="button"
                onClick={() => onQuickSwitch(r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
              >
                {labels[r]}
              </button>
            );
          })}
        </div>

        {/* Right: Notifications, User Profile & Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowNotifs(!showNotifs)}
              aria-label="Toggle notifications"
              className="relative p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                  <span className="text-xs font-bold text-slate-900">Hospital Notifications</span>
                  <span className="text-[11px] font-mono font-medium text-teal-700 bg-teal-100/60 px-2 py-0.5 rounded-full">
                    {unreadCount} unread
                  </span>
                </div>
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">No active alerts.</div>
                ) : (
                  notifications.slice(0, 8).map(n => (
                    <div
                      key={n.id}
                      onClick={() => onMarkNotificationRead(n.id)}
                      className={`px-4 py-2.5 text-xs border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !n.is_read ? 'bg-teal-50/50' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                          {n.notification_type === 'EMERGENCY' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 inline shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 inline shrink-0" />
                          )}
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-slate-600 line-clamp-2 text-[11px] leading-relaxed">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Current User Pill & Sign Out Button */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">{currentUser.full_name}</div>
                <div className="text-[10px] text-slate-500 font-mono">
                  {currentUser.role} {currentUser.op_number ? `· ${currentUser.op_number}` : ''}
                </div>
              </div>
              <button
                onClick={onLogout}
                title="Sign Out to Login Page"
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-xl transition-all cursor-pointer shadow-2xs"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-500 hover:text-rose-600" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-sm cursor-pointer"
            >
              <UserCircle className="w-4 h-4" />
              Sign In
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
            aria-label="Toggle Navigation Menus"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Tier 2: The Menus Visualized at the Top (Not in a Sidebar!) */}
      <nav className="bg-slate-900 text-slate-300 px-4 sm:px-6 shadow-inner">
        {/* Desktop Top Menu Horizontal Bar */}
        <div className="hidden lg:flex items-center gap-1 overflow-x-auto py-1.5 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectView(item.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold tracking-normal transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm ring-1 ring-white/10'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-teal-500 text-white'}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Expandable Top Menu Panel */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 space-y-1 border-t border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectView(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-teal-600 text-white font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-teal-500 text-white'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Mobile Quick Role Switcher */}
            <div className="pt-3 mt-2 border-t border-slate-800/80">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                Quick Role Switch
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT', 'RECEPTIONIST'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onQuickSwitch(r);
                      setMobileMenuOpen(false);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left ${
                      currentUser?.role === r
                        ? 'bg-teal-700 text-white font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};
