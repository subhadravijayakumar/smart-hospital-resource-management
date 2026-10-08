import React, { useState } from 'react';
import { Department, Doctor } from '../types.ts';
import { api } from '../services/api.ts';
import { X, UserPlus, AlertCircle } from 'lucide-react';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: Department[];
  doctors: Doctor[];
  onSuccess: () => void;
}

export const RegisterPatientModal: React.FC<RegisterPatientModalProps> = ({
  isOpen,
  onClose,
  departments,
  doctors,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [age, setAge] = useState(35);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [phone, setPhone] = useState('+1 555-01');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [severity, setSeverity] = useState<'EMERGENCY' | 'CRITICAL' | 'HIGH' | 'NORMAL'>('NORMAL');
  const [departmentId, setDepartmentId] = useState<number | ''>(4);
  const [doctorId, setDoctorId] = useState<number | ''>('');
  const [triageNotes, setTriageNotes] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !emergencyContact) {
      setError('Please fill in patient name, phone number, and emergency contact.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.registerPatient({
        name,
        age: Number(age),
        gender,
        blood_group: bloodGroup,
        phone,
        email: email || undefined,
        address: address || undefined,
        emergency_contact: emergencyContact,
        severity,
        assigned_department_id: departmentId ? Number(departmentId) : undefined,
        assigned_doctor_id: doctorId ? Number(doctorId) : undefined,
        triage_notes: triageNotes || undefined
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <UserPlus className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">New Patient Registration</h3>
              <p className="text-xs text-slate-500">Generates unique OP Number and patient portal credentials</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Full Legal Name"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Primary Phone Number *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="+1 555-0123"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Age *
              </label>
              <input
                type="number"
                required
                min={0}
                max={120}
                value={age}
                onChange={e => setAge(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gender *
              </label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Blood Group *
              </label>
              <select
                value={bloodGroup}
                onChange={e => setBloodGroup(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Contact Details *
              </label>
              <input
                type="text"
                required
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                placeholder="Name (Relation) - Phone"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="patient@example.com"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Acuity Severity
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value as any)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="NORMAL">NORMAL (Outpatient / Elective)</option>
                <option value="HIGH">HIGH (Immediate Observation)</option>
                <option value="CRITICAL">CRITICAL (ICU Admission Required)</option>
                <option value="EMERGENCY">EMERGENCY (Trauma Bay)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Initial Department
              </label>
              <select
                value={departmentId}
                onChange={e => setDepartmentId(e.target.value ? Number(e.target.value) : '')}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Residential Address
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="Street address, City"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              className="px-5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              {isSubmitting ? 'Registering...' : 'Register Patient & Generate OP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
