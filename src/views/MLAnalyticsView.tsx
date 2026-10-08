import React, { useState, useEffect } from 'react';
import { PredictionReport } from '../types.ts';
import { api } from '../services/api.ts';
import {
  LineChart as LineChartIcon,
  Sparkles,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';

export const MLAnalyticsView: React.FC = () => {
  const [report, setReport] = useState<PredictionReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState<string | null>(null);

  async function loadPredictions() {
    try {
      setLoading(true);
      const data = await api.getForecast();
      setReport(data);
    } catch (err) {
      console.error('Failed to load ML forecast:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPredictions();
  }, []);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      setRetrainSuccess(null);
      const res = await api.retrainMLModels();
      setReport(res.forecast);
      setRetrainSuccess('Models successfully retrained against updated multivariate dataset.');
    } catch (err: unknown) {
      alert((err as Error).message);
    } finally {
      setRetraining(false);
    }
  };

  if (loading || !report) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading machine learning prediction models...</div>;
  }

  const dates = report.seven_day_forecast.map(d => `${d.day_of_week.slice(0, 3)} (${d.date.slice(5)})`);
  const bedDemand = report.seven_day_forecast.map(d => d.predicted_bed_demand);
  const confUpper = report.seven_day_forecast.map(d => d.confidence_upper_95);
  const confLower = report.seven_day_forecast.map(d => d.confidence_lower_95);
  const icuDemand = report.seven_day_forecast.map(d => d.predicted_icu_demand);
  const nursesReq = report.seven_day_forecast.map(d => d.predicted_nurse_requirement);
  const medsUnits = report.seven_day_forecast.map(d => d.predicted_medicine_units);

  // Bed Demand Chart Data
  const bedForecastData = {
    labels: dates,
    datasets: [
      {
        label: 'Predicted Bed Demand',
        data: bedDemand,
        borderColor: '#0d9488',
        backgroundColor: 'rgba(13, 148, 136, 0.1)',
        tension: 0.3,
        fill: true
      },
      {
        label: '95% Confidence Upper Bound',
        data: confUpper,
        borderColor: '#94a3b8',
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false
      },
      {
        label: '95% Confidence Lower Bound',
        data: confLower,
        borderColor: '#94a3b8',
        borderDash: [4, 4],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  // ICU vs Nurse Requirements
  const staffingData = {
    labels: dates,
    datasets: [
      {
        label: 'Projected ICU Census',
        data: icuDemand,
        backgroundColor: '#f59e0b',
        borderRadius: 4
      },
      {
        label: 'Required Active Nurses',
        data: nursesReq,
        backgroundColor: '#0f766e',
        borderRadius: 4
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LineChartIcon className="w-5 h-5 text-teal-600" />
            <span>AI/ML Resource Demand Forecasting Engine</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Multivariate Ridge-regularized regression trained on historical admissions, seasonality, and emergency surges.
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50"
        >
          <RotateCcw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
          <span>{retraining ? 'Fitting New Weights...' : 'Retrain ML Models'}</span>
        </button>
      </div>

      {retrainSuccess && (
        <div className="p-3 rounded-lg bg-teal-50 border border-teal-200 text-xs text-teal-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
          <span>{retrainSuccess}</span>
        </div>
      )}

      {/* Model Performance & Validation Scoreboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Model Goodness-of-Fit</div>
          <div className="text-2xl font-bold font-mono text-teal-700">
            R² = {report.metrics.r2_score}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Coefficient of determination</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Root Mean Squared Error</div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {report.metrics.rmse}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Average census variance</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">Mean Absolute % Error</div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {report.metrics.mape}%
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Relative forecast error</p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">ICU Surge Risk Tier</div>
          <div className={`text-2xl font-bold font-mono ${
            report.summary.icu_surge_risk === 'HIGH' ? 'text-rose-600' : 'text-amber-600'
          }`}>
            {report.summary.icu_surge_risk}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Peak: {report.summary.peak_demand_date}</p>
        </div>
      </div>

      {/* Chart 1: Bed Demand with Confidence Intervals */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">7-Day Hospital Bed Demand Projection</h2>
            <p className="text-xs text-slate-500">Forecasting total inpatient census with 95% Confidence Intervals</p>
          </div>
          <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
            Algorithm: {report.algorithm}
          </span>
        </div>
        <div className="h-64">
          <Line
            data={bedForecastData}
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

      {/* Chart 2: ICU Demand vs Nurse Requirements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Projected ICU Census vs Required Nurse Headcount</h2>
            <p className="text-xs text-slate-500">Optimizing nurse-to-patient acuity staffing ratios</p>
          </div>
          <div className="h-60">
            <Bar
              data={staffingData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  x: { grid: { display: false } },
                  y: { beginAtZero: true, grid: { color: '#f1f5f9' } }
                },
                plugins: {
                  legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Predictive Alerts & Recommendations */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Operational Advisory &amp; Optimization</h2>
            <p className="text-xs text-slate-500">Automated resource allocation alerts based on inference output</p>
          </div>

          <div className="space-y-3 flex-1">
            {report.summary.resource_alerts.map((alert, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{alert}</span>
              </div>
            ))}

            <div className="p-3 rounded-xl bg-teal-50/60 border border-teal-200 text-xs text-teal-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
              <span>Recommended minimum nurse shift roster for next 7 days: {report.summary.recommended_active_nurses} FTEs.</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-500 flex justify-between">
            <span>Model Weights: Ridge L2</span>
            <span>Trained On: {report.metrics.training_sample_count} Records</span>
          </div>
        </div>
      </div>
    </div>
  );
};
