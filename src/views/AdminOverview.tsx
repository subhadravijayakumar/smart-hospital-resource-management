import React from 'react';
import { DashboardStats, Bed, EmergencyCase, InventoryItem } from '../types.ts';
import {
  BedDouble,
  Users,
  Siren,
  Package,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Cpu,
  ChevronRight,
  Database
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AdminOverviewProps {
  stats: DashboardStats | null;
  beds: Bed[];
  emergencies: EmergencyCase[];
  inventory: InventoryItem[];
  analyticsCharts: {
    deptOccupancy: Array<{ name: string; total_beds: number; occupied_beds: number; available_beds: number }>;
    emergencySeverity: Array<{ severity: string; count: number }>;
    historicalFlow: Array<{ record_date: string; admissions_count: number; discharges_count: number; emergency_cases_count: number; icu_occupied_count: number }>;
  } | null;
  onOpenGreedyAllocation: () => void;
  onOpenEmergencyModal: () => void;
  onOpenShiftOptimizer: () => void;
  onOpenRestock: () => void;
  onNavigate: (view: string) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  stats,
  emergencies,
  analyticsCharts,
  onOpenGreedyAllocation,
  onOpenEmergencyModal,
  onOpenShiftOptimizer,
  onOpenRestock,
  onNavigate
}) => {
  if (!stats) {
    return (
      <div className="p-8 text-center text-xs text-slate-500">
        Loading hospital operational telemetry...
      </div>
    );
  }

  // Chart 1: Bed Occupancy by Department
  const deptLabels = analyticsCharts?.deptOccupancy?.map(d => d.name.replace('Department', '').trim()) || ['ICU', 'Emergency', 'Cardiology', 'General'];
  const deptOccupied = analyticsCharts?.deptOccupancy?.map(d => d.occupied_beds) || [17, 8, 12, 22];
  const deptAvailable = analyticsCharts?.deptOccupancy?.map(d => d.available_beds) || [3, 22, 13, 18];

  const deptChartData = {
    labels: deptLabels,
    datasets: [
      {
        label: 'Occupied Beds',
        data: deptOccupied,
        backgroundColor: '#0d9488', // teal-600
        borderRadius: 4
      },
      {
        label: 'Available Beds',
        data: deptAvailable,
        backgroundColor: '#cbd5e1', // slate-300
        borderRadius: 4
      }
    ]
  };

  // Chart 2: 7-Day Inpatient Flow Trends
  const flowDates = analyticsCharts?.historicalFlow?.map(f => f.record_date.slice(5)) || ['10-02', '10-03', '10-04', '10-05', '10-06', '10-07', '10-08'];
  const admissionsData = analyticsCharts?.historicalFlow?.map(f => f.admissions_count) || [24, 28, 32, 20, 16, 30, 27];
  const dischargesData = analyticsCharts?.historicalFlow?.map(f => f.discharges_count) || [21, 24, 26, 18, 14, 26, 25];

  const flowChartData = {
    labels: flowDates,
    datasets: [
      {
        label: 'Admissions',
        data: admissionsData,
        borderColor: '#0f766e',
        backgroundColor: 'rgba(15, 118, 110, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: 'Discharges',
        data: dischargesData,
        borderColor: '#64748b',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.3
      }
    ]
  };

  // Chart 3: Bed Status Distribution Doughnut
  const bedDoughnutData = {
    labels: ['Occupied', 'Available', 'Cleaning', 'Maintenance'],
    datasets: [
      {
        data: [stats.beds.occupied, stats.beds.available, stats.beds.cleaning, stats.beds.maintenance],
        backgroundColor: ['#0d9488', '#10b981', '#f59e0b', '#ef4444'],
        borderWidth: 0
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action Center */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            Hospital Resource Operations &amp; Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time heuristic optimization, algorithmic bed placement, and priority emergency triage.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenGreedyAllocation}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            Greedy Bed Allocation
          </button>
          <button
            onClick={onOpenEmergencyModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Siren className="w-4 h-4" />
            Dispatch Emergency Code
          </button>
          <button
            onClick={onOpenShiftOptimizer}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4 text-slate-600" />
            Auto-Schedule Shifts
          </button>
          <button
            onClick={onOpenRestock}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Package className="w-4 h-4 text-slate-600" />
            Restock Inventory
          </button>
          <button
            onClick={() => onNavigate('database_schema')}
            className="px-3.5 py-2 text-xs font-semibold text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Database className="w-4 h-4 text-teal-600" />
            Database &amp; Schema
          </button>
        </div>
      </div>

      {/* 4 Core Key Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Bed Capacity */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Hospital Bed Occupancy</span>
            <BedDouble className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.beds.occupancy_rate}%
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {stats.beds.occupied} / {stats.beds.total} beds
            </span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>ICU Critical Census:</span>
            <span className="font-mono font-semibold text-amber-700">
              {stats.beds.icu.occupied}/{stats.beds.icu.total} ({stats.beds.icu.occupancy_rate}%)
            </span>
          </div>
        </div>

        {/* Card 2: Emergency Priority Queue */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Emergency Priority Queue</span>
            <Siren className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-600 tabular-nums">
              {stats.operations.pending_emergencies}
            </span>
            <span className="text-xs text-slate-500">active triage cases</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Sorting Algorithm:</span>
            <span className="font-mono text-teal-700 font-semibold">PriorityQueue (ESI + Aging)</span>
          </div>
        </div>

        {/* Card 3: Clinical Staff Active */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Physicians &amp; Nurses on Duty</span>
            <Users className="w-4 h-4 text-teal-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.staff.doctors_available + stats.staff.nurses_on_duty}
            </span>
            <span className="text-xs text-slate-500">active staff</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Doctors: {stats.staff.doctors_available}</span>
            <span>Nurses: {stats.staff.nurses_on_duty}</span>
            <span className="text-amber-600 font-mono">{stats.staff.pending_leaves} leaves</span>
          </div>
        </div>

        {/* Card 4: Inventory & Equipment Safety */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-2 font-medium">
            <span>Medical Consumables</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-bold font-mono tabular-nums ${stats.operations.low_stock_alerts > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
              {stats.operations.low_stock_alerts}
            </span>
            <span className="text-xs text-slate-500">low stock items</span>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600">
            <span>Equip. In Service: {stats.operations.equipment_available}</span>
            <span className="font-mono text-slate-500">Maint: {stats.operations.equipment_maintenance}</span>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Department Bed Breakdown */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Ward &amp; Department Bed Utilization</h2>
              <p className="text-xs text-slate-500">Occupied vs available capacity across clinical units</p>
            </div>
            <button
              onClick={() => onNavigate('beds')}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <span>Manage Beds</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64">
            <Bar
              data={deptChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { stacked: true, grid: { display: false } },
                  y: { stacked: true, beginAtZero: true, grid: { color: '#f1f5f9' } }
                },
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Right: Bed Status Breakdown Doughnut */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Bed Operational Status</h2>
            <p className="text-xs text-slate-500">Real-time status across hospital inventory</p>
          </div>
          <div className="h-52 relative flex items-center justify-center my-auto">
            <Doughnut
              data={bedDoughnutData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
                plugins: { legend: { display: false } }
              }}
            />
            <div className="absolute text-center">
              <span className="text-2xl font-bold font-mono text-slate-900">{stats.beds.total}</span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase">Total Beds</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 text-[11px] font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600 shrink-0" />
              <span className="text-slate-600">Occupied: {stats.beds.occupied}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-slate-600">Available: {stats.beds.available}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span className="text-slate-600">Cleaning: {stats.beds.cleaning}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span className="text-slate-600">Maintenance: {stats.beds.maintenance}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Inpatient Flow Trend Chart & Active Emergency Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: 7-Day Inpatient Trend */}
        <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">7-Day Admission &amp; Discharge Velocity</h2>
              <p className="text-xs text-slate-500">Historical admission census vs completed discharges</p>
            </div>
            <button
              onClick={() => onNavigate('analytics')}
              className="text-xs text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <span>AI/ML Predictions</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-60">
            <Line
              data={flowChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: false, grid: { color: '#f1f5f9' } }
                },
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Right: Emergency Queue Snapshot */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Live Triage Priority</h2>
              <p className="text-xs text-slate-500">Highest priority cases in ED</p>
            </div>
            <button
              onClick={() => onNavigate('emergency')}
              className="text-xs text-rose-600 hover:text-rose-700 font-medium"
            >
              View All ({emergencies.length})
            </button>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto">
            {emergencies.slice(0, 3).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 truncate">
                    {item.patient_name}
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    item.severity.startsWith('CRITICAL')
                      ? 'bg-rose-100 text-rose-800'
                      : item.severity.startsWith('EMERGENT')
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    ESI {item.triage_score}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 line-clamp-1">{item.emergency_type}</p>
                <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>Priority Score: {item.calculated_priority || 850}</span>
                  <span>Target: {item.required_bed_type}</span>
                </div>
              </div>
            ))}

            {emergencies.length === 0 && (
              <div className="text-center py-8 text-xs text-slate-400">
                No pending emergency cases in queue.
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 mt-2">
            <button
              onClick={onOpenEmergencyModal}
              className="w-full py-2 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors border border-rose-200"
            >
              + Register Inbound Emergency
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
