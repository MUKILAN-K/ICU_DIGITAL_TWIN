import React, { useState } from 'react';
import {
  Heart,
  Activity,
  Wind,
  Thermometer,
  Droplets,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Gauge,
  Sparkles,
  User,
  FileText,
  ChevronRight,
  Maximize2,
  Info,
} from 'lucide-react';
import SvgVitalTrend from './SvgVitalTrend';

export default function PatientMonitoringPanel({
  bed,
  onOpenDetailedAnalytics,
  onInspect3DRoom,
}) {
  const [activeTab, setActiveTab] = useState('vitals'); // 'vitals' | 'environment'

  if (!bed) {
    return (
      <aside
        style={{
          width: '380px',
          background: 'rgba(11, 19, 35, 0.95)',
          borderLeft: '1px solid #1e293b',
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#64748b',
          fontSize: '13px',
        }}
      >
        Select an ICU Bed to view live telemetry
      </aside>
    );
  }

  const {
    roomId,
    bedNumber,
    name,
    patient,
    currentVitals,
    currentAir,
    trends = [],
    status,
    lastUpdated,
    isStale,
  } = bed;

  const statusConfig = {
    safe: {
      label: 'STABLE / NORMAL',
      badgeColor: '#10b981',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
      icon: ShieldCheck,
    },
    warning: {
      label: 'ELEVATED / WARNING',
      badgeColor: '#f59e0b',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.3)',
      icon: AlertTriangle,
    },
    alert: {
      label: 'CRITICAL ALERT',
      badgeColor: '#f43f5e',
      badgeBg: 'rgba(244, 63, 94, 0.12)',
      border: 'rgba(244, 63, 94, 0.35)',
      icon: ShieldAlert,
    },
  }[status] || {
    label: 'MONITORING',
    badgeColor: '#0ea5e9',
    badgeBg: 'rgba(14, 165, 233, 0.1)',
    border: 'rgba(14, 165, 233, 0.25)',
    icon: ShieldCheck,
  };

  const StatusIcon = statusConfig.icon;

  // Format timestamp
  const timeString = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '--:--:--';

  return (
    <aside
      style={{
        width: '380px',
        height: '100%',
        background: '#0c1322',
        borderLeft: '1px solid #1e293b',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        color: '#f8fafc',
        flexShrink: 0,
        zIndex: 20,
      }}
    >
      {/* ─── 1. TOP HEADER & BED IDENTIFIER ────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #1e293b',
          background: 'rgba(15, 23, 42, 0.65)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: statusConfig.badgeColor,
                boxShadow: `0 0 6px ${statusConfig.badgeColor}`,
              }}
            />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.05em' }}>
              {bedNumber.toUpperCase()}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b' }}>•</span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>{roomId}</span>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: statusConfig.badgeBg,
              border: `1px solid ${statusConfig.border}`,
              color: statusConfig.badgeColor,
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}
          >
            <StatusIcon size={12} />
            <span>{statusConfig.label}</span>
          </div>
        </div>

        <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff', marginBottom: '4px' }}>
          {patient?.name || 'Unassigned Patient'}
        </div>

        <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.3 }}>
          {patient?.age}y {patient?.gender} • {patient?.primaryDiagnosis || 'Observation'}
        </div>
      </div>

      {/* ─── 2. SIMULATION & STALE WARNING BANNER ───────────────────── */}
      <div
        style={{
          padding: '8px 20px',
          background: 'rgba(14, 165, 233, 0.06)',
          borderBottom: '1px solid rgba(14, 165, 233, 0.12)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#38bdf8' }}>
          <Info size={13} />
          <span style={{ fontWeight: 600 }}>DEMO DATA</span>
          <span style={{ color: '#64748b' }}>• Not clinically validated</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b' }}>
          <Clock size={12} />
          <span style={{ fontFamily: 'monospace' }}>{timeString}</span>
        </div>
      </div>

      {/* ─── 3. SEGMENTED NAVIGATION TABS ───────────────────────────── */}
      <div
        style={{
          display: 'flex',
          padding: '12px 20px 8px 20px',
          gap: '8px',
        }}
      >
        <button
          onClick={() => setActiveTab('vitals')}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: '6px',
            border: activeTab === 'vitals' ? '1px solid #0284c7' : '1px solid #1e293b',
            background: activeTab === 'vitals' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'vitals' ? '#ffffff' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Activity size={14} color={activeTab === 'vitals' ? '#38bdf8' : '#64748b'} />
          <span>Patient Vitals</span>
        </button>

        <button
          onClick={() => setActiveTab('environment')}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: '6px',
            border: activeTab === 'environment' ? '1px solid #0284c7' : '1px solid #1e293b',
            background: activeTab === 'environment' ? 'rgba(2, 132, 199, 0.2)' : 'rgba(15, 23, 42, 0.6)',
            color: activeTab === 'environment' ? '#ffffff' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            transition: 'all 0.15s ease',
          }}
        >
          <Wind size={14} color={activeTab === 'environment' ? '#38bdf8' : '#64748b'} />
          <span>HVAC & Room Air</span>
        </button>
      </div>

      {/* ─── 4. TELEMETRY CARDS BODY ────────────────────────────────── */}
      <div style={{ flex: 1, padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {activeTab === 'vitals' ? (
          <>
            {/* Heart Rate */}
            <VitalCard
              label="HEART RATE"
              value={currentVitals.heartRate}
              unit="bpm"
              normalRange="60 - 100"
              icon={Heart}
              color="#10b981"
              isWarning={currentVitals.heartRate > 100 || currentVitals.heartRate < 60}
              isAlert={currentVitals.heartRate > 115 || currentVitals.heartRate < 50}
              trendChart={
                <SvgVitalTrend
                  type="ecg"
                  color={
                    currentVitals.heartRate > 115 || currentVitals.heartRate < 50
                      ? '#f43f5e'
                      : currentVitals.heartRate > 100
                      ? '#f59e0b'
                      : '#10b981'
                  }
                  status={status}
                  width={110}
                  height={32}
                />
              }
            />

            {/* SpO2 Oxygen Saturation */}
            <VitalCard
              label="SpO2 PULSE OXIMETRY"
              value={currentVitals.spo2}
              unit="%"
              normalRange="≥ 95%"
              icon={Activity}
              color="#0ea5e9"
              isWarning={currentVitals.spo2 < 95 && currentVitals.spo2 >= 90}
              isAlert={currentVitals.spo2 < 90}
              trendChart={
                <SvgVitalTrend
                  type="pleth"
                  color={
                    currentVitals.spo2 < 90 ? '#f43f5e' : currentVitals.spo2 < 95 ? '#f59e0b' : '#0ea5e9'
                  }
                  status={status}
                  width={110}
                  height={32}
                />
              }
            />

            {/* Respiratory Rate */}
            <VitalCard
              label="RESPIRATORY RATE"
              value={currentVitals.respiratoryRate}
              unit="rpm"
              normalRange="12 - 20"
              icon={Wind}
              color="#14b8a6"
              isWarning={currentVitals.respiratoryRate > 20 || currentVitals.respiratoryRate < 12}
              isAlert={currentVitals.respiratoryRate > 26 || currentVitals.respiratoryRate < 10}
              trendChart={
                <SvgVitalTrend
                  type="trend"
                  data={trends}
                  dataKey="respiratoryRate"
                  color="#14b8a6"
                  width={110}
                  height={32}
                  minVal={8}
                  maxVal={32}
                />
              }
            />

            {/* Blood Pressure */}
            <VitalCard
              label="NIBP BLOOD PRESSURE"
              value={`${currentVitals.systolicBP} / ${currentVitals.diastolicBP}`}
              unit="mmHg"
              normalRange="90-130 / 60-85"
              icon={Gauge}
              color="#a855f7"
              isWarning={currentVitals.systolicBP > 135 || currentVitals.systolicBP < 90}
              isAlert={currentVitals.systolicBP > 145 || currentVitals.systolicBP < 80}
              trendChart={
                <SvgVitalTrend
                  type="trend"
                  data={trends}
                  dataKey="systolicBP"
                  color="#a855f7"
                  width={110}
                  height={32}
                  minVal={70}
                  maxVal={165}
                />
              }
            />

            {/* Core Body Temperature */}
            <VitalCard
              label="CORE BODY TEMP"
              value={currentVitals.temperature}
              unit="°C"
              normalRange="36.2 - 37.5"
              icon={Thermometer}
              color="#f97316"
              isWarning={currentVitals.temperature > 37.5 || currentVitals.temperature < 36.2}
              isAlert={currentVitals.temperature > 38.3 || currentVitals.temperature < 35.5}
              trendChart={
                <SvgVitalTrend
                  type="trend"
                  data={trends}
                  dataKey="temperature"
                  color="#f97316"
                  width={110}
                  height={32}
                  minVal={35}
                  maxVal={39.5}
                />
              }
            />
          </>
        ) : (
          <>
            {/* Environmental / HVAC metrics */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              <MiniMetricCard
                title="PM2.5"
                value={currentAir.pm25}
                unit="µg/m³"
                threshold="< 15.0 WHO"
                color={currentAir.pm25 > 35 ? '#f43f5e' : currentAir.pm25 > 15 ? '#f59e0b' : '#10b981'}
              />
              <MiniMetricCard
                title="PM10"
                value={currentAir.pm10}
                unit="µg/m³"
                threshold="< 45.0 WHO"
                color={currentAir.pm10 > 75 ? '#f43f5e' : currentAir.pm10 > 45 ? '#f59e0b' : '#10b981'}
              />
              <MiniMetricCard
                title="CO2 CONC."
                value={Math.round(currentAir.co2)}
                unit="ppm"
                threshold="< 800 ASHRAE"
                color={currentAir.co2 > 1000 ? '#f43f5e' : currentAir.co2 > 800 ? '#f59e0b' : '#10b981'}
              />
              <MiniMetricCard
                title="AIR CHANGES"
                value={currentAir.airChangesPerHour}
                unit="ACH"
                threshold="≥ 12.0 ACH"
                color={currentAir.airChangesPerHour < 8 ? '#f43f5e' : currentAir.airChangesPerHour < 12 ? '#f59e0b' : '#10b981'}
              />
            </div>

            <div
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>ROOM PRESSURE GRADIENT</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: currentAir.pressureGradient < 0 ? '#38bdf8' : '#10b981',
                  }}
                >
                  {currentAir.pressureGradient > 0 ? `+${currentAir.pressureGradient}` : currentAir.pressureGradient} Pa
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.3 }}>
                {roomId === 'ICU-101'
                  ? 'Negative pressure airflow isolation maintained to contain airborne pathogens.'
                  : 'Positive pressure sterile airflow preventing corridor particulate ingress.'}
              </div>
            </div>

            <div
              style={{
                background: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: '8px',
                padding: '12px 14px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>AMBIENT CLIMATE</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#f8fafc' }}>
                  {currentAir.temperature}°C • {currentAir.humidity}% RH
                </span>
              </div>
              <div style={{ width: '100%', height: '5px', background: '#1e293b', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, (currentAir.humidity / 70) * 100)}%`,
                    height: '100%',
                    background: currentAir.humidity > 60 ? '#f59e0b' : '#0ea5e9',
                  }}
                />
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─── 5. CLINICAL ACTIONS FOOTER ─────────────────────────────── */}
      <div
        style={{
          padding: '16px 20px',
          borderTop: '1px solid #1e293b',
          background: 'rgba(15, 23, 42, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <button
          onClick={onInspect3DRoom}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '9px 14px',
            borderRadius: '6px',
            border: '1px solid #0284c7',
            background: 'rgba(2, 132, 199, 0.15)',
            color: '#38bdf8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(2, 132, 199, 0.28)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(2, 132, 199, 0.15)';
          }}
        >
          <Maximize2 size={14} />
          <span>Inspect 3D Room Interior</span>
        </button>

        <button
          onClick={onOpenDetailedAnalytics}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            width: '100%',
            padding: '9px 14px',
            borderRadius: '6px',
            border: '1px solid #1e293b',
            background: '#0f172a',
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#ffffff';
            e.currentTarget.style.borderColor = '#334155';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.borderColor = '#1e293b';
          }}
        >
          <FileText size={14} />
          <span>Full 60-Minute Analytics</span>
        </button>
      </div>
    </aside>
  );
}

/** Reusable Clinical Vital Card */
function VitalCard({
  label,
  value,
  unit,
  normalRange,
  icon: Icon,
  color,
  isWarning,
  isAlert,
  trendChart,
}) {
  const valueColor = isAlert ? '#f43f5e' : isWarning ? '#f59e0b' : '#f8fafc';
  const cardBorder = isAlert ? 'rgba(244, 63, 94, 0.35)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : '#1e293b';

  return (
    <div
      style={{
        background: '#0f172a',
        border: `1px solid ${cardBorder}`,
        borderRadius: '8px',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'border-color 0.2s ease',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <Icon size={12} color={color} />
          <span style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.04em' }}>
            {label}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '5px' }}>
          <span
            style={{
              fontSize: '20px',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '-0.02em',
              color: valueColor,
            }}
          >
            {value}
          </span>
          <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{unit}</span>
        </div>

        <div style={{ fontSize: '10px', color: '#475569', marginTop: '2px' }}>
          Ref: {normalRange} {unit}
        </div>
      </div>

      {trendChart && <div style={{ marginLeft: '12px' }}>{trendChart}</div>}
    </div>
  );
}

/** Mini Square Environmental Metric Card */
function MiniMetricCard({ title, value, unit, threshold, color }) {
  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '8px',
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: '10px', fontWeight: 700, color: '#94a3b8', marginBottom: '4px' }}>
        {title}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
        <span style={{ fontSize: '18px', fontWeight: 800, color, fontFamily: 'monospace' }}>
          {value}
        </span>
        <span style={{ fontSize: '10px', color: '#64748b' }}>{unit}</span>
      </div>
      <div style={{ fontSize: '10px', color: '#475569', marginTop: '3px' }}>{threshold}</div>
    </div>
  );
}

