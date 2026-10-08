import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { Patient, Appointment, Prescription, MedicalReport } from '../../types.ts';
import {
  CalendarCheck2,
  BedDouble,
  FileText,
  Pill,
  Siren,
  Stethoscope,
  ChevronRight,
  Clock,
  Phone,
  AlertCircle,
  Building2,
  Calendar
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [patRes, apptRes, rxRes, repRes] = await Promise.all([
          api.getPatients(),
          api.getAppointments(),
          api.getPrescriptions(),
          api.getMedicalReports()
        ]);
        if (patRes.patients.length > 0) setPatient(patRes.patients[0]);
        setAppointments(apptRes.appointments);
        setPrescriptions(rxRes.prescriptions);
        setReports(repRes.reports);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading personalized health dashboard...</div>;
  }

  const pData = patient || {
    id: 1,
    op_number: currentUser?.op_number || 'OP202600123',
    name: currentUser?.full_name || 'Eleanor Vance',
    age: 41,
    gender: 'Female',
    blood_group: 'O+',
    phone: '+1 555-0199',
    admission_status: 'ADMITTED',
    department_name: 'Intensive Care Unit (ICU)',
    doctor_name: 'Dr. Robert Chen',
    bed_number: 'ICU-201',
    ward: 'Critical Care Ward',
    emergency_contact: 'James Vance (Spouse) - +1 555-0190'
  } as Patient;

  const nextAppt = appointments[0];
  const latestReport = reports[0];
  const activeRx = prescriptions[0];

  return (
    <div className="space-y-6">
      {/* Header Profile Greeting Banner */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-xs shrink-0">
            {pData.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Good morning, {pData.name}
              </h1>
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                {pData.op_number}
              </span>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                pData.admission_status === 'ADMITTED'
                  ? 'bg-amber-100 text-amber-800'
                  : 'bg-emerald-100 text-emerald-800'
              }`}>
                {pData.admission_status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3 font-mono">
              <span>Dept: {pData.department_name || 'General Medicine'}</span>
              <span>·</span>
              <span>Attending: {pData.doctor_name || 'Dr. Robert Chen'}</span>
              <span>·</span>
              <span>Emergency: {pData.emergency_contact}</span>
            </p>
          </div>
        </div>

        <Link
          to="/patient/appointments/book"
          className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition-colors shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <CalendarCheck2 className="w-4 h-4" />
          <span>Book Doctor Consultation</span>
        </Link>
      </div>

      {/* Main 5 Connected Clickable Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Upcoming Appointment */}
        <div
          onClick={() => navigate('/patient/appointments')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Next Appointment</span>
            <CalendarCheck2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="my-1">
            <div className="text-sm font-bold text-slate-900 truncate">
              {nextAppt ? nextAppt.doctor_name : 'No Bookings'}
            </div>
            <div className="text-xs text-teal-700 font-mono font-semibold">
              {nextAppt ? nextAppt.appointment_date : 'Schedule appointment'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>View Schedule</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 2: Current Bed */}
        <div
          onClick={() => navigate('/patient/bed')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>My Bed Status</span>
            <BedDouble className="w-4 h-4 text-teal-600" />
          </div>
          <div className="my-1">
            <div className="text-lg font-bold font-mono text-slate-900">
              {pData.bed_number || 'Outpatient'}
            </div>
            <div className="text-xs text-slate-500 truncate">
              {pData.ward || 'Day Care'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Room Details</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Latest Medical Report */}
        <div
          onClick={() => navigate('/patient/medical-reports')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Latest Report</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="my-1">
            <div className="text-xs font-bold text-slate-900 truncate">
              {latestReport ? latestReport.title : 'Diagnostic Lab'}
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {latestReport ? latestReport.report_date : 'Up to date'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>View Diagnostics</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 4: Active Prescription */}
        <div
          onClick={() => navigate('/patient/prescriptions')}
          className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-teal-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Prescription</span>
            <Pill className="w-4 h-4 text-teal-600" />
          </div>
          <div className="my-1">
            <div className="text-lg font-bold font-mono text-slate-900">
              {prescriptions.length} Active
            </div>
            <div className="text-xs text-slate-500">
              {activeRx ? `${activeRx.duration_days} Days Regimen` : 'No active drugs'}
            </div>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-2 border-t border-slate-100">
            <span>Dosage Timing</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 5: Emergency Help */}
        <div
          onClick={() => navigate('/patient/emergency')}
          className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200 shadow-xs hover:bg-rose-50 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs text-rose-700 mb-2 font-medium">
            <span>Emergency Help</span>
            <Siren className="w-4 h-4 text-rose-600 animate-pulse" />
          </div>
          <div className="my-1">
            <div className="text-sm font-bold text-rose-800 flex items-center gap-1.5 font-mono">
              <Phone className="w-3.5 h-3.5" />
              <span>+1 555-0911</span>
            </div>
            <div className="text-[11px] text-rose-600">24/7 Trauma Code</div>
          </div>
          <div className="text-[11px] text-rose-700 font-semibold flex items-center justify-between pt-2 border-t border-rose-200/60">
            <span>Emergency Help</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Appointments & Attending Doctor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Upcoming Appointments */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-teal-600" />
              <span>Upcoming Consultations</span>
            </div>
            <Link to="/patient/appointments" className="text-xs text-teal-600 hover:text-teal-700 font-medium">
              View All
            </Link>
          </div>

          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-slate-900">{a.doctor_name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {a.specialization} · {a.department_name}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">Reason: {a.reason}</div>
                </div>

                <div className="text-right font-mono">
                  <div className="text-xs font-bold text-slate-900">{a.appointment_date}</div>
                  <div className="text-[11px] text-teal-700 font-semibold">{a.time_slot}</div>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    {a.status}
                  </span>
                </div>
              </div>
            ))}

            {appointments.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                You have no upcoming consultations scheduled. Click "Book Doctor Consultation" above.
              </div>
            )}
          </div>
        </div>

        {/* Right: Attending Doctor Information & Hospital Facilities */}
        <div className="space-y-6">
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Stethoscope className="w-4 h-4 text-teal-600" />
              <span>Assigned Physician</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="font-bold text-slate-900 text-sm">{pData.doctor_name || 'Dr. Robert Chen'}</div>
              <div>Trauma &amp; Critical Care Specialist</div>
              <div className="text-[11px] text-slate-500">Qualifications: MD, FCCP (12 Years Experience)</div>
              <div className="pt-2 text-teal-700 font-mono text-[11px] font-semibold">
                Available for inpatient rounds 08:00 - 16:00
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <Link
                to="/patient/doctors"
                className="w-full py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Browse Hospital Specialists</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Hospital Facilities</span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Explore 24/7 emergency trauma bays, intensive care units, computerized robotic pharmacy, and modern diagnostic radiology.
            </p>
            <Link
              to="/patient/facilities"
              className="text-xs font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              <span>View Facilities Directory</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
