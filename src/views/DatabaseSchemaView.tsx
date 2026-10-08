import React, { useState, useEffect } from 'react';
import {
  Database,
  Table as TableIcon,
  Terminal,
  Key,
  Network,
  Code2,
  RefreshCw,
  Play,
  Download,
  Copy,
  CheckCircle2,
  AlertTriangle,
  Server,
  Layers,
  ChevronRight,
  Search,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api.ts';
import {
  DatabaseStatus,
  TableSummary,
  TableRowsResponse,
  SqlExecutionResult,
  SchemaScripts
} from '../types.ts';

export const DatabaseSchemaView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tables' | 'sql' | 'credentials' | 'er' | 'ddl'>('tables');
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [tables, setTables] = useState<TableSummary[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('users');
  const [tableData, setTableData] = useState<TableRowsResponse | null>(null);
  const [tableSearch, setTableSearch] = useState('');
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isLoadingTables, setIsLoadingTables] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // SQL Console
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM beds WHERE status = \'AVAILABLE\' LIMIT 10;');
  const [sqlResult, setSqlResult] = useState<SqlExecutionResult | null>(null);
  const [isExecutingSql, setIsExecutingSql] = useState(false);

  // Connection testing
  const [testResult, setTestResult] = useState<any>(null);
  const [isTestingConn, setIsTestingConn] = useState(false);
  const [customHost, setCustomHost] = useState('');
  const [customPort, setCustomPort] = useState('3306');
  const [customDb, setCustomDb] = useState('smart_hospital');
  const [customUser, setCustomUser] = useState('root');
  const [customPassword, setCustomPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Scripts
  const [scripts, setScripts] = useState<SchemaScripts | null>(null);
  const [copiedDdl, setCopiedDdl] = useState(false);
  const [copiedData, setCopiedData] = useState(false);
  const [isReinitializing, setIsReinitializing] = useState(false);
  const [showReinitConfirm, setShowReinitConfirm] = useState(false);
  const [reinitMessage, setReinitMessage] = useState<string | null>(null);

  // Local System Schema Provisioning
  const [isApplyingLocalSchema, setIsApplyingLocalSchema] = useState(false);
  const [localSchemaResult, setLocalSchemaResult] = useState<any>(null);

  // Load Status and Tables
  const loadDatabaseStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await api.getDatabaseStatus();
      setStatus(res);
      if (res.mysqlCredentials) {
        setCustomHost(res.mysqlCredentials.host);
        setCustomPort(String(res.mysqlCredentials.port));
        setCustomDb(res.mysqlCredentials.database);
        setCustomUser(res.mysqlCredentials.username);
      }
    } catch (err) {
      console.error('Error fetching database status:', err);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const loadTables = async () => {
    setIsLoadingTables(true);
    try {
      const res = await api.getDatabaseTables();
      setTables(res.tables);
      if (res.tables.length > 0 && !selectedTable) {
        setSelectedTable(res.tables[0].name);
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    } finally {
      setIsLoadingTables(false);
    }
  };

  const loadTableData = async (tableName: string, page = 1) => {
    if (!tableName) return;
    setIsLoadingData(true);
    try {
      const res = await api.getTableRows(tableName, page, 25);
      setTableData(res);
    } catch (err) {
      console.error(`Error fetching data for ${tableName}:`, err);
    } finally {
      setIsLoadingData(false);
    }
  };

  const loadScripts = async () => {
    try {
      const res = await api.getDatabaseScripts();
      setScripts(res);
    } catch (err) {
      console.error('Error fetching schema scripts:', err);
    }
  };

  useEffect(() => {
    loadDatabaseStatus();
    loadTables();
    loadScripts();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableData(selectedTable, 1);
    }
  }, [selectedTable]);

  const handleTestConnection = async (useCustom = false) => {
    setIsTestingConn(true);
    setTestResult(null);
    try {
      const payload = useCustom ? {
        host: customHost,
        port: Number(customPort) || 3306,
        database: customDb,
        username: customUser,
        password: customPassword
      } : {};
      const res = await api.testDatabaseConnection(payload);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message
      });
    } finally {
      setIsTestingConn(false);
    }
  };

  const handleApplyLocalSchema = async () => {
    setIsApplyingLocalSchema(true);
    setLocalSchemaResult(null);
    try {
      const res = await api.applyLocalSchema({
        host: customHost || 'localhost',
        port: Number(customPort) || 3306,
        database: customDb || 'smart_hospital',
        username: customUser || 'root',
        password: customPassword || 'bitsathy'
      });
      setLocalSchemaResult(res);
      loadDatabaseStatus();
      loadTables();
    } catch (err: any) {
      setLocalSchemaResult({
        success: false,
        message: err.message,
        code: err.code
      });
    } finally {
      setIsApplyingLocalSchema(false);
    }
  };

  const handleExecuteSql = async () => {
    if (!sqlQuery.trim()) return;
    setIsExecutingSql(true);
    setSqlResult(null);
    try {
      const res = await api.executeSql(sqlQuery);
      setSqlResult(res);
      // If mutation, refresh tables and current view
      if (!res.isSelect && res.success) {
        loadTables();
        if (selectedTable) loadTableData(selectedTable, 1);
      }
    } catch (err: any) {
      setSqlResult({
        success: false,
        executionTimeMs: 0,
        error: err.message
      });
    } finally {
      setIsExecutingSql(false);
    }
  };

  const handleReinitialize = async () => {
    setIsReinitializing(true);
    setShowReinitConfirm(false);
    try {
      const res = await api.reinitializeDatabase();
      setReinitMessage(res.message);
      await loadDatabaseStatus();
      await loadTables();
      if (selectedTable) await loadTableData(selectedTable, 1);
      setTimeout(() => setReinitMessage(null), 6000);
    } catch (err: any) {
      alert(`Reinitialization error: ${err.message}`);
    } finally {
      setIsReinitializing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'ddl' | 'data') => {
    navigator.clipboard.writeText(text);
    if (type === 'ddl') {
      setCopiedDdl(true);
      setTimeout(() => setCopiedDdl(false), 2000);
    } else {
      setCopiedData(true);
      setTimeout(() => setCopiedData(false), 2000);
    }
  };

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const currentTableSummary = tables.find(t => t.name === selectedTable);
  const filteredTables = tables.filter(t => t.name.toLowerCase().includes(tableSearch.toLowerCase()));

  // Quick SQL templates
  const sqlTemplates = [
    { label: 'Available Beds', query: 'SELECT bed_number, ward, bed_type, floor_number, has_ventilator, has_oxygen_support FROM beds WHERE status = \'AVAILABLE\';' },
    { label: 'High Urgency Emergency Cases', query: 'SELECT case_number, patient_name, emergency_type, severity, triage_score, arrival_time FROM emergency_cases WHERE status = \'PENDING\' ORDER BY triage_score DESC;' },
    { label: 'Doctors & Assigned Inpatients', query: 'SELECT d.name as doctor_name, d.specialization, p.name as patient_name, p.op_number, p.admission_status, p.severity FROM patients p JOIN doctors d ON p.assigned_doctor_id = d.id WHERE p.admission_status = \'ADMITTED\';' },
    { label: 'Low Stock Inventory', query: 'SELECT item_name, sku_code, category, quantity, minimum_stock, unit, unit_price FROM inventory WHERE quantity <= minimum_stock ORDER BY quantity ASC;' },
    { label: 'Recent Audit Logs', query: 'SELECT username, role, action, module, record_id, details, created_at FROM audit_logs ORDER BY id DESC LIMIT 15;' }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-700">
              <Database className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Database & Schema Management</h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Relational Engine
                </span>
              </div>
              <p className="text-slate-600 text-sm mt-1">
                Live relational database with enforced Foreign Keys, ACID transactions, interactive SQL console, and MySQL 8.0 schema synchronization.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleApplyLocalSchema}
              disabled={isApplyingLocalSchema}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-sm transition cursor-pointer"
            >
              <Database className={`w-3.5 h-3.5 ${isApplyingLocalSchema ? 'animate-spin' : ''}`} />
              {isApplyingLocalSchema ? 'Creating Local Schema...' : 'Deploy to Local MySQL (3306)'}
            </button>

            <button
              onClick={() => handleTestConnection(false)}
              disabled={isTestingConn}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <Zap className={`w-3.5 h-3.5 text-amber-500 ${isTestingConn ? 'animate-spin' : ''}`} />
              {isTestingConn ? 'Testing MySQL...' : 'Test MySQL Conn'}
            </button>

            <button
              onClick={() => setShowReinitConfirm(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReinitializing ? 'animate-spin' : ''}`} />
              Re-init Schema
            </button>

            {scripts && (
              <button
                onClick={() => downloadFile('schema.sql', scripts.schemaSql)}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-900 text-white shadow-sm transition"
              >
                <Download className="w-3.5 h-3.5" />
                Export schema.sql
              </button>
            )}
          </div>
        </div>

        {/* Local Schema Result Banner */}
        {localSchemaResult && (
          <div className={`mt-4 p-4 rounded-xl border text-sm ${
            localSchemaResult.success
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-amber-50 border-amber-200 text-amber-900'
          }`}>
            <div className="flex items-start gap-3">
              {localSchemaResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 space-y-1.5">
                <div className="font-bold">
                  {localSchemaResult.success
                    ? 'Local Schema Deployed Successfully!'
                    : 'Target MySQL Connection Info'}
                </div>
                <div className="text-xs leading-relaxed">
                  {localSchemaResult.message}
                </div>
                {!localSchemaResult.success && (
                  <div className="mt-2 p-2.5 bg-white/80 rounded-lg border border-amber-200/80 font-mono text-[11px] text-slate-800 space-y-1">
                    <div className="font-sans font-semibold text-amber-800">To deploy directly into your local machine terminal:</div>
                    <div>1. Run automated setup: <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-bold">npm run setup:mysql</code></div>
                    <div>2. Or run standard MySQL command: <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-bold">mysql -u root -pbitsathy &lt; schema.sql</code></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Reinitialization notification message */}
        {reinitMessage && (
          <div className="mt-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{reinitMessage}</span>
          </div>
        )}

        {/* Quick Diagnostic Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Engine Mode</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-teal-600" />
              SQLite 3 + MySQL 8 Ready
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Full Relational Join & Integrity</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Tables in Schema</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-600" />
              {status?.activeEngine.totalTables || tables.length || 17} Registered Tables
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Normalized 3NF Architecture</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Total Records</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5 font-mono">
              <TableIcon className="w-4 h-4 text-violet-600" />
              {status?.activeEngine.totalRecords?.toLocaleString() || '1,200+'} Rows Loaded
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Seeded with realistic hospital data</div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/60">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">MySQL Config</div>
            <div className="text-sm font-bold text-slate-800 mt-0.5 flex items-center gap-1.5 font-mono">
              <Key className="w-4 h-4 text-amber-600" />
              {status?.mysqlCredentials.host || 'localhost'}:{status?.mysqlCredentials.port || 3306}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">DB: {status?.mysqlCredentials.database || 'smart_hospital'}</div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Re-init */}
      {showReinitConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-900">Re-initialize Database Schema?</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              This action will drop all tables and recreate the complete relational schema from scratch, repopulating all departments, doctors, nurses, beds, patients, and ML training sets.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowReinitConfirm(false)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleReinitialize}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              >
                Yes, Re-initialize
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'tables'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TableIcon className="w-4 h-4" />
          Schema & Tables Explorer
          <span className={`px-1.5 py-0.2 rounded-full text-xs ${activeTab === 'tables' ? 'bg-teal-700 text-white' : 'bg-slate-200 text-slate-700'}`}>
            {tables.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('sql')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'sql'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Interactive SQL Console
        </button>

        <button
          onClick={() => setActiveTab('credentials')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'credentials'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Key className="w-4 h-4" />
          Database Credentials & Status
        </button>

        <button
          onClick={() => setActiveTab('er')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'er'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Network className="w-4 h-4" />
          ER Relational Model
        </button>

        <button
          onClick={() => setActiveTab('ddl')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
            activeTab === 'ddl'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Code2 className="w-4 h-4" />
          MySQL 8 DDL & Seed Script
        </button>
      </div>

      {/* TAB 1: Tables & Schema Explorer */}
      {activeTab === 'tables' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Table List (Left 4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Database Tables</span>
              <span className="text-xs text-slate-400 font-mono">{tables.length} tables</span>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter tables..."
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
            </div>

            <div className="space-y-1 max-h-[620px] overflow-y-auto pr-1">
              {filteredTables.map(t => (
                <button
                  key={t.name}
                  onClick={() => setSelectedTable(t.name)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                    selectedTable === t.name
                      ? 'bg-teal-50 border border-teal-200 text-teal-900 font-bold'
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <TableIcon className={`w-3.5 h-3.5 shrink-0 ${selectedTable === t.name ? 'text-teal-600' : 'text-slate-400'}`} />
                    <span className="font-mono truncate">{t.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-600 font-mono shrink-0">
                    {t.rowCount} rows
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Table Details & Live Data (Right 8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {currentTableSummary && (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-slate-900 font-mono">
                        {currentTableSummary.name}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        {currentTableSummary.rowCount} Records
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSqlQuery(`SELECT * FROM ${currentTableSummary.name} LIMIT 25;`);
                        setActiveTab('sql');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      <Terminal className="w-3.5 h-3.5 text-teal-600" />
                      Query in Console
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {currentTableSummary.description}
                  </p>
                </div>

                {/* Schema Column Dictionary */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Column Definitions & Constraints ({currentTableSummary.columns.length})
                  </h3>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <div className="max-h-[220px] overflow-y-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                          <tr>
                            <th className="py-2 px-3 font-semibold">Column Name</th>
                            <th className="py-2 px-3 font-semibold">Type</th>
                            <th className="py-2 px-3 font-semibold">Nullable</th>
                            <th className="py-2 px-3 font-semibold">Key / Constraint</th>
                            <th className="py-2 px-3 font-semibold">Foreign Key Link</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                          {currentTableSummary.columns.map(col => (
                            <tr key={col.name} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-bold text-slate-900">
                                {col.name}
                              </td>
                              <td className="py-2 px-3 text-blue-600">
                                {col.type}
                              </td>
                              <td className="py-2 px-3">
                                {col.nullable ? (
                                  <span className="text-slate-400">YES</span>
                                ) : (
                                  <span className="text-rose-600 font-semibold">NOT NULL</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {col.isPrimaryKey ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold inline-flex items-center gap-1">
                                    <Key className="w-2.5 h-2.5" /> PRIMARY KEY
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                {col.foreignKey ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium inline-flex items-center gap-1">
                                    <ArrowRight className="w-2.5 h-2.5 text-indigo-500" />
                                    {col.foreignKey.table}.{col.foreignKey.toColumn}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Live Rows Preview */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Live Data Preview ({tableData?.total || 0} Total Rows)
                    </h3>
                    <button
                      onClick={() => loadTableData(selectedTable, 1)}
                      className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" /> Refresh Rows
                    </button>
                  </div>

                  {isLoadingData ? (
                    <div className="py-12 text-center text-slate-400 text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-600" />
                      Loading table rows...
                    </div>
                  ) : tableData && tableData.rows.length > 0 ? (
                    <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[340px]">
                      <table className="w-full text-left text-xs whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0">
                          <tr>
                            {Object.keys(tableData.rows[0]).map(key => (
                              <th key={key} className="py-2 px-3 font-semibold font-mono">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                          {tableData.rows.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              {Object.values(row).map((val: any, valIdx) => (
                                <td key={valIdx} className="py-2 px-3 max-w-xs truncate">
                                  {val === null || val === undefined ? (
                                    <span className="text-slate-300 italic">NULL</span>
                                  ) : typeof val === 'object' ? (
                                    JSON.stringify(val)
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-lg border border-slate-200 text-xs">
                      No records in table yet.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Interactive SQL Console */}
      {activeTab === 'sql' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-teal-600" />
                Live SQL Query Console
              </h2>
              <p className="text-xs text-slate-500">
                Execute standard SQL queries against the active relational database. Supports SELECT, INSERT, UPDATE, EXPLAIN, and PRAGMA.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteSql}
                disabled={isExecutingSql}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isExecutingSql ? 'animate-spin' : ''}`} />
                {isExecutingSql ? 'Executing...' : 'Run Query (Ctrl+Enter)'}
              </button>
            </div>
          </div>

          {/* Quick Query Templates */}
          <div>
            <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-2">
              Quick Query Templates:
            </div>
            <div className="flex flex-wrap gap-2">
              {sqlTemplates.map((tpl, idx) => (
                <button
                  key={idx}
                  onClick={() => setSqlQuery(tpl.query)}
                  className="px-2.5 py-1 text-xs rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 transition"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {/* Query Editor Box */}
          <div className="relative rounded-lg overflow-hidden border border-slate-300 focus-within:ring-2 focus-within:ring-teal-500 focus-within:border-teal-500">
            <div className="bg-slate-800 text-slate-400 text-[11px] px-3 py-1.5 flex items-center justify-between border-b border-slate-700 font-mono">
              <span>SQL Editor (Relational SQLite / MySQL Syntax)</span>
              <span>Execute with Run button</span>
            </div>
            <textarea
              value={sqlQuery}
              onChange={e => setSqlQuery(e.target.value)}
              onKeyDown={e => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleExecuteSql();
                }
              }}
              rows={5}
              placeholder="Enter SQL statement..."
              className="w-full p-4 font-mono text-xs bg-slate-900 text-slate-100 focus:outline-none resize-y leading-relaxed"
            />
          </div>

          {/* Query Execution Results */}
          {sqlResult && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {sqlResult.success ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Success
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Execution Error
                    </span>
                  )}

                  <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {sqlResult.executionTimeMs} ms
                  </span>

                  {sqlResult.isSelect && (
                    <span className="text-xs text-slate-600 font-mono">
                      {sqlResult.rowCount} rows returned
                    </span>
                  )}
                  {!sqlResult.isSelect && sqlResult.message && (
                    <span className="text-xs text-slate-600 font-mono">
                      {sqlResult.message}
                    </span>
                  )}
                </div>

                {sqlResult.rows && sqlResult.rows.length > 0 && (
                  <button
                    onClick={() => {
                      const csvHeader = (sqlResult.columns || []).join(',');
                      const csvRows = sqlResult.rows!.map(r => Object.values(r).map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
                      const csvContent = [csvHeader, ...csvRows].join('\n');
                      downloadFile('query_results.csv', csvContent);
                    }}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1"
                  >
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                )}
              </div>

              {sqlResult.error && (
                <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-mono">
                  {sqlResult.error}
                </div>
              )}

              {sqlResult.rows && sqlResult.rows.length > 0 && (
                <div className="border border-slate-200 rounded-lg overflow-x-auto max-h-[380px]">
                  <table className="w-full text-left text-xs whitespace-nowrap">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 font-mono">
                      <tr>
                        {sqlResult.columns?.map(col => (
                          <th key={col} className="py-2.5 px-3 font-semibold">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                      {sqlResult.rows.map((row, rIdx) => (
                        <tr key={rIdx} className="hover:bg-slate-50/50">
                          {sqlResult.columns?.map((col, cIdx) => (
                            <td key={cIdx} className="py-2 px-3 max-w-sm truncate">
                              {row[col] === null || row[col] === undefined ? (
                                <span className="text-slate-300 italic">NULL</span>
                              ) : (
                                String(row[col])
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Database Credentials & Connection */}
      {activeTab === 'credentials' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900">Current Database Credentials</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configured environment variables and parameters for MySQL / MariaDB / Cloud SQL connectivity.
              </p>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Database Host (DB_HOST):</span>
                <span className="font-bold text-slate-900">{status?.mysqlCredentials.host || 'localhost'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Database Port (DB_PORT):</span>
                <span className="font-bold text-slate-900">{status?.mysqlCredentials.port || 3306}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Database Name (DB_NAME):</span>
                <span className="font-bold text-teal-700">{status?.mysqlCredentials.database || 'smart_hospital'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Username (DB_USERNAME):</span>
                <span className="font-bold text-slate-900">{status?.mysqlCredentials.username || 'root'}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Password (DB_PASSWORD):</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">
                    {showPassword ? 'bitsathy' : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-teal-600 hover:underline font-sans"
                  >
                    {showPassword ? 'Hide' : 'Reveal'}
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between">
                <span className="text-slate-500 font-sans">Client Driver:</span>
                <span className="text-indigo-600 font-bold">{status?.mysqlCredentials.driver || 'mysql2 (Node.js)'}</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => handleTestConnection(false)}
                disabled={isTestingConn}
                className="w-full py-2.5 px-4 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition"
              >
                <Zap className={`w-4 h-4 ${isTestingConn ? 'animate-spin' : ''}`} />
                {isTestingConn ? 'Testing Socket Connectivity...' : 'Test Default Credentials Connection'}
              </button>
            </div>

            {testResult && (
              <div className={`p-4 rounded-lg border text-xs ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                <div className="flex items-start gap-2">
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold">{testResult.message}</div>
                    {testResult.latencyMs && (
                      <div className="text-[11px] text-slate-500 mt-1">Latency: {testResult.latencyMs}ms</div>
                    )}
                    {testResult.suggestion && (
                      <div className="mt-2 text-slate-700 leading-relaxed font-sans text-xs bg-white/70 p-2.5 rounded border border-amber-200/60">
                        <strong>Environment Status:</strong> {testResult.suggestion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test Custom Remote MySQL Host */}
          <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-indigo-600" />
                <h2 className="text-base font-bold text-slate-900">Connect External MySQL / Cloud SQL</h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Test connection to a remote Cloud SQL instance, AWS RDS, Supabase, or Clever Cloud database.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Host / Endpoint</label>
                <input
                  type="text"
                  value={customHost}
                  onChange={e => setCustomHost(e.target.value)}
                  placeholder="e.g. 34.120.x.x or db.example.com"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Port</label>
                <input
                  type="text"
                  value={customPort}
                  onChange={e => setCustomPort(e.target.value)}
                  placeholder="3306"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Database Name</label>
                <input
                  type="text"
                  value={customDb}
                  onChange={e => setCustomDb(e.target.value)}
                  placeholder="smart_hospital"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  value={customUser}
                  onChange={e => setCustomUser(e.target.value)}
                  placeholder="root"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  value={customPassword}
                  onChange={e => setCustomPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full p-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>

            <button
              onClick={() => handleTestConnection(true)}
              disabled={isTestingConn}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2 transition"
            >
              <Zap className={`w-4 h-4 ${isTestingConn ? 'animate-spin' : ''}`} />
              Test Remote MySQL Connection
            </button>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                Dual-Engine Architecture
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500">
                The smart hospital system operates on an embedded relational SQLite database with identical schema and full relational integrity, guaranteeing instantaneous response times with zero external network latency while maintaining 100% compatibility with MySQL 8.0 DDL schemas.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Entity Relationship (ER) Diagram */}
      {activeTab === 'er' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Network className="w-5 h-5 text-teal-600" />
              Smart Hospital Entity Relationship (ER) Architecture
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Visual map of relational tables, foreign key constraints, and 3NF database architecture.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Core Domain Card 1: Identity & Roles */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                1. Authentication & Staff
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">users</div>
                  <div className="text-[10px] text-slate-500">id, username, password, role, email</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 pl-4 border-l-4 border-l-blue-400">
                  <div className="font-bold text-slate-900">doctors</div>
                  <div className="text-[10px] text-slate-500">id, user_id (FK), dept_id (FK), specialization</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 pl-4 border-l-4 border-l-blue-400">
                  <div className="font-bold text-slate-900">nurses</div>
                  <div className="text-[10px] text-slate-500">id, user_id (FK), dept_id (FK), skill_level</div>
                </div>
              </div>
            </div>

            {/* Core Domain Card 2: Clinical & Beds */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
                2. Patients, Beds & Optimization
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">departments</div>
                  <div className="text-[10px] text-slate-500">id, name, code, floor_number, bed_capacity</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 pl-4 border-l-4 border-l-teal-400">
                  <div className="font-bold text-slate-900">beds</div>
                  <div className="text-[10px] text-slate-500">id, bed_number, department_id (FK), status, has_ventilator</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 pl-4 border-l-4 border-l-emerald-500">
                  <div className="font-bold text-slate-900">patients</div>
                  <div className="text-[10px] text-slate-500">id, op_number, doctor_id (FK), bed_id (FK), severity</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200 pl-4 border-l-4 border-l-teal-600">
                  <div className="font-bold text-slate-900">bed_allocations</div>
                  <div className="text-[10px] text-slate-500">id, bed_id (FK), patient_id (FK), algorithm_score</div>
                </div>
              </div>
            </div>

            {/* Core Domain Card 3: EHR & Clinical Workflows */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200 font-bold text-xs text-slate-800">
                <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                3. Triage, EHR & Supply Chain
              </div>
              <div className="space-y-2 font-mono text-xs">
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">emergency_cases</div>
                  <div className="text-[10px] text-slate-500">id, case_number, severity, triage_score, doctor_id (FK)</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">appointments</div>
                  <div className="text-[10px] text-slate-500">id, patient_id (FK), doctor_id (FK), appointment_date</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">medical_records / prescriptions</div>
                  <div className="text-[10px] text-slate-500">id, patient_id (FK), doctor_id (FK), medicines_json</div>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-slate-200">
                  <div className="font-bold text-slate-900">inventory & equipment</div>
                  <div className="text-[10px] text-slate-500">id, item_name, quantity, min_stock, serial_number</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: MySQL 8.0 DDL & Seed Script */}
      {activeTab === 'ddl' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-teal-600" />
                MySQL 8.0 DDL Schema Script
              </h2>
              <p className="text-xs text-slate-500">
                Standard SQL script defining all 17 tables, foreign key constraints, indexes, and ENUM types.
              </p>
            </div>

            {scripts && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(scripts.schemaSql, 'ddl')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  {copiedDdl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedDdl ? 'Copied!' : 'Copy SQL'}
                </button>
                <button
                  onClick={() => downloadFile('schema.sql', scripts.schemaSql)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download schema.sql
                </button>
              </div>
            )}
          </div>

          <div className="rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
            <div className="px-4 py-2 bg-slate-900 text-slate-400 text-xs font-mono border-b border-slate-800 flex items-center justify-between">
              <span>backend/src/main/resources/db/schema.sql</span>
              <span>MySQL 8.0 DDL</span>
            </div>
            <pre className="p-4 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[500px] leading-relaxed">
              {scripts?.schemaSql || '-- Loading schema.sql...'}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
