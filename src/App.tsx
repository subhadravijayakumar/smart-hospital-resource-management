import React, { useState, useEffect, useCallback } from 'react';
import { User, UserRole, DashboardStats, Bed, EmergencyCase, InventoryItem, NotificationItem, Patient, Doctor, Department } from './types.ts';
import { api, setStoredToken, getStoredToken } from './services/api.ts';
import { Navbar } from './components/Navbar.tsx';
import { LoginPage } from './views/LoginPage.tsx';
import { GreedyBedAllocationModal } from './components/GreedyBedAllocationModal.tsx';
import { EmergencyRegisterModal } from './components/EmergencyRegisterModal.tsx';
import { AppointmentModal } from './components/AppointmentModal.tsx';
import { RegisterPatientModal } from './components/RegisterPatientModal.tsx';
import { ShiftOptimizerModal } from './components/ShiftOptimizerModal.tsx';
import { InventoryActionModal } from './components/InventoryActionModal.tsx';
import { LoginModal } from './components/LoginModal.tsx';

// Views
import { AdminOverview } from './views/AdminOverview.tsx';
import { BedsManagementView } from './views/BedsManagementView.tsx';
import { EmergencyTriageView } from './views/EmergencyTriageView.tsx';
import { PatientsListView } from './views/PatientsListView.tsx';
import { AppointmentsView } from './views/AppointmentsView.tsx';
import { ShiftsManagementView } from './views/ShiftsManagementView.tsx';
import { EquipmentView } from './views/EquipmentView.tsx';
import { InventoryView } from './views/InventoryView.tsx';
import { MLAnalyticsView } from './views/MLAnalyticsView.tsx';
import { FacilitiesView } from './views/FacilitiesView.tsx';
import { AuditLogsView } from './views/AuditLogsView.tsx';
import { DatabaseSchemaView } from './views/DatabaseSchemaView.tsx';
import { PatientPortal } from './views/PatientPortal.tsx';
import { DoctorPortal } from './views/DoctorPortal.tsx';
import { NursePortal } from './views/NursePortal.tsx';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState<string>('admin_overview');

  // Core Data States
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [emergencies, setEmergencies] = useState<EmergencyCase[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [nurses, setNurses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [analyticsCharts, setAnalyticsCharts] = useState<any>(null);

  // Modals
  const [showGreedyModal, setShowGreedyModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [showPatientModal, setShowPatientModal] = useState(false);
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryModalMode, setInventoryModalMode] = useState<'RESTOCK' | 'CONSUME'>('RESTOCK');
  const [selectedInventoryItemId, setSelectedInventoryItemId] = useState<number | undefined>(undefined);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Synchronize All Hospital Telemetry
  const loadHospitalData = useCallback(async () => {
    try {
      const [
        statsRes,
        bedsRes,
        emergRes,
        invRes,
        eqRes,
        patientsRes,
        docRes,
        nurseRes,
        deptRes,
        apptRes,
        notifRes,
        chartsRes
      ] = await Promise.all([
        api.getDashboardStats().catch(() => null),
        api.getBeds().catch(() => ({ beds: [] })),
        api.getEmergencyQueue().catch(() => ({ queue: [] })),
        api.getInventory().catch(() => ({ inventory: [] })),
        api.getEquipment().catch(() => ({ equipment: [] })),
        api.getPatients().catch(() => ({ patients: [] })),
        api.getDoctors().catch(() => ({ doctors: [] })),
        api.getNurses().catch(() => ({ nurses: [] })),
        api.getDepartments().catch(() => ({ departments: [] })),
        api.getAppointments().catch(() => ({ appointments: [] })),
        api.getNotifications().catch(() => ({ notifications: [] })),
        api.getAnalyticsCharts().catch(() => null)
      ]);

      if (statsRes) setStats(statsRes);
      setBeds(bedsRes.beds || []);
      setEmergencies(emergRes.queue || []);
      setInventory(invRes.inventory || []);
      setEquipmentList(eqRes.equipment || []);
      setPatients(patientsRes.patients || []);
      setDoctors(docRes.doctors || []);
      setNurses(nurseRes.nurses || []);
      setDepartments(deptRes.departments || []);
      setAppointments(apptRes.appointments || []);
      setNotifications(notifRes.notifications || []);
      if (chartsRes) setAnalyticsCharts(chartsRes);
    } catch (err) {
      console.error('Error synchronizing hospital telemetry:', err);
    }
  }, []);

  // Initialize session: Strictly require login first on page load
  useEffect(() => {
    // Clear any previous residual token so user starts cleanly on Login Page
    setStoredToken(null);
    setCurrentUser(null);
  }, []);

  // Periodic telemetry polling ONLY when authenticated
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(loadHospitalData, 15000);
    return () => clearInterval(interval);
  }, [currentUser, loadHospitalData]);

  const adaptViewForRole = (role: UserRole) => {
    if (role === 'PATIENT') setActiveView('patient_portal');
    else if (role === 'DOCTOR') setActiveView('doctor_portal');
    else if (role === 'NURSE') setActiveView('nurse_portal');
    else setActiveView('admin_overview');
  };

  const handleQuickSwitch = async (role: UserRole) => {
    try {
      const res = await api.quickSwitchRole(role);
      setStoredToken(res.token);
      setCurrentUser(res.user);
      adaptViewForRole(res.user.role);
      loadHospitalData();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleLogout = () => {
    setStoredToken(null);
    setCurrentUser(null);
    setShowLoginModal(false);
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    adaptViewForRole(user.role);
    loadHospitalData();
  };

  const handleMarkNotificationRead = async (id: number) => {
    try {
      await api.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, is_read: true } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const openRestock = (itemId?: number) => {
    setInventoryModalMode('RESTOCK');
    setSelectedInventoryItemId(itemId);
    setShowInventoryModal(true);
  };

  const openConsume = (itemId?: number) => {
    setInventoryModalMode('CONSUME');
    setSelectedInventoryItemId(itemId);
    setShowInventoryModal(true);
  };

  // 1. FIRST SCREEN: Require login first before visualizing hospital telemetry or dashboards
  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. AUTHENTICATED SCREEN: Full desktop website layout with top navigation (no sidebar)
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans antialiased">
      {/* Website Top Bar & Horizontal Menu Navigation */}
      <Navbar
        currentUser={currentUser}
        activeView={activeView}
        onSelectView={setActiveView}
        notifications={notifications}
        onQuickSwitch={handleQuickSwitch}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginModal(true)}
        onMarkNotificationRead={handleMarkNotificationRead}
        pendingEmergencyCount={emergencies.length}
        lowStockCount={inventory.filter(i => i.quantity <= i.minimum_stock).length}
      />

      {/* Main Website Viewport (Full Widescreen Desktop Layout) */}
      <div className="flex-1 overflow-y-auto">
        <main className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeView === 'admin_overview' && (
            <AdminOverview
              stats={stats}
              beds={beds}
              emergencies={emergencies}
              inventory={inventory}
              analyticsCharts={analyticsCharts}
              onOpenGreedyAllocation={() => setShowGreedyModal(true)}
              onOpenEmergencyModal={() => setShowEmergencyModal(true)}
              onOpenShiftOptimizer={() => setShowShiftModal(true)}
              onOpenRestock={() => openRestock()}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'beds' && (
            <BedsManagementView
              beds={beds}
              onRefresh={loadHospitalData}
              onOpenGreedyAllocation={() => setShowGreedyModal(true)}
            />
          )}

          {activeView === 'emergency' && (
            <EmergencyTriageView
              queue={emergencies}
              doctors={doctors}
              nurses={nurses}
              beds={beds}
              onRefresh={loadHospitalData}
              onOpenEmergencyModal={() => setShowEmergencyModal(true)}
            />
          )}

          {activeView === 'patients' && (
            <PatientsListView
              patients={patients}
              onRefresh={loadHospitalData}
              onOpenRegisterModal={() => setShowPatientModal(true)}
              onOpenGreedyAllocation={() => setShowGreedyModal(true)}
            />
          )}

          {(activeView === 'appointments' || activeView === 'doctors') && (
            <AppointmentsView
              appointments={appointments}
              onRefresh={loadHospitalData}
              onOpenBookModal={() => setShowAppointmentModal(true)}
            />
          )}

          {activeView === 'shifts' && (
            <ShiftsManagementView
              onOpenOptimizerModal={() => setShowShiftModal(true)}
            />
          )}

          {activeView === 'equipment' && (
            <EquipmentView
              equipment={equipmentList}
              onRefresh={loadHospitalData}
            />
          )}

          {activeView === 'inventory' && (
            <InventoryView
              inventory={inventory}
              onRefresh={loadHospitalData}
              onOpenRestock={openRestock}
              onOpenConsume={openConsume}
            />
          )}

          {activeView === 'analytics' && (
            <MLAnalyticsView />
          )}

          {activeView === 'facilities' && (
            <FacilitiesView />
          )}

          {activeView === 'audit_logs' && (
            <AuditLogsView />
          )}

          {activeView === 'database_schema' && (
            <DatabaseSchemaView />
          )}

          {activeView === 'patient_portal' && (
            <PatientPortal
              currentUser={currentUser}
              onOpenAppointmentModal={() => setShowAppointmentModal(true)}
              onNavigate={setActiveView}
            />
          )}

          {activeView === 'doctor_portal' && (
            <DoctorPortal
              currentUser={currentUser}
              onRefreshAll={loadHospitalData}
            />
          )}

          {activeView === 'nurse_portal' && (
            <NursePortal
              currentUser={currentUser}
              onRefreshAll={loadHospitalData}
            />
          )}
        </main>
      </div>

      {/* Interactive Modals */}
      <GreedyBedAllocationModal
        isOpen={showGreedyModal}
        onClose={() => setShowGreedyModal(false)}
        patients={patients}
        departments={departments}
        onSuccess={loadHospitalData}
      />

      <EmergencyRegisterModal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onSuccess={loadHospitalData}
      />

      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => setShowAppointmentModal(false)}
        doctors={doctors}
        patients={patients}
        currentPatientId={currentUser?.patient_id}
        onSuccess={loadHospitalData}
      />

      <RegisterPatientModal
        isOpen={showPatientModal}
        onClose={() => setShowPatientModal(false)}
        departments={departments}
        doctors={doctors}
        onSuccess={loadHospitalData}
      />

      <ShiftOptimizerModal
        isOpen={showShiftModal}
        onClose={() => setShowShiftModal(false)}
        onSuccess={loadHospitalData}
      />

      <InventoryActionModal
        isOpen={showInventoryModal}
        onClose={() => setShowInventoryModal(false)}
        items={inventory}
        defaultItemId={selectedInventoryItemId}
        mode={inventoryModalMode}
        onSuccess={loadHospitalData}
      />

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
