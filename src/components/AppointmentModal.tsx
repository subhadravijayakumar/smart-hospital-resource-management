import React, { useState } from 'react';
import { Doctor, Patient } from '../types.ts';
import { api } from '../services/api.ts';
import { X, CalendarCheck2, AlertCircle } from 'lucide-react';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  patients?: Patient[];
  currentPatientId?: number;
  onSuccess: () => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  doctors,
  patients = [],
  currentPatientId,
  onSuccess
}) => {
  const [selectedPatientId, setSelectedPatientId] = useState<number | ''>(currentPatientId || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | ''>('');
  const [date, setDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [timeSlot, setTimeSlot] = useState('10:00 AM - 10:30 AM');
  const [reason, setReason] = useState('Routine clinical consultation');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const availableSlots = [
    '09:00 AM - 09:30 AM',
    '09:30 AM - 10:00 AM',
    '10:00 AM - 10:30 AM',
    '10:30 AM - 11:00 AM',
    '11:00 AM - 11:30 AM',
    '11:30 AM - 12:00 PM',
    '02:00 PM - 02:30 PM',
    '02:30 PM - 03:00 PM',
    '03:00 PM - 03:30 PM',
    '03:30 PM - 04:00 PM'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId) {
      setError('Please select a doctor.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedDoc = doctors.find(d => d.id === Number(selectedDoctorId));
      await api.bookAppointment({
        patient_id: currentPatientId || (selectedPatientId ? Number(selectedPatientId) : undefined),
        doctor_id: Number(selectedDoctorId),
        department_id: selectedDoc?.department_id,
        appointment_date: date,
        time_slot: timeSlot,
        reason
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-teal-100 text-teal-700">
              <CalendarCheck2 className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Book Doctor Consultation</h3>
              <p className="text-xs text-slate-500">Live schedule validation & conflict protection</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!currentPatientId && patients.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Patient Record *
              </label>
              <select
                value={selectedPatientId}
                onChange={e => setSelectedPatientId(Number(e.target.value))}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                <option value="">-- Choose patient --</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.op_number})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Physician / Specialist *
            </label>
            <select
              value={selectedDoctorId}
              onChange={e => setSelectedDoctorId(Number(e.target.value))}
              required
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
            >
              <option value="">-- Choose doctor --</option>
              {doctors.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.specialization} ({d.department_name})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Appointment Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Available Time Slot *
              </label>
              <select
                value={timeSlot}
                onChange={e => setTimeSlot(e.target.value)}
                required
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
              >
                {availableSlots.map(slot => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Clinical Reason for Consultation
            </label>
            <input
              type="text"
              required
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Chest pain follow-up / Medication renewal"
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
              <CalendarCheck2 className="w-4 h-4" />
              {isSubmitting ? 'Confirming...' : 'Confirm Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
