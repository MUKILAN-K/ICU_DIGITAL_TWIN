import React, { useState } from 'react';
import {
  Heart,
  Droplets,
  Wind,
  Thermometer,
  Activity,
  LineChart,
  Clock,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
} from 'lucide-react';

/**
 * Professional Biomedical Waveform Sparkline with Gradient Area Fill
 * Replaces generic raw zig-zags with smooth medical-grade curves.
 */
function ClinicalSparkline({ color = '#10b981', status = 'safe', height = 32, width = 84 }) {
  const gradientId = `spark-grad-${status}-${Math.random().toString(36).substr(2, 6)}`;

  // Tailored curve paths for normal vs stressed vitals
  const isAlert = status === 'alert';
  const isWarning = status === 'warning';

  let pathD = 'M 0 16 Q 14 16 20 16 L 24 10 L 28 22 L 32 4 L 36 28 L 40 16 L 48 16 Q 56 16 62 13 L 68 18 L 74 16 L 84 16';
  let areaD = `${pathD} L 84 32 L 0 32 Z`;

  if (isAlert) {
    pathD = 'M 0 16 Q 12 16 18 16 L 22 6 L 26 26 L 30 2 L 34 30 L 38 16 L 46 16 L 50 8 L 54 24 L 58 16 L 84 16';
    areaD = `${pathD} L 84 32 L 0 32 Z`;
  } else if (isWarning) {
    pathD = 'M 0 16 Q 14 16 20 16 L 24 9 L 28 23 L 32 6 L 36 26 L 40 16 L 50 16 L 54 12 L 58 20 L 62 16 L 84 16';
    areaD = `${pathD} L 84 32 L 0 32 Z`;
  }

  return (
    <div style={{ position: 'relative', width: `${width}px`, height: `${height}px`, flexShrink: 0 }}>
      <svg width={width} height={height} viewBox="0 0 84 32" fill="none" style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.28" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Gradient Area Fill */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Crisp Waveform Line */}
        <path
          d={pathD}
          stroke={color}
          strokeWidth="2.0"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Live Pulse Dot at the end of the line */}
        <circle cx="84" cy="16" r="2.5" fill={color} />
      </svg>
    </div>
  );
}

