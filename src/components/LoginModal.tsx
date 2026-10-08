import React, { useState } from 'react';
import { api, setStoredToken } from '../services/api.ts';
import { User } from '../types.ts';
import { X, Lock, KeyRound, AlertCircle, UserCheck } from 'lucide-react';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [tab, setTab] = useState<'PATIENT' | 'STAFF'>('PATIENT');
  const [identifier, setIdentifier] = useState('OP202600123');
  const [password, setPassword] = useState('Patient@123');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTabSwitch = (newTab: 'PATIENT' | 'STAFF') => {
    setTab(newTab);
    setError(null);
    if (newTab === 'PATIENT') {
      setIdentifier('OP202600123');
      setPassword('Patient@123');
    } else {
      setIdentifier('admin');
      setPassword('Hospital@2026');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.login(identifier, password);
      setStoredToken(res.token);
      onLoginSuccess(res.user);
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <Lock className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Hospital Portal Sign In</h3>
              <p className="text-xs text-slate-500">Secure JWT Authentication & BCrypt Verification</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-200 bg-slate-50/50">
          <button
            type="button"
            onClick={() => handleTabSwitch('PATIENT')}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              tab === 'PATIENT'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Patient OP Login
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('STAFF')}
            className={`flex-1 py-3 text-xs font-semibold text-center transition-colors border-b-2 ${
              tab === 'STAFF'
                ? 'border-teal-600 text-teal-700 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Staff / Doctor / Admin
          </button>
        </div>

        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {tab === 'PATIENT' ? 'Outpatient (OP) Number *' : 'Username / Employee ID *'}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={e => setIdentifier(e.target.value)}
              placeholder={tab === 'PATIENT' ? 'e.g. OP202600123' : 'e.g. admin or dr_mitchell'}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Secret Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-mono"
            />
          </div>

          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <div className="font-semibold text-slate-700 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-500" />
              <span>Sample Credentials in MySQL/Database:</span>
            </div>
            {tab === 'PATIENT' ? (
              <p>OP Number: <span className="font-mono text-slate-900 font-bold">OP202600123</span> · Password: <span className="font-mono text-slate-900 font-bold">Patient@123</span></p>
            ) : (
              <div className="space-y-0.5">
                <p>Admin: <span className="font-mono text-slate-900 font-bold">admin</span> / <span className="font-mono text-slate-900 font-bold">Hospital@2026</span></p>
                <p>Doctor: <span className="font-mono text-slate-900 font-bold">dr_mitchell</span> / <span className="font-mono text-slate-900 font-bold">Hospital@2026</span></p>
                <p>Nurse: <span className="font-mono text-slate-900 font-bold">nurse_charlotte</span> / <span className="font-mono text-slate-900 font-bold">Hospital@2026</span></p>
              </div>
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              <UserCheck className="w-4 h-4" />
              {isSubmitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
