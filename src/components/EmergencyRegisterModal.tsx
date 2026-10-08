import React, { useState } from 'react';
import { api } from '../services/api.ts';
import { X, Siren, AlertTriangle } from 'lucide-react';

interface EmergencyRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const EmergencyRegisterModal: React.FC<EmergencyRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [patientName, setPatientName] = useState('');
  const [emergencyType, setEmergencyType] = useState('Severe Chest Pain / Acute Coronary');
  const [severity, setSeverity] = useState('CRITICAL_1');
  const [requiredBedType, setRequiredBedType] = useState('ICU');
  const [triageNotes, setTriageNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await api.registerEmergency({
        patient_name: patientName,
        emergency_type: emergencyType,
        severity,
        required_bed_type: requiredBedType,
        triage_notes: triageNotes
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
        <div className="px-6 py-4 border-b border-rose-100 flex items-center justify-between bg-rose-50/70">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-rose-500 text-white animate-pulse">
              <Siren className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Emergency Intake Triage Dispatch</h3>
              <p className="text-xs text-rose-700">Immediate insertion into dynamic Priority Queue</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              placeholder="e.g. John Doe / Unidentified Trauma #4"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Emergency Condition / Presentation *
            </label>
            <input
              type="text"
              required
              value={emergencyType}
              onChange={e => setEmergencyType(e.target.value)}
              placeholder="e.g. Anaphylactic Shock / Traumatic Brain Injury"
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ESI Severity Index *
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="CRITICAL_1">Level 1 - Resuscitation (Immediate Life Threat)</option>
                <option value="EMERGENT_2">Level 2 - Emergent (High Risk / Confusion / Pain)</option>
                <option value="URGENT_3">Level 3 - Urgent (2+ Diagnostic Resources Needed)</option>
                <option value="LESS_URGENT_4">Level 4 - Less Urgent (1 Resource Needed)</option>
                <option value="NON_URGENT_5">Level 5 - Non-Urgent (Medication / Exam)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Bed Acuity
              </label>
              <select
                value={requiredBedType}
                onChange={e => setRequiredBedType(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="ICU">ICU Critical Care</option>
                <option value="EMERGENCY">Trauma Bay / ED Bed</option>
                <option value="GENERAL">General Observation</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Triage Notes & Vital Signs
            </label>
            <textarea
              rows={2}
              value={triageNotes}
              onChange={e => setTriageNotes(e.target.value)}
              placeholder="Vitals: BP, HR, SpO2, initial GCS score..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
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
              className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs flex items-center gap-2"
            >
              <Siren className="w-4 h-4" />
              {isSubmitting ? 'Registering...' : 'Dispatch Code to Priority Queue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