export default function RoomTelemetryPanel({
  room,
  onOpenAnalytics,
  onEnter1stPerson,
}) {
  const [activeTab, setActiveTab] = useState('air_quality'); // 'air_quality' | 'patient_vitals'

  if (!room) return null;

  const reading = room.latest_reading || {};
  const status = room.status || 'safe';

  const config = {
    safe: {
      label: 'NORMAL',
      icon: ShieldCheck,
      color: '#10b981',
      bgPill: 'rgba(16, 185, 129, 0.12)',
      borderPill: 'rgba(16, 185, 129, 0.35)',
      accentBorder: 'rgba(16, 185, 129, 0.25)',
    },
    warning: {
      label: 'WARNING',
      icon: AlertTriangle,
      color: '#f59e0b',
      bgPill: 'rgba(245, 158, 11, 0.12)',
      borderPill: 'rgba(245, 158, 11, 0.35)',
      accentBorder: 'rgba(245, 158, 11, 0.25)',
    },
    alert: {
      label: 'CRITICAL',
      icon: AlertOctagon,
      color: '#f43f5e',
      bgPill: 'rgba(244, 63, 94, 0.15)',
      borderPill: 'rgba(244, 63, 94, 0.4)',
      accentBorder: 'rgba(244, 63, 94, 0.35)',
    },
  }[status] || {
    label: 'NORMAL',
    icon: ShieldCheck,
    color: '#10b981',
    bgPill: 'rgba(16, 185, 129, 0.12)',
    borderPill: 'rgba(16, 185, 129, 0.35)',
    accentBorder: 'rgba(16, 185, 129, 0.25)',
  };

  const StatusIcon = config.icon;

  // Patient vitals calculated synchronously with air stress
  const isAlert = status === 'alert';
  const isWarning = status === 'warning';

  const heartRate = isAlert ? 118 : isWarning ? 94 : 72;
  const spo2 = isAlert ? 88 : isWarning ? 93 : 99;
  const respRate = isAlert ? 24 : isWarning ? 19 : 14;
  const bodyTemp = isAlert ? 37.8 : isWarning ? 37.2 : 36.6;
  const bp = isAlert ? '150 / 95' : isWarning ? '135 / 88' : '120 / 80';

  const currentTimeStr = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <aside
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        width: '360px',
        maxHeight: 'calc(100% - 40px)',
        background: 'rgba(11, 17, 30, 0.88)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '20px',
        color: '#f8fafc',
        boxShadow: '0 20px 45px -10px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        zIndex: 25,
        overflowY: 'auto',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      {/* 1. Header: Room Identifier & Status Pill */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: config.color,
                boxShadow: `0 0 10px ${config.color}`,
                display: 'inline-block',
              }}
            />
            <h2
              style={{
                margin: 0,
                fontSize: '20px',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              {room.room_id}
            </h2>
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#94a3b8',
              marginTop: '4px',
              fontWeight: 500,
            }}
          >
            {room.name || `Bed 1 • ICU Suite - Floor 8`}
          </div>
        </div>

        {/* Status Pill */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: config.bgPill,
            border: `1px solid ${config.borderPill}`,
            color: config.color,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.06em',
            padding: '4px 10px',
            borderRadius: '20px',
          }}
        >
          <StatusIcon size={13} />
          <span>{config.label}</span>
        </div>
      </div>

      {/* 2. Segmented Pill Tabs */}
      <div
        style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '10px',
          padding: '3px',
          gap: '4px',
        }}
      >
        <button
          onClick={() => setActiveTab('air_quality')}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: '7px',
            border: 'none',
            background: activeTab === 'air_quality' ? '#0284c7' : 'transparent',
            color: activeTab === 'air_quality' ? '#ffffff' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: activeTab === 'air_quality' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none',
          }}
        >
          Air Quality (WHO)
        </button>

        <button
          onClick={() => setActiveTab('patient_vitals')}
          style={{
            flex: 1,
            padding: '7px 12px',
            borderRadius: '7px',
            border: 'none',
            background: activeTab === 'patient_vitals' ? '#0284c7' : 'transparent',
            color: activeTab === 'patient_vitals' ? '#ffffff' : '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: activeTab === 'patient_vitals' ? '0 2px 8px rgba(2, 132, 199, 0.4)' : 'none',
          }}
        >
          Patient Vitals
        </button>
      </div>

      {/* 3. Parameter Rows with Medical Sparklines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activeTab === 'air_quality' ? (
          <>
            {/* PM2.5 */}
            <ParameterCard
              icon={Wind}
              name="PM2.5"
              desc="Fine Inhalable Particles"
              val={reading.pm25 !== undefined ? `${reading.pm25.toFixed(1)}` : '--'}
              unit="µg/m³"
              limit="WHO ≤ 15"
              isCritical={(reading.pm25 || 0) > 15}
              color={(reading.pm25 || 0) > 15 ? '#f43f5e' : '#10b981'}
              status={status}
            />

            {/* PM10 */}
            <ParameterCard
              icon={Wind}
              name="PM10"
              desc="Coarse Inhalable Dust"
              val={reading.pm10 !== undefined ? `${reading.pm10.toFixed(1)}` : '--'}
              unit="µg/m³"
              limit="WHO ≤ 45"
              isCritical={(reading.pm10 || 0) > 45}
              color={(reading.pm10 || 0) > 45 ? '#f43f5e' : '#10b981'}
              status={status}
            />

            {/* CO2 */}
            <ParameterCard
              icon={Activity}
              name="CO₂"
              desc="Ventilation Density"
              val={reading.co2 !== undefined ? `${Math.round(reading.co2)}` : '--'}
              unit="ppm"
              limit="WHO ≤ 1000"
              isCritical={(reading.co2 || 0) > 1000}
              color={(reading.co2 || 0) > 1000 ? '#f43f5e' : '#10b981'}
              status={status}
            />

            {/* Room Temperature */}
            <ParameterCard
              icon={Thermometer}
              name="Temperature"
              desc="HVAC Clinical Climate"
              val={reading.temperature !== undefined ? `${reading.temperature.toFixed(1)}` : '--'}
              unit="°C"
              limit="21 – 24 °C"
              isCritical={false}
              color="#38bdf8"
              status="safe"
            />

            {/* Relative Humidity */}
            <ParameterCard
              icon={Droplets}
              name="Humidity"
              desc="Antimicrobial Moisture"
              val={reading.humidity !== undefined ? `${reading.humidity.toFixed(1)}` : '--'}
              unit="%"
              limit="40 – 60 %"
              isCritical={false}
              color="#06b6d4"
              status="safe"
            />
          </>
        ) : (
          <>
            {/* Heart Rate */}
            <ParameterCard
              icon={Heart}
              name="Heart Rate"
              desc="Electrocardiogram"
              val={heartRate}
              unit="bpm"
              limit="60 – 100"
              isCritical={isAlert}
              color={isAlert ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'}
              status={status}
            />

            {/* SpO2 */}
            <ParameterCard
              icon={Droplets}
              name="SpO₂"
              desc="Pulse Oximetry"
              val={spo2}
              unit="%"
              limit="≥ 95 %"
              isCritical={isAlert}
              color={isAlert ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'}
              status={status}
            />

            {/* Respiratory Rate */}
            <ParameterCard
              icon={Wind}
              name="Respiration"
              desc="Breathing Frequency"
              val={respRate}
              unit="/min"
              limit="12 – 20"
              isCritical={isAlert}
              color={isAlert ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'}
              status={status}
            />

            {/* Body Temperature */}
            <ParameterCard
              icon={Thermometer}
              name="Body Temp"
              desc="Core Temperature"
              val={bodyTemp.toFixed(1)}
              unit="°C"
              limit="36.1 – 37.2"
              isCritical={isAlert}
              color={isAlert ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'}
              status={status}
            />

            {/* Blood Pressure */}
            <ParameterCard
              icon={Activity}
              name="Blood Pressure"
              desc="Non-Invasive NIBP"
              val={bp}
              unit="mmHg"
              limit="120 / 80"
              isCritical={isAlert}
              color={isAlert ? '#f43f5e' : isWarning ? '#f59e0b' : '#10b981'}
              status={status}
            />
          </>
        )}
      </div>

      {/* 4. Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        <button
          onClick={onOpenAnalytics}
          style={{
            width: '100%',
            padding: '11px 16px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            borderRadius: '10px',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 6px 18px rgba(2, 132, 199, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.35)';
          }}
        >
          <LineChart size={16} />
          <span>View 60-Minute Analytics Chart</span>
        </button>

        {onEnter1stPerson && (
          <button
            onClick={onEnter1stPerson}
            style={{
              width: '100%',
              padding: '9px 14px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '9px',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)')}
          >
            <span>Enter First-Person 3D Room</span>
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* 5. Footer: Timestamp & Live Mode Indicator */}
      <div
        style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '12px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '11px',
          color: '#64748b',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Clock size={12} color="#64748b" />
          <span>Sync: {currentTimeStr}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontWeight: 600 }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 6px #10b981',
            }}
          />
          <span>Live (Simulated)</span>
        </div>
      </div>
    </aside>
  );
}

/** Individual Parameter Card Row */
function ParameterCard({
  icon: Icon,
  name,
  desc,
  val,
  unit,
  limit,
  isCritical,
  color,
  status,
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '9px 12px',
        background: 'rgba(255, 255, 255, 0.025)',
        border: '1px solid rgba(255, 255, 255, 0.04)',
        borderRadius: '10px',
        transition: 'background 0.15s ease',
      }}
    >
      {/* Metric Label & Numerical Value */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: isCritical ? 'rgba(244, 63, 94, 0.12)' : 'rgba(255, 255, 255, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon size={16} color={color} />
        </div>

        <div>
          <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500, lineHeight: 1.2 }}>
            {name}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginTop: '2px' }}>
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '16px',
                fontWeight: 700,
                color: isCritical ? '#f43f5e' : '#ffffff',
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '-0.02em',
              }}
            >
              {val}
            </span>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>{unit}</span>
          </div>
        </div>
      </div>

      {/* Sparkline & Reference Limit */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
        <ClinicalSparkline color={color} status={status} width={76} height={26} />
        <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 500 }}>
          {limit}
        </span>
      </div>
    </div>
  );
}
