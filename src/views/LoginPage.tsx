import React, { useState } from 'react';
import { api, setStoredToken } from '../services/api.ts';
import { User, UserRole } from '../types.ts';
import {
  Activity,
  Lock,
  UserCheck,
  Shield,
  Stethoscope,
  HeartPulse,
  KeyRound,
  AlertCircle,
  Eye,
  EyeOff,
  Database,
  ArrowRight,
  ShieldAlert,
  User as UserIcon,
  Sparkles,
  Server,
  FileCode2
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
}

type RoleCategory = 'PATIENT' | 'STAFF' | 'ADMIN';

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [selectedRole, setSelectedRole] = useState<RoleCategory>('ADMIN');
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('Hospital@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Switch role category: Patient / Staff / Admin
  const handleRoleSelect = (role: RoleCategory) => {
    setSelectedRole(role);
    setError(null);
    if (role === 'PATIENT') {
      setIdentifier('OP202600123');
      setPassword('Patient@123');
    } else if (role === 'STAFF') {
      setIdentifier('dr_mitchell');
      setPassword('Hospital@2026');
    } else {
      setIdentifier('admin');
      setPassword('Hospital@2026');
    }
  };

  // Form submission authentication
  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please provide both username/OP number and password to authenticate.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(identifier.trim(), password);
      setStoredToken(res.token);
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      setError((err as Error).message || 'Invalid credentials. Access denied.');
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-Click Role Login
  const handleInstantLogin = async (targetRole: UserRole) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.quickSwitchRole(targetRole);
      setStoredToken(res.token);
      onLoginSuccess(res.user);
    } catch (err: unknown) {
      setError((err as Error).message || 'Unable to sign in as selected role.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between selection:bg-teal-500 selection:text-white">
      {/* Top Global Brand Header */}
      <header className="w-full bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-6 lg:px-10 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-md ring-1 ring-teal-400/30">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-base font-extrabold text-white tracking-tight leading-none flex items-center gap-2">
                <span>AURA SMART HOSPITAL SYSTEM</span>
                <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  Authentication Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Clinical Resource Optimization &amp; Electronic Health Records</p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Local System Schema Ready (schema.sql)</span>
            </span>
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>HIPAA Compliant</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Centered Login Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-4xl bg-white text-slate-900 rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          
          {/* Top Banner inside Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 sm:p-8 text-white border-b border-slate-700/60">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-semibold mb-2 border border-teal-500/30">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Authentication Required</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Hospital System Login
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl leading-relaxed">
                  Please select whether you are a <strong>Patient</strong>, <strong>Staff member</strong>, or <strong>Hospital Admin</strong> to access your secure portal.
                </p>
              </div>

              <div className="hidden md:flex flex-col items-end text-right text-xs text-slate-400">
                <span className="font-mono text-teal-300 font-semibold">21 Normalized Tables</span>
                <span className="text-[11px]">MySQL 8.0 &amp; SQLite Dual Engine</span>
              </div>
            </div>

            {/* STEP 1: The 3 Primary Role Cards (Patient / Staff / Admin) */}
            <div className="mt-6 pt-6 border-t border-slate-700/60">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-300 mb-3 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Step 1: Choose Your Role to Sign In</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. PATIENT */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('PATIENT')}
                  className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'PATIENT'
                      ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/30 shadow-lg'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-300 flex items-center justify-center font-bold">
                      <HeartPulse className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-semibold">
                      PATIENT
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Patient Portal</div>
                    <div className="text-[11px] text-slate-300">OP Number &amp; Prescriptions</div>
                  </div>
                </button>

                {/* 2. STAFF */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('STAFF')}
                  className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'STAFF'
                      ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/30 shadow-lg'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold">
                      STAFF
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Medical Staff</div>
                    <div className="text-[11px] text-slate-300">Doctors, Nurses, Reception</div>
                  </div>
                </button>

                {/* 3. ADMIN */}
                <button
                  type="button"
                  onClick={() => handleRoleSelect('ADMIN')}
                  className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer flex flex-col justify-between ${
                    selectedRole === 'ADMIN'
                      ? 'bg-teal-950/80 border-teal-500 ring-2 ring-teal-500/30 shadow-lg'
                      : 'bg-slate-800/80 border-slate-700 hover:border-slate-500 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold">
                      <Shield className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-semibold">
                      ADMIN
                    </span>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Hospital Admin</div>
                    <div className="text-[11px] text-slate-300">Resource Control &amp; Schema</div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* STEP 2: Login Form & Instant 1-Click Access for Selected Role */}
          <div className="p-6 sm:p-9 space-y-6">
            
            {/* Error Banner */}
            {error && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold">Authentication Failed</div>
                  <div className="mt-0.5">{error}</div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Left Column: Form Fields */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    {selectedRole === 'PATIENT' && <HeartPulse className="w-4 h-4 text-rose-600" />}
                    {selectedRole === 'STAFF' && <Stethoscope className="w-4 h-4 text-blue-600" />}
                    {selectedRole === 'ADMIN' && <Shield className="w-4 h-4 text-teal-600" />}
                    <span>
                      {selectedRole === 'PATIENT' ? 'Patient Outpatient (OP) Login' : ''}
                      {selectedRole === 'STAFF' ? 'Clinical Staff Credentials Login' : ''}
                      {selectedRole === 'ADMIN' ? 'Hospital Administrator Login' : ''}
                    </span>
                  </h2>
                  <span className="text-xs font-mono font-semibold text-slate-500">
                    Step 2
                  </span>
                </div>

                <form onSubmit={handleFormLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      {selectedRole === 'PATIENT' ? 'Outpatient (OP) Number' : 'Staff Username / ID'}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        placeholder={selectedRole === 'PATIENT' ? 'e.g., OP202600123' : selectedRole === 'STAFF' ? 'e.g., dr_mitchell or nurse_charlotte' : 'e.g., admin'}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                      />
                      <span className="absolute right-3.5 top-3.5 text-xs font-mono text-slate-400 font-medium">
                        {selectedRole === 'PATIENT' ? 'OP-NO' : 'USER'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Security Password
                      </label>
                      <span className="text-[11px] text-teal-600 font-medium">Encrypted Session</span>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-sm rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying &amp; Authorizing Session...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Sign In as {selectedRole === 'PATIENT' ? 'Patient' : selectedRole === 'STAFF' ? 'Staff' : 'Admin'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Instant 1-Click Fast Logins for Testing */}
              <div className="md:col-span-5 bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                    <span>Instant 1-Click Access</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Click any persona below to authenticate instantly and unlock the hospital portal.
                  </p>

                  {/* Role Specific 1-Click Buttons */}
                  {selectedRole === 'ADMIN' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleInstantLogin('ADMIN')}
                        disabled={loading}
                        className="w-full p-2.5 rounded-xl bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 transition-all text-left flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-teal-700">
                            Login as Hospital Administrator
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">Username: admin • Hospital@2026</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 group-hover:translate-x-0.5 transition-all" />
                      </button>
                    </div>
                  )}

                  {selectedRole === 'STAFF' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleInstantLogin('DOCTOR')}
                        disabled={loading}
                        className="w-full p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all text-left flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                            Dr. Sarah Mitchell (Trauma Lead)
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">Username: dr_mitchell</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInstantLogin('NURSE')}
                        disabled={loading}
                        className="w-full p-2 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 transition-all text-left flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-blue-700">
                            Nurse Charlotte Hayes (ICU Supervisor)
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">Username: nurse_charlotte</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleInstantLogin('RECEPTIONIST')}
                        disabled={loading}
                        className="w-full p-2 rounded-xl bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 transition-all text-left flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700">
                            Front Desk Receptionist
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">Username: reception</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600" />
                      </button>
                    </div>
                  )}

                  {selectedRole === 'PATIENT' && (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => handleInstantLogin('PATIENT')}
                        disabled={loading}
                        className="w-full p-2.5 rounded-xl bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-all text-left flex items-center justify-between cursor-pointer group shadow-2xs"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 group-hover:text-rose-700">
                            Eleanor Vance (OP202600123)
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">OP Number: OP202600123 • Patient@123</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600" />
                      </button>

                      <div className="text-[10px] text-slate-500 bg-white/70 p-2 rounded-lg border border-slate-200/80">
                        Patients can view clinical records, booked appointments, active prescriptions, and discharge summaries.
                      </div>
                    </div>
                  )}
                </div>

                {/* Local MySQL Schema Notice */}
                <div className="mt-4 pt-3 border-t border-slate-200/80 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-slate-800">
                    <Database className="w-3.5 h-3.5 text-teal-600" />
                    <span>Local Database Credentials:</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">
                    Host: localhost:3306 • DB: smart_hospital
                  </div>
                  <div className="font-mono text-[10px] text-slate-500">
                    User: root • Pass: bitsathy
                  </div>
                </div>
              </div>

            </div>

          </div>

          {/* Bottom Security Footer */}
          <div className="bg-slate-50 px-6 sm:px-9 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-teal-600" />
              <span>Strict Access Control: Hospital data is inaccessible without authorization.</span>
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              Run local setup: <code className="text-teal-700 bg-teal-50 px-1 py-0.5 rounded">npm run setup:mysql</code>
            </span>
          </div>

        </div>
      </main>

      {/* Website Footer */}
      <footer className="w-full bg-slate-950 border-t border-slate-800 py-3 text-xs text-slate-400 text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 AURA Smart Hospital System. Enterprise Healthcare Management.</span>
          <span className="font-mono text-[11px]">Database: MySQL 8.0 DDL &amp; SQLite Live Fallback</span>
        </div>
      </footer>
    </div>
  );
};
