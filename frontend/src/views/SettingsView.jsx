import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  AlertTriangle,
  ShieldCheck,
  Activity,
  Wind,
  Info,
  Check,
} from 'lucide-react';
import { useICU } from '../context/ICUContext';
import { DEMO_THRESHOLDS } from '../services/dataManager';

export default function SettingsView() {
  const {
    thresholds,
    setThresholds,
    isSimulationPaused,
    togglePause,
    simulationSpeedSeconds,
    setSpeed,
    activeScenario,
    triggerScenario,
    selectedRoomId,
    wsStatus,
  } = useICU();

  const [savedNotification, setSavedNotification] = useState(false);

  function handleThresholdChange(category, key, value) {
    const num = parseFloat(value);
    if (isNaN(num)) return;

    setThresholds((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: num,
      },
    }));

    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  }

  function handleReset() {
    setThresholds(DEMO_THRESHOLDS);
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2000);
  }

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
      {/* ─── HEADER ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <Settings size={18} color="#0ea5e9" />
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
            System Configuration & Demonstration Thresholds
          </h1>
        </div>
        <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
          Configure demonstration threshold parameters, simulation clock speeds, and repeatable simulation scenarios.
        </p>
      </div>

      {/* ─── CLINICAL DISCLAIMER BANNER ─────────────────────────────── */}
      <div
        style={{
          background: 'rgba(14, 165, 233, 0.08)',
          border: '1px solid rgba(14, 165, 233, 0.25)',
          borderRadius: '8px',
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '28px',
        }}
      >
        <Info size={18} color="#38bdf8" style={{ marginTop: '2px', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8', marginBottom: '2px' }}>
            DEMONSTRATION / SIMULATION DATASET NOTICE
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: 1.4 }}>
            Thresholds configured here are used strictly for software testing, visual digital-twin demonstrations, and
            system UI behavior evaluation. They are <strong>not clinically validated medical guidelines</strong> and
            must not be used for diagnostic or clinical treatment decisions.
          </div>
        </div>
      </div>

      {/* ─── SIMULATION SCENARIO TRIGGER CONTROLS (Phase 4 & 5) ──────── */}
      <div
        style={{
          background: '#0c1322',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <Sliders size={16} color="#0ea5e9" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
            Repeatable Simulation Scenario Injection
          </h2>
        </div>
        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0' }}>
          Active Mode: <strong style={{ color: '#38bdf8' }}>{activeScenario.toUpperCase()}</strong>. Target Room: <strong style={{ color: '#ffffff' }}>{selectedRoomId}</strong>
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
          <button
            onClick={() => triggerScenario('stable')}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: activeScenario === 'stable' ? '1px solid #0284c7' : '1px solid #1e293b',
              background: activeScenario === 'stable' ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
              color: activeScenario === 'stable' ? '#38bdf8' : '#f8fafc',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>Stable Baseline</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Normal optimal ranges</div>
          </button>

          <button
            onClick={() => triggerScenario('increasing', selectedRoomId)}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: activeScenario === 'increasing' ? '1px solid #0284c7' : '1px solid #1e293b',
              background: activeScenario === 'increasing' ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
              color: activeScenario === 'increasing' ? '#38bdf8' : '#f8fafc',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>Gradual Drift</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Creeping accumulation</div>
          </button>

          <button
            onClick={() => triggerScenario('sudden_spike', selectedRoomId)}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: activeScenario === 'sudden_spike' ? '1px solid #0284c7' : '1px solid #1e293b',
              background: activeScenario === 'sudden_spike' ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
              color: activeScenario === 'sudden_spike' ? '#38bdf8' : '#f8fafc',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>Sudden Acute Spike</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Aerosol / Sterilizer spill</div>
          </button>

          <button
            onClick={() => triggerScenario('room_disturbance', selectedRoomId)}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: activeScenario === 'room_disturbance' ? '1px solid #0284c7' : '1px solid #1e293b',
              background: activeScenario === 'room_disturbance' ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
              color: activeScenario === 'room_disturbance' ? '#38bdf8' : '#f8fafc',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>Room Disturbance</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Target only {selectedRoomId}</div>
          </button>

          <button
            onClick={() => triggerScenario('recovery', selectedRoomId)}
            style={{
              padding: '10px 14px',
              borderRadius: '6px',
              border: activeScenario === 'recovery' ? '1px solid #0284c7' : '1px solid #1e293b',
              background: activeScenario === 'recovery' ? 'rgba(2, 132, 199, 0.2)' : '#0f172a',
              color: activeScenario === 'recovery' ? '#38bdf8' : '#f8fafc',
              fontWeight: 600,
              fontSize: '12px',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div>HVAC Purge Recovery</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>Rapid baseline return</div>
          </button>
        </div>
      </div>

      {/* ─── SIMULATION ENGINE CONTROLS ─────────────────────────────── */}
      <div
        style={{
          background: '#0c1322',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              Simulation Engine Controls
            </h2>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Connection Source:{' '}
              <span style={{ color: wsStatus === 'connected' ? '#10b981' : '#38bdf8', fontWeight: 600 }}>
                {wsStatus === 'connected' ? 'FastAPI WebSocket Backend (Live)' : 'Internal Simulation Engine'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={togglePause}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid #0284c7',
                background: isSimulationPaused ? 'rgba(2, 132, 199, 0.2)' : 'rgba(15, 23, 42, 0.8)',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSimulationPaused ? <Play size={14} /> : <Pause size={14} />}
              <span>{isSimulationPaused ? 'Resume Simulation' : 'Pause Simulation'}</span>
            </button>

            <button
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                border: '1px solid #1e293b',
                background: '#0f172a',
                color: '#94a3b8',
                fontSize: '12px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        {/* Speed Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Heartbeat Interval:</span>
          {[1.0, 2.5, 5.0, 10.0].map((sec) => (
            <button
              key={sec}
              onClick={() => setSpeed(sec)}
              style={{
                padding: '5px 12px',
                borderRadius: '5px',
                border: simulationSpeedSeconds === sec ? '1px solid #0284c7' : '1px solid #1e293b',
                background: simulationSpeedSeconds === sec ? 'rgba(2, 132, 199, 0.25)' : '#0f172a',
                color: simulationSpeedSeconds === sec ? '#ffffff' : '#94a3b8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {sec}s {sec === 5.0 ? '(Standard)' : sec === 1.0 ? '(Fast)' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ENVIRONMENTAL AIR QUALITY THRESHOLDS ──────────────────── */}
      <div
        style={{
          background: '#0c1322',
          border: '1px solid #1e293b',
          borderRadius: '10px',
          padding: '20px',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Wind size={16} color="#0ea5e9" />
          <h2 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
            Bio-HVAC Air Quality Thresholds (WHO / ASHRAE Standards)
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <ThresholdRow
            label="PM2.5 Warning Limit"
            unit="µg/m³"
            value={thresholds.pm25.normalMax}
            onChange={(v) => handleThresholdChange('pm25', 'normalMax', v)}
          />
          <ThresholdRow
            label="PM2.5 Critical Limit"
            unit="µg/m³"
            value={thresholds.pm25.warningMax}
            onChange={(v) => handleThresholdChange('pm25', 'warningMax', v)}
          />

          <ThresholdRow
            label="PM10 Warning Limit"
            unit="µg/m³"
            value={thresholds.pm10.normalMax}
            onChange={(v) => handleThresholdChange('pm10', 'normalMax', v)}
          />
          <ThresholdRow
            label="PM10 Critical Limit"
            unit="µg/m³"
            value={thresholds.pm10.warningMax}
            onChange={(v) => handleThresholdChange('pm10', 'warningMax', v)}
          />

          <ThresholdRow
            label="CO2 Warning Limit"
            unit="ppm"
            value={thresholds.co2.normalMax}
            onChange={(v) => handleThresholdChange('co2', 'normalMax', v)}
          />
          <ThresholdRow
            label="CO2 Critical Limit"
            unit="ppm"
            value={thresholds.co2.warningMax}
            onChange={(v) => handleThresholdChange('co2', 'warningMax', v)}
          />

          <ThresholdRow
            label="Ambient Temp Safe Max"
            unit="°C"
            value={thresholds.temperature.normalMax}
            onChange={(v) => handleThresholdChange('temperature', 'normalMax', v)}
          />
          <ThresholdRow
            label="Ambient Temp Critical Max"
            unit="°C"
            value={thresholds.temperature.warningMax}
            onChange={(v) => handleThresholdChange('temperature', 'warningMax', v)}
          />
        </div>
      </div>

      {savedNotification && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#10b981',
            color: '#ffffff',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            zIndex: 100,
          }}
        >
          <Check size={14} />
          <span>Thresholds Updated</span>
        </div>
      )}
    </div>
  );
}

function ThresholdRow({ label, unit, value, onChange }) {
  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '6px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '11px', color: '#64748b' }}>Unit: {unit}</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            width: '74px',
            background: '#0c1322',
            border: '1px solid #334155',
            borderRadius: '4px',
            padding: '5px 8px',
            color: '#38bdf8',
            fontSize: '13px',
            fontWeight: 700,
            fontFamily: 'monospace',
            textAlign: 'right',
          }}
        />
        <span style={{ fontSize: '11px', color: '#94a3b8', width: '32px' }}>{unit}</span>
      </div>
    </div>
  );
}
