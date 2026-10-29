import React from 'react';
import {
  Building2,
  Users,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wind,
  Activity,
  Heart,
  Droplets,
  Thermometer,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';
import { useICU } from '../context/ICUContext';
import SvgVitalTrend from '../components/SvgVitalTrend';

export default function OverviewView() {
  const { beds, setSelectedRoomId, setActiveNav, safeCount, warningCount, alertCount } = useICU();

  // Compute aggregate ward statistics
  const totalBeds = beds.length || 5;
  const avgPM25 = Math.round((beds.reduce((acc, b) => acc + (b.currentAir.pm25 || 0), 0) / totalBeds) * 10) / 10;
  const avgCO2 = Math.round(beds.reduce((acc, b) => acc + (b.currentAir.co2 || 0), 0) / totalBeds);
  const avgTemp = Math.round((beds.reduce((acc, b) => acc + (b.currentAir.temperature || 0), 0) / totalBeds) * 10) / 10;
  const avgACH = Math.round((beds.reduce((acc, b) => acc + (b.currentAir.airChangesPerHour || 0), 0) / totalBeds) * 10) / 10;

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
      {/* ─── PAGE TITLE ─────────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Building2 size={18} color="#0ea5e9" />
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            Ward Overview • Floor 8 ICU
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
          Aggregate operations overview, ward bed status distributions, and central bio-HVAC parameters.
        </p>
      </div>

      {/* ─── TOP KPI CARDS ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '28px',
        }}
      >
        <KpiCard
          label="TOTAL BEDS MONITORED"
          value={`${totalBeds} / ${totalBeds}`}
          subText="100% Occupancy"
          icon={Users}
          color="#38bdf8"
        />
        <KpiCard
          label="NORMAL STATUS"
          value={safeCount}
          subText="Clinically Stable"
          icon={ShieldCheck}
          color="#10b981"
        />
        <KpiCard
          label="WARNING TOLERANCE"
          value={warningCount}
          subText="Under Observation"
          icon={AlertTriangle}
          color="#f59e0b"
        />
        <KpiCard
          label="CRITICAL ALERTS"
          value={alertCount}
          subText="Immediate Attention"
          icon={ShieldAlert}
          color="#f43f5e"
        />
        <KpiCard
          label="MEAN AIR TURNOVER"
          value={`${avgACH} ACH`}
          subText="WHO Standard Met"
          icon={Wind}
          color="#06b6d4"
        />
      </div>

      {/* ─── 5 BEDS SUMMARY LIST ────────────────────────────────────── */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
            Active ICU Beds (5 Units)
          </h2>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Click any bed card to inspect 3D Twin & telemetry
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {beds.map((bed) => {
            const statusConfig = {
              safe: { label: 'NORMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' },
              warning: { label: 'WARNING', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', border: 'rgba(245, 158, 11, 0.25)' },
              alert: { label: 'CRITICAL', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.3)' },
            }[bed.status] || { label: 'NORMAL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)', border: 'rgba(16, 185, 129, 0.25)' };

            return (
              <div
                key={bed.roomId}
                onClick={() => {
                  setSelectedRoomId(bed.roomId);
                  setActiveNav('icu_floor');
                }}
                style={{
                  background: '#0c1322',
                  border: '1px solid #1e293b',
                  borderRadius: '10px',
                  padding: '14px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#0284c7';
                  e.currentTarget.style.background = '#0e182c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#1e293b';
                  e.currentTarget.style.background = '#0c1322';
                }}
              >
                {/* Left: Bed & Patient */}
                <div style={{ minWidth: '220px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: statusConfig.color,
                        boxShadow: `0 0 6px ${statusConfig.color}`,
                      }}
                    />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                      {bed.bedNumber} • {bed.roomId}
                    </span>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: statusConfig.bg,
                        border: `1px solid ${statusConfig.border}`,
                        color: statusConfig.color,
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>
                    {bed.patient?.name}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {bed.patient?.age}y {bed.patient?.gender} • {bed.patient?.primaryDiagnosis}
                  </div>
                </div>

                {/* Center: Live Vitals Strip */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                  <MetricPill
                    label="HR"
                    value={`${bed.currentVitals.heartRate} bpm`}
                    color={bed.currentVitals.heartRate > 100 ? '#f43f5e' : '#10b981'}
                  />
                  <MetricPill
                    label="SpO2"
                    value={`${bed.currentVitals.spo2}%`}
                    color={bed.currentVitals.spo2 < 95 ? '#f59e0b' : '#0ea5e9'}
                  />
                  <MetricPill
                    label="RESP"
                    value={`${bed.currentVitals.respiratoryRate} rpm`}
                    color="#14b8a6"
                  />
                  <MetricPill
                    label="BP"
                    value={`${bed.currentVitals.systolicBP}/${bed.currentVitals.diastolicBP}`}
                    color="#a855f7"
                  />
                </div>

                {/* ECG Waveform Sparkline */}
                <div style={{ display: 'none', width: '100px' }} className="overview-sparkline">
                  <SvgVitalTrend type="ecg" color={statusConfig.color} status={bed.status} width={90} height={28} />
                </div>

                {/* Right: View Twin Arrow */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
                  <span>Inspect 3D</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ─── BOTTOM ENVIRONMENTAL SUMMARY ──────────────────────────── */}
      <div
        style={{
          background: '#0c1322',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Wind size={16} color="#0ea5e9" />
          <h3 style={{ fontSize: '14px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
            Ward Bio-HVAC Central Summary
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <EnvStat title="Mean Ward PM2.5" value={`${avgPM25} µg/m³`} sub="WHO 24h limit: 15 µg/m³" status="safe" />
          <EnvStat title="Mean Ward CO2" value={`${avgCO2} ppm`} sub="Target: < 800 ppm" status={avgCO2 > 800 ? 'warning' : 'safe'} />
          <EnvStat title="Mean Temperature" value={`${avgTemp} °C`} sub="Comfort range: 20-24 °C" status="safe" />
          <EnvStat title="Air Exchange Rate" value={`${avgACH} ACH`} sub="Infection control: ≥ 12 ACH" status="safe" />
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, subText, icon: Icon, color }) {
  return (
    <div
      style={{
        background: '#0c1322',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
          {label}
        </span>
        <Icon size={16} color={color} />
      </div>
      <div style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff', fontFamily: 'monospace', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '11px', color: '#64748b' }}>{subText}</div>
    </div>
  );
}

function MetricPill({ label, value, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 700, color, fontFamily: 'monospace' }}>{value}</div>
    </div>
  );
}

function EnvStat({ title, value, sub, status }) {
  const color = status === 'warning' ? '#f59e0b' : status === 'alert' ? '#f43f5e' : '#10b981';
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '6px', padding: '12px' }}>
      <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '16px', fontWeight: 800, color, fontFamily: 'monospace', marginBottom: '2px' }}>{value}</div>
      <div style={{ fontSize: '10px', color: '#64748b' }}>{sub}</div>
    </div>
  );
}

