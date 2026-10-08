import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Bell,
  Search,
  User as UserIcon,
  LogOut,
  Settings,
  ChevronDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Menu
} from 'lucide-react';
import { NotificationItem, UserRole } from '../../types.ts';
import { api } from '../../services/api.ts';

interface HeaderProps {
  notifications: NotificationItem[];
  onToggleSidebar?: () => void;
  onRefreshNotifications?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  notifications,
  onToggleSidebar,
  onRefreshNotifications
}) => {
  const { currentUser, logout, quickSwitchRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter(n => !n.is_read).length;

  // Derive breadcrumbs
  const pathParts = location.pathname.split('/').filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const url = `/${pathParts.slice(0, index + 1).join('/')}`;
    const label = part.replace(/-/g, ' ');
    return { url, label };
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    if (currentUser?.role === 'PATIENT') {
      navigate(`/patient/doctors?search=${encodeURIComponent(searchQuery)}`);
    } else {
      navigate(`/admin/patients?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleRoleSwitch = async (role: UserRole) => {
    try {
      const user = await quickSwitchRole(role);
      showToast(`Switched active view to ${role} (${user.full_name})`, 'info');
      if (role === 'PATIENT') navigate('/patient/dashboard');
      else if (role === 'DOCTOR') navigate('/doctor/dashboard');
      else if (role === 'NURSE') navigate('/nurse/dashboard');
      else navigate('/admin/dashboard');
    } catch (err: unknown) {
      showToast((err as Error).message, 'error');
    }
  };

  const handleLogout = () => {
    logout();
    showToast('Successfully logged out of hospital session.', 'info');
    navigate('/login');
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      if (onRefreshNotifications) onRefreshNotifications();
    } catch {
      // ignore
    }
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 shadow-2xs">
      {/* Left: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <Link to="/" className="text-slate-900 font-bold flex items-center gap-1.5 hover:text-teal-700">
            <span className="w-6 h-6 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold text-xs">
              <Activity className="w-3.5 h-3.5" />
            </span>
            <span>SMART HOSPITAL</span>
          </Link>
          {breadcrumbs.map((b, idx) => (
            <React.Fragment key={idx}>
              <span className="text-slate-300">/</span>
              {idx === breadcrumbs.length - 1 ? (
                <span className="text-slate-800 font-semibold capitalize">{b.label}</span>
              ) : (
                <Link to={b.url} className="hover:text-slate-800 capitalize transition-colors">
                  {b.label}
                </Link>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>

      {/* Middle: Universal Search */}
      <div className="hidden md:flex items-center flex-1 max-w-xs mx-6">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patients, doctors, beds..."
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:bg-white"
          />
        </form>
      </div>

      {/* Right: Quick Role Switcher + Notifications + Profile */}
      <div className="flex items-center gap-3">
        {/* Fast Switcher */}
        <div className="hidden xl:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
          <span className="px-2 text-slate-400 font-mono text-[10px]">Switch:</span>
          {(['ADMIN', 'DOCTOR', 'NURSE', 'PATIENT'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => handleRoleSwitch(r)}
              className={`px-2 py-1 rounded transition-colors ${
                currentUser?.role === r
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'hover:text-slate-900'
              }`}
            >
              {r === 'ADMIN' ? 'Admin' : r === 'DOCTOR' ? 'Doctor' : r === 'NURSE' ? 'Nurse' : 'Patient'}
            </button>
          ))}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            aria-label="Toggle notifications"
            className="relative p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-900">Hospital Notifications</span>
                <span className="text-[11px] font-mono text-slate-500">{unreadCount} unread</span>
              </div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">No active alerts.</div>
              ) : (
                notifications.slice(0, 8).map(n => (
                  <div
                    key={n.id}
                    onClick={() => handleMarkNotificationRead(n.id)}
                    className={`px-4 py-2.5 text-xs border-b border-slate-50 cursor-pointer hover:bg-slate-50 transition-colors ${
                      !n.is_read ? 'bg-teal-50/40' : ''
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
                    <p className="text-slate-600 text-[11px] leading-relaxed line-clamp-2">{n.message}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 pl-2 border-l border-slate-200 hover:opacity-90"
          >
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {currentUser?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-semibold text-slate-900 leading-none">
                {currentUser?.full_name || 'Administrator'}
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {currentUser?.role || 'ADMIN'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs">
              <div className="px-3 py-2 border-b border-slate-100">
                <div className="font-semibold text-slate-900">{currentUser?.full_name}</div>
                <div className="text-[11px] text-slate-500 font-mono truncate">{currentUser?.email || currentUser?.username}</div>
              </div>

              {currentUser?.role === 'PATIENT' ? (
                <Link
                  to="/patient/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>My Profile</span>
                </Link>
              ) : currentUser?.role === 'DOCTOR' ? (
                <Link
                  to="/doctor/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Doctor Profile</span>
                </Link>
              ) : currentUser?.role === 'NURSE' ? (
                <Link
                  to="/nurse/profile"
                  onClick={() => setShowProfileMenu(false)}
                  className="px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span>Nurse Profile</span>
                </Link>
              ) : (
                <Link
                  to="/admin/settings"
                  onClick={() => setShowProfileMenu(false)}
                  className="px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <Settings className="w-3.5 h-3.5 text-slate-400" />
                  <span>System Settings</span>
                </Link>
              )}

              <div className="border-t border-slate-100 my-1" />

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
