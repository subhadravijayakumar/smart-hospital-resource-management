import React, { useState, useEffect } from 'react';
import { AuditLog } from '../types.ts';
import { api } from '../services/api.ts';
import { ShieldCheck, Download, Search, Filter, RotateCcw } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [moduleFilter, setModuleFilter] = useState('');
  const [search, setSearch] = useState('');

  async function loadLogs() {
    try {
      setLoading(true);
      const res = await api.getAuditLogs(moduleFilter || undefined);
      setLogs(res.logs);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLogs();
  }, [moduleFilter]);

  const filteredLogs = logs.filter(l => {
    if (search) {
      const q = search.toLowerCase();
      return (
        l.username.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.module.toLowerCase().includes(q) ||
        (l.details && l.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Username', 'Role', 'Action', 'Module', 'Record ID', 'Details'];
    const rows = filteredLogs.map(l => [
      l.id,
      `"${l.created_at}"`,
      `"${l.username}"`,
      `"${l.role}"`,
      `"${l.action}"`,
      `"${l.module}"`,
      `"${l.record_id || ''}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hospital_audit_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <span>Hospital Security &amp; Clinical Audit Logs</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable tracking of clinical triage decisions, bed assignments, medication dispensations, and authentication events.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
        >
          <Download className="w-4 h-4 text-slate-600" />
          <span>Export Audit Trail (CSV)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search action, username, or log details..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-xs border-none focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={moduleFilter}
            onChange={e => setModuleFilter(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500 bg-white"
          >
            <option value="">All Modules</option>
            <option value="AUTH">AUTH</option>
            <option value="BED_MANAGEMENT">BED_MANAGEMENT</option>
            <option value="EMERGENCY">EMERGENCY</option>
            <option value="PATIENT">PATIENT</option>
            <option value="SHIFTS">SHIFTS</option>
            <option value="INVENTORY">INVENTORY</option>
          </select>

          <button
            onClick={loadLogs}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            title="Refresh logs"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">User &amp; Role</th>
                <th className="px-4 py-3.5">Action</th>
                <th className="px-4 py-3.5">Module</th>
                <th className="px-5 py-3.5">Audit Event Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                    {l.created_at}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-semibold text-slate-900">{l.username}</span>
                    <span className="text-slate-400 text-[10px] ml-1.5">[{l.role}]</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-teal-800">
                    {l.action}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {l.module}
                  </td>
                  <td className="px-5 py-3 font-sans text-xs text-slate-700">
                    {l.details}
                  </td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-400 text-xs">
                    No audit records found matching current query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
