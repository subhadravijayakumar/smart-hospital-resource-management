import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Activity, Lock, KeyRound, Shield, User, Stethoscope, Clock, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types.ts';

export const LoginPage: React.FC = () => {
  const [tab, setTab] = useState<'PATIENT' | 'STAFF'>('PATIENT');
  const [identifier, setIdentifier] = useState('OP202600123');
  const [password, setPassword] = useState('Patient@123');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login, quickSwitchRole } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleTabSwitch = (newTab: 'PATIENT' | 'STAFF') => {
    setTab(newTab);
    setError(null);
    if (newTab === 'PATIENT') {
      setIdentifier('OP202600123');
      setPassword('Patient@123');
    } else {
      setIdentifier('admin');
      setPassword('Hospital@2026');
      setRole('ADMIN');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await login(identifier, password);
      showToast(`Welcome back, ${user.full_name}!`, 'success');
      redirectForRole(user.role);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async (targetRole: UserRole) => {
    setIsLoading(true);
    try {
      const user = await quickSwitchRole(targetRole);
      showToast(`Logged in as demo ${targetRole} (${user.full_name})`, 'success');
      redirectForRole(user.role);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const redirectForRole = (userRole: UserRole) => {
    if (userRole === 'PATIENT') navigate('/patient/dashboard');
    else if (userRole === 'DOCTOR') navigate('/doctor/dashboard');
    else if (userRole === 'NURSE') navigate('/nurse/dashboard');
    else navigate('/admin/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 selection:bg-teal-500 selection:text-white">
      {/* Hospital Brand Badge */}
      <div className="mb-6 text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700/80 text-teal-400 text-xs font-semibold shadow-xs">
          <Activity className="w-4 h-4 text-teal-400" />
          <span>SMART HOSPITAL RESOURCE OPTIMIZATION PLATFORM</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          AURA Health Management System
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
          Intelligent Clinical Resource Allocation, Greedy Bed Scheduling &amp; ESI Priority Queue Triage
        </p>
      </div>

      {/* Main Authentication Card */}
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Portal Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={() => handleTabSwitch('PATIENT')}
            className={`flex-1 py-3.5 text-xs font-bold text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${
              tab === 'PATIENT'
                ? 'border-teal-600 text-teal-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>PATIENT PORTAL</span>
          </button>
          <button
            type="button"
            onClick={() => handleTabSwitch('STAFF')}
            className={`flex-1 py-3.5 text-xs font-bold text-center transition-colors border-b-2 flex items-center justify-center gap-2 ${
              tab === 'STAFF'
                ? 'border-teal-600 text-teal-800 bg-white'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>STAFF / DOCTOR PORTAL</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
              {tab === 'PATIENT' ? 'Outpatient (OP) Number' : 'Employee ID / Username'}
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder={tab === 'PATIENT' ? 'e.g. OP202600123' : 'e.g. admin or dr_mitchell'}
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-mono font-medium"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
                Secret Password
              </label>
              <span className="text-[11px] text-teal-600 hover:underline cursor-pointer">
                Forgot password?
              </span>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white font-mono"
            />
          </div>

          {tab === 'STAFF' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                Target Role
              </label>
              <select
                value={role}
                onChange={(e) => {
                  const newRole = e.target.value as UserRole;
                  setRole(newRole);
                  if (newRole === 'ADMIN') { setIdentifier('admin'); setPassword('Hospital@2026'); }
                  else if (newRole === 'DOCTOR') { setIdentifier('dr_mitchell'); setPassword('Hospital@2026'); }
                  else if (newRole === 'NURSE') { setIdentifier('nurse_charlotte'); setPassword('Hospital@2026'); }
                }}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="ADMIN">Hospital Administrator</option>
                <option value="DOCTOR">Attending Physician (Doctor)</option>
                <option value="NURSE">Clinical Nurse Specialist</option>
                <option value="RECEPTIONIST">Outpatient Receptionist</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-xs flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
          </button>

          {/* Quick Demo Credentials Buttons */}
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500 mb-2 flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5 text-slate-400" />
              <span>Instant One-Click Demo Logins:</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => handleDemoLogin('ADMIN')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 text-slate-700 text-left font-medium transition-colors"
              >
                <span className="block font-bold">Admin Portal</span>
                <span className="text-[10px] text-slate-400 font-mono">admin / Hospital@2026</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('PATIENT')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 text-slate-700 text-left font-medium transition-colors"
              >
                <span className="block font-bold">Patient Eleanor</span>
                <span className="text-[10px] text-slate-400 font-mono">OP202600123 / Patient@123</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('DOCTOR')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 text-slate-700 text-left font-medium transition-colors"
              >
                <span className="block font-bold">Dr. Sarah Mitchell</span>
                <span className="text-[10px] text-slate-400 font-mono">Trauma Attending</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('NURSE')}
                className="p-2 rounded-lg bg-slate-50 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 text-slate-700 text-left font-medium transition-colors"
              >
                <span className="block font-bold">Nurse Charlotte</span>
                <span className="text-[10px] text-slate-400 font-mono">ICU Certified Nurse</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      <p className="text-[11px] text-slate-500 mt-6 font-mono text-center">
        Smart Hospital Resource Optimization OS · Version 2026 Enterprise Edition
      </p>
    </div>
  );
};
