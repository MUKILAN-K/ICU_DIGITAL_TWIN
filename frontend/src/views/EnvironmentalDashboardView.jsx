import React, { useState, useEffect } from 'react';
import {
  Wind,
  Thermometer,
  Droplets,
  Activity,
  Layers,
  TrendingUp,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Sliders,
  ChevronRight,
  Box,
  LineChart,
  Info,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { useICU } from '../context/ICUContext';
import { fetchRoomForecast, fetchForecastEvaluation } from '../services/api';
import SvgVitalTrend from '../components/SvgVitalTrend';

export default function EnvironmentalDashboardView() {
  const {
    beds,
    selectedRoomId,
    setSelectedRoomId,
    selectedBed,
    safeCount,
    warningCount,
    alertCount,
    activeScenario,
    triggerScenario,
    enterICUFloor,
    enterRoom,
    wsStatus,
  } = useICU();

  const [forecastParam, setForecastParam] = useState('pm25_ug_m3');
  const [forecastHorizon, setForecastHorizon] = useState(30);
  const [forecastData, setForecastData] = useState(null);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [evalData, setEvalData] = useState(null);

  // Load forecast whenever selected room, parameter, or horizon changes
  useEffect(() => {
    let isMounted = true;
    async function loadForecast() {
      setForecastLoading(true);
      try {
        const data = await fetchRoomForecast(selectedRoomId, forecastParam, forecastHorizon);
        if (isMounted) {
          setForecastData(data);
          setForecastLoading(false);
        }
      } catch (err) {
        if (isMounted) setForecastLoading(false);
      }
    }
    loadForecast();
    return () => { isMounted = false; };
  }, [selectedRoomId, forecastParam, forecastHorizon]);

  // Load model evaluation metrics on mount
  useEffect(() => {
    fetchForecastEvaluation()
      .then((res) => setEvalData(res))
      .catch(() => {});
  }, []);

  const air = selectedBed?.currentAir || {};
  const status = selectedBed?.status || 'safe';

  const statusConfig = {
    safe: { label: 'NORMAL / OPTIMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', icon: ShieldCheck },
    warning: { label: 'ELEVATED / WARNING', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)', icon: AlertTriangle },
    alert: { label: 'CRITICAL ALERT', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)', icon: ShieldAlert },
  }[status] || { label: 'NORMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)', icon: ShieldCheck };

  const StatusIcon = statusConfig.icon;

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        overflowY: 'auto',
        padding: '24px 32px',
        background: '#080e1a',
        color: '#f8fafc',
      }}
    >
      {/* ─── 1. TOP HEADER & ROOM SELECTOR BAR ───────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Wind size={18} color="#0ea5e9" />
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              ICU Environmental Monitoring & Bio-HVAC Surveillance
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
            Continuous distributed surveillance of PM2.5, PM10, CO₂, temperature, and humidity across all 5 ICU rooms.
          </p>
        </div>

        {/* 5 Rooms Selector Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {beds.map((b) => {
            const isSelected = b.roomId === selectedRoomId;
            const bStatusColor = b.status === 'alert' ? '#f43f5e' : b.status === 'warning' ? '#f59e0b' : '#10b981';
            return (
              <button
                key={b.roomId}
                onClick={() => setSelectedRoomId(b.roomId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: isSelected ? '1px solid #0284c7' : '1px solid #1e293b',
                  background: isSelected ? '#0e1d35' : '#0c1322',
                  color: isSelected ? '#ffffff' : '#94a3b8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: bStatusColor,
                    boxShadow: `0 0 6px ${bStatusColor}`,
                  }}
                />
                <span>{b.roomId}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ─── 2. AGGREGATED WARD KPI COUNTERS ─────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '12px',
          marginBottom: '20px',
        }}
      >
        <KpiPill label="5 CONFIGURED ROOMS" value="5 Units" sub="100% Online" color="#38bdf8" />
        <KpiPill label="WITHIN WHO LIMITS" value={`${safeCount} Rooms`} sub="Optimal Air Quality" color="#10b981" />
        <KpiPill label="WARNING TOLERANCE" value={`${warningCount} Rooms`} sub="Threshold Exceeded" color="#f59e0b" />
        <KpiPill label="ACTIVE CRITICAL ALERTS" value={`${alertCount} Alerts`} sub="Action Required" color="#f43f5e" />
        <KpiPill
          label="ACTIVE SCENARIO"
          value={activeScenario.toUpperCase()}
          sub={wsStatus === 'connected' ? 'WebSocket Live' : 'Simulated Engine'}
          color="#06b6d4"
        />
      </div>

      {/* ─── 3. SELECTED ROOM HEADER & 3D JUMP SHORTCUT ─────────────── */}
      <div
        style={{
          background: '#0c1322',
          border: '1px solid #1e293b',
          borderRadius: '8px',
          padding: '14px 20px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#38bdf8' }}>
                {selectedBed?.roomId}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                {selectedBed?.name}
              </span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: statusConfig.bg,
                  border: `1px solid ${statusConfig.border}`,
                  color: statusConfig.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <StatusIcon size={12} />
                <span>{statusConfig.label}</span>
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Patient: {selectedBed?.patient?.name} ({selectedBed?.patient?.age}y {selectedBed?.patient?.gender}) • Diagnosis: {selectedBed?.patient?.primaryDiagnosis}
            </div>
          </div>
        </div>

        {/* 3D Navigation Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => enterRoom(selectedRoomId)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #0284c7',
              background: 'rgba(2, 132, 199, 0.2)',
              color: '#38bdf8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Box size={14} />
            <span>Enter 3D Room Interior</span>
          </button>

          <button
            onClick={enterICUFloor}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 12px',
              borderRadius: '6px',
              border: '1px solid #1e293b',
              background: '#0f172a',
              color: '#94a3b8',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <Layers size={14} />
            <span>View 3D ICU Floor</span>
          </button>
        </div>
      </div>

      {/* ─── 4. THE 5 ENVIRONMENTAL MEASUREMENT CARDS ───────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* 1. PM2.5 */}
        <ParamCard
          title="PM2.5 PARTICULATE"
          value={air.pm25_ug_m3 ?? air.pm25 ?? '--'}
          unit="µg/m³"
          guideline="WHO Limit: ≤ 15.0 µg/m³"
          status={
            (air.pm25_ug_m3 ?? air.pm25) > 35.0 ? 'alert' : (air.pm25_ug_m3 ?? air.pm25) > 15.0 ? 'warning' : 'safe'
          }
          trend={
            <SvgVitalTrend
              type="trend"
              data={selectedBed?.trends || []}
              dataKey="pm25_ug_m3"
              color={(air.pm25_ug_m3 ?? air.pm25) > 15.0 ? '#f59e0b' : '#10b981'}
              width={100}
              height={30}
              minVal={2}
              maxVal={45}
            />
          }
        />

        {/* 2. PM10 */}
        <ParamCard
          title="PM10 PARTICULATE"
          value={air.pm10_ug_m3 ?? air.pm10 ?? '--'}
          unit="µg/m³"
          guideline="WHO Limit: ≤ 45.0 µg/m³"
          status={
            (air.pm10_ug_m3 ?? air.pm10) > 75.0 ? 'alert' : (air.pm10_ug_m3 ?? air.pm10) > 45.0 ? 'warning' : 'safe'
          }
          trend={
            <SvgVitalTrend
              type="trend"
              data={selectedBed?.trends || []}
              dataKey="pm10_ug_m3"
              color={(air.pm10_ug_m3 ?? air.pm10) > 45.0 ? '#f59e0b' : '#10b981'}
              width={100}
              height={30}
              minVal={5}
              maxVal={85}
            />
          }
        />

        {/* 3. Carbon Dioxide (CO2) */}
        <ParamCard
          title="CARBON DIOXIDE (CO2)"
          value={Math.round(air.co2_ppm ?? air.co2 ?? 0)}
          unit="ppm"
          guideline="ASHRAE 62.1: ≤ 800 ppm"
          status={
            (air.co2_ppm ?? air.co2) > 1000 ? 'alert' : (air.co2_ppm ?? air.co2) > 800 ? 'warning' : 'safe'
          }
          trend={
            <SvgVitalTrend
              type="trend"
              data={selectedBed?.trends || []}
              dataKey="co2_ppm"
              color={(air.co2_ppm ?? air.co2) > 800 ? '#f59e0b' : '#10b981'}
              width={100}
              height={30}
              minVal={400}
              maxVal={1100}
            />
          }
        />

        {/* 4. Temperature */}
        <ParamCard
          title="AMBIENT TEMPERATURE"
          value={air.temperature_c ?? air.temperature ?? '--'}
          unit="°C"
          guideline="ICU Comfort: 20.0 - 24.0 °C"
          status={
            (air.temperature_c ?? air.temperature) > 25.5 || (air.temperature_c ?? air.temperature) < 18.0
              ? 'alert'
              : (air.temperature_c ?? air.temperature) > 24.0 || (air.temperature_c ?? air.temperature) < 20.0
              ? 'warning'
              : 'safe'
          }
          trend={
            <SvgVitalTrend
              type="trend"
              data={selectedBed?.trends || []}
              dataKey="temperature_c"
              color="#0ea5e9"
              width={100}
              height={30}
              minVal={18}
              maxVal={27}
            />
          }
        />

        {/* 5. Relative Humidity */}
        <ParamCard
          title="RELATIVE HUMIDITY"
          value={air.relative_humidity_pct ?? air.humidity ?? '--'}
          unit="%"
          guideline="Pathogen Target: 40 - 55%"
          status={
            (air.relative_humidity_pct ?? air.humidity) > 60 || (air.relative_humidity_pct ?? air.humidity) < 35
              ? 'warning'
              : 'safe'
          }
          trend={
            <SvgVitalTrend
              type="trend"
              data={selectedBed?.trends || []}
              dataKey="relative_humidity_pct"
              color="#14b8a6"
              width={100}
              height={30}
              minVal={30}
              maxVal={70}
            />
          }
        />
      </div>

      {/* ─── 5. PREDICTIVE FORECASTING MODULE (Phase 7) ─────────────── */}
      <div
        style={{
          background: '#0c1322',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '24px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="#0ea5e9" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
                Predictive Environmental Forecasting (Phase 7)
              </h2>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Time-series projection using Trend-Adjusted Exponential Smoothing with 95% confidence intervals.
            </div>
          </div>

          {/* Horizon & Parameter Selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
              value={forecastParam}
              onChange={(e) => setForecastParam(e.target.value)}
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '5px',
                padding: '6px 10px',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <option value="pm25_ug_m3">PM2.5 (µg/m³)</option>
              <option value="pm10_ug_m3">PM10 (µg/m³)</option>
              <option value="co2_ppm">CO2 (ppm)</option>
              <option value="temperature_c">Temperature (°C)</option>
              <option value="relative_humidity_pct">Humidity (%)</option>
            </select>

            <div style={{ display: 'flex', background: '#0f172a', border: '1px solid #1e293b', borderRadius: '5px', padding: '2px' }}>
              {[15, 30, 60].map((h) => (
                <button
                  key={h}
                  onClick={() => setForecastHorizon(h)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: 'none',
                    background: forecastHorizon === h ? '#0284c7' : 'transparent',
                    color: forecastHorizon === h ? '#ffffff' : '#94a3b8',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  +{h}m
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Forecast Alert Notice if projected breach */}
        {forecastData?.forecast_alert_risk?.has_projected_breach && (
          <div
            style={{
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: '6px',
              padding: '10px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '12px',
              color: '#f43f5e',
            }}
          >
            <AlertTriangle size={16} />
            <span>
              <strong>FORECAST-BASED WARNING:</strong> Projected to reach{' '}
              <strong>{forecastData.forecast_alert_risk.projected_breach_value} {forecastData.unit}</strong> at{' '}
              {new Date(forecastData.forecast_alert_risk.projected_breach_time).toLocaleTimeString()} (Threshold: {forecastData.forecast_alert_risk.configured_safe_limit}).
            </span>
          </div>
        )}

        {/* Interactive SVG Projection Chart: Historical Solid Line vs Forecast Dashed Line with Shaded Bound */}
        {forecastLoading ? (
          <div style={{ height: '160px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
            Computing time-series projection...
          </div>
        ) : forecastData ? (
          <div style={{ background: '#090f1d', border: '1px solid #1e293b', borderRadius: '8px', padding: '16px' }}>
            <ForecastSvgChart
              history={forecastData.recent_history || []}
              forecast={forecastData.forecast_series || []}
              unit={forecastData.unit}
              safeThreshold={forecastData.forecast_alert_risk?.configured_safe_limit}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', fontSize: '11px', color: '#64748b' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '12px', height: '2px', background: '#38bdf8' }} />
                  <span>Historical Observations</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '12px', height: '2px', background: '#f59e0b', borderTop: '1px dashed #f59e0b' }} />
                  <span>Damped Holt Forecast</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '10px', height: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)' }} />
                  <span>95% Confidence Interval</span>
                </span>
              </div>
              <div>Model: {forecastData.model_used}</div>
            </div>
          </div>
        ) : null}
      </div>

      {/* ─── 6. EMPIRICAL MODEL EVALUATION TABLE (Phase 7) ──────────── */}
      {evalData && evalData.parameter_metrics && (
        <div
          style={{
            background: '#0c1322',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '20px',
            marginBottom: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <CheckCircle size={16} color="#10b981" />
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Forecasting Model Accuracy Evaluation (Held-Out ICU Dataset)
            </h3>
          </div>
          <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 14px 0' }}>
            Comparative error metrics evaluated across {evalData.sample_points_tested} test windows in <code>{evalData.dataset}</code>:
          </p>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', textAlign: 'left' }}>
                <th style={{ padding: '8px' }}>Parameter</th>
                <th style={{ padding: '8px' }}>Baseline Persistence (MAE)</th>
                <th style={{ padding: '8px' }}>Baseline (RMSE)</th>
                <th style={{ padding: '8px', color: '#38bdf8' }}>Damped Holt (MAE)</th>
                <th style={{ padding: '8px', color: '#38bdf8' }}>Damped Holt (RMSE)</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(evalData.parameter_metrics).map(([param, m]) => (
                <tr key={param} style={{ borderBottom: '1px solid #0f172a' }}>
                  <td style={{ padding: '8px', fontWeight: 600, color: '#f8fafc' }}>
                    {param.replace('_', ' ').toUpperCase()} ({m.unit})
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'monospace' }}>{m.baseline_persistence.mae}</td>
                  <td style={{ padding: '8px', fontFamily: 'monospace' }}>{m.baseline_persistence.rmse}</td>
                  <td style={{ padding: '8px', fontFamily: 'monospace', color: '#38bdf8', fontWeight: 700 }}>
                    {m.damped_holt_model.mae}
                  </td>
                  <td style={{ padding: '8px', fontFamily: 'monospace', color: '#38bdf8' }}>
                    {m.damped_holt_model.rmse}
                  </td>
                  <td style={{ padding: '8px', color: '#10b981', fontWeight: 600 }}>Validated</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ─── 7. REPEATABLE SCENARIO INJECTION CONTROLS (Phase 4 & 5) ─── */}
      <div
        style={{
          background: '#0c1322',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sliders size={16} color="#0ea5e9" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
            Repeatable Simulation Scenarios (Phase 4 Specification)
          </h3>
        </div>
        <p style={{ fontSize: '11px', color: '#94a3b8', margin: '0 0 14px 0' }}>
          Inject standardized test scenarios to verify alarm thresholds and predictive divergence:
        </p>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <ScenarioBtn
            label="Stable Baseline"
            desc="Normal optimal WHO ranges"
            isActive={activeScenario === 'stable'}
            onClick={() => triggerScenario('stable')}
          />
          <ScenarioBtn
            label="Gradual Drift"
            desc="Creeping filter accumulation"
            isActive={activeScenario === 'increasing'}
            onClick={() => triggerScenario('increasing', selectedRoomId)}
          />
          <ScenarioBtn
            label="Sudden Acute Spike"
            desc="Aerosol / Sterilizer spill"
            isActive={activeScenario === 'sudden_spike'}
            onClick={() => triggerScenario('sudden_spike', selectedRoomId)}
          />
          <ScenarioBtn
            label="Room Disturbance"
            desc={`Strictly to ${selectedRoomId}`}
            isActive={activeScenario === 'room_disturbance'}
            onClick={() => triggerScenario('room_disturbance', selectedRoomId)}
          />
          <ScenarioBtn
            label="Bio-HVAC Purge Recovery"
            desc="14 ACH rapid baseline return"
            isActive={activeScenario === 'recovery'}
            onClick={() => triggerScenario('recovery', selectedRoomId)}
          />
        </div>
      </div>
    </div>
  );
}

function KpiPill({ label, value, sub, color }) {
  return (
    <div style={{ background: '#0c1322', border: '1px solid #1e293b', borderRadius: '8px', padding: '12px 14px' }}>
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', letterSpacing: '0.04em' }}>{label}</div>
      <div style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'monospace', margin: '4px 0 2px 0' }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{sub}</div>
    </div>
  );
}

function ParamCard({ title, value, unit, guideline, status, trend }) {
  const statusColor = status === 'alert' ? '#f43f5e' : status === 'warning' ? '#f59e0b' : '#10b981';
  return (
    <div style={{ background: '#0c1322', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8' }}>{title}</span>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: statusColor, boxShadow: `0 0 6px ${statusColor}` }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '4px' }}>
          <span style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace' }}>{value}</span>
          <span style={{ fontSize: '11px', color: '#64748b' }}>{unit}</span>
        </div>
        <div style={{ fontSize: '10px', color: statusColor, fontWeight: 500, marginBottom: '10px' }}>{guideline}</div>
      </div>
      <div>{trend}</div>
    </div>
  );
}

function ScenarioBtn({ label, desc, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: '160px',
        padding: '10px 14px',
        borderRadius: '6px',
        border: isActive ? '1px solid #0284c7' : '1px solid #1e293b',
        background: isActive ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
        color: isActive ? '#ffffff' : '#94a3b8',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'all 0.15s ease',
      }}
    >
      <div style={{ fontSize: '12px', fontWeight: 700, color: isActive ? '#38bdf8' : '#f8fafc', marginBottom: '2px' }}>
        {label}
      </div>
      <div style={{ fontSize: '10px', color: '#64748b' }}>{desc}</div>
    </button>
  );
}

/** SVG Dual-Series Chart: Historical Solid Line + Forecast Dashed Line with Shaded Confidence Envelope */
function ForecastSvgChart({ history = [], forecast = [], unit = '', safeThreshold = 15.0 }) {
  const width = 800;
  const height = 180;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;

  const allVals = [
    ...history.map((h) => h.actual_value),
    ...forecast.map((f) => f.predicted_value),
    ...forecast.map((f) => f.upper_bound_95),
  ];

  const minV = Math.max(0, Math.min(...allVals, 0));
  const maxV = Math.max(...allVals, safeThreshold * 1.25, 20);
  const span = maxV - minV || 1;

  const totalPoints = history.length + forecast.length;
  if (totalPoints < 2) return null;

  const usableW = width - padL - padR;
  const usableH = height - padT - padB;
  const stepX = usableW / (totalPoints - 1);

  // Map history points
  const histPoints = history.map((pt, i) => {
    const x = padL + i * stepX;
    const y = height - padB - ((pt.actual_value - minV) / span) * usableH;
    return { x, y, val: pt.actual_value };
  });

  // Map forecast points (starting from last history point)
  const lastHist = histPoints[histPoints.length - 1] || { x: padL, y: height - padB, val: minV };
  const fcPoints = [
    lastHist,
    ...forecast.map((pt, i) => {
      const idx = history.length + i;
      const x = padL + idx * stepX;
      const y = height - padB - ((pt.predicted_value - minV) / span) * usableH;
      const yLow = height - padB - ((pt.lower_bound_95 - minV) / span) * usableH;
      const yHigh = height - padB - ((pt.upper_bound_95 - minV) / span) * usableH;
      return { x, y, yLow, yHigh, val: pt.predicted_value };
    }),
  ];

  // SVG paths
  const histD = histPoints.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
  const fcD = fcPoints.reduce((acc, p, idx) => (idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

  // Confidence area path
  let boundD = '';
  if (fcPoints.length > 1) {
    const topPts = fcPoints.map((p) => `${p.x} ${p.yHigh ?? p.y}`);
    const botPts = [...fcPoints].reverse().map((p) => `${p.x} ${p.yLow ?? p.y}`);
    boundD = `M ${topPts[0]} L ${topPts.join(' L ')} L ${botPts.join(' L ')} Z`;
  }

  // Safe Threshold line Y
  const threshY = height - padB - ((safeThreshold - minV) / span) * usableH;

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      {/* Background gridlines */}
      <line x1={padL} y1={padT} x2={width - padR} y2={padT} stroke="#1e293b" strokeDasharray="3 3" />
      <line x1={padL} y1={height - padB} x2={width - padR} y2={height - padB} stroke="#1e293b" />

      {/* Threshold Reference Line */}
      {threshY >= padT && threshY <= height - padB && (
        <g>
          <line x1={padL} y1={threshY} x2={width - padR} y2={threshY} stroke="#f43f5e" strokeDasharray="4 4" strokeWidth="1.2" />
          <text x={width - padR} y={threshY - 4} fill="#f43f5e" fontSize="10" textAnchor="end">
            Threshold: {safeThreshold} {unit}
          </text>
        </g>
      )}

      {/* Confidence Envelope */}
      {boundD && <path d={boundD} fill="rgba(245, 158, 11, 0.12)" />}

      {/* Historical Solid Line */}
      {histD && <path d={histD} stroke="#38bdf8" strokeWidth="2.0" fill="none" />}

      {/* Forecast Dashed Line */}
      {fcD && <path d={fcD} stroke="#f59e0b" strokeWidth="2.0" strokeDasharray="5 4" fill="none" />}

      {/* Points */}
      {histPoints.map((p, i) => (
        <circle key={`h-${i}`} cx={p.x} cy={p.y} r="2.5" fill="#38bdf8" />
      ))}
      {fcPoints.slice(1).map((p, i) => (
        <circle key={`f-${i}`} cx={p.x} cy={p.y} r="3" fill="#f59e0b" />
      ))}
    </svg>
  );
}

