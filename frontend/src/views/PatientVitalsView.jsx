import React, { useState } from 'react';
import {
  Activity,
  Heart,
  Wind,
  Thermometer,
  Gauge,
  Box,
  Layers,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { useICU } from '../context/ICUContext';
import SvgVitalTrend from '../components/SvgVitalTrend';
import ICURoomInterior3D from '../components/ICURoomInterior3D';

export default function PatientVitalsView({ onOpenDetailedAnalytics }) {
  const { beds, selectedRoomId, setSelectedRoomId } = useICU();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | '3d_room'

  const selectedBed = beds.find((b) => b.roomId === selectedRoomId) || beds[0];

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#080e1a',
        color: '#f8fafc',
        overflow: 'hidden',
      }}
    >
      {/* ─── TOP SUB-HEADER BAR ─────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 24px',
          background: '#0c1322',
          borderBottom: '1px solid #1e293b',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Activity size={18} color="#0ea5e9" />
          <div>
            <h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#ffffff' }}>
              ICU Patient Vitals Station
            </h1>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Continuous multi-bed physiological telemetry & 3D room interior examination
            </div>
          </div>
        </div>

        {/* View Mode Toggle: Grid Monitor vs 3D Room */}
        <div
          style={{
            display: 'flex',
            background: '#0f172a',
            border: '1px solid #1e293b',
            borderRadius: '6px',
            padding: '2px',
          }}
        >
          <button
            onClick={() => setViewMode('grid')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: viewMode === 'grid' ? '#0284c7' : 'transparent',
              color: viewMode === 'grid' ? '#ffffff' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Layers size={13} />
            <span>Multi-Bed Grid</span>
          </button>

          <button
            onClick={() => setViewMode('3d_room')}
            style={{
              padding: '6px 12px',
              borderRadius: '4px',
              border: 'none',
              background: viewMode === '3d_room' ? '#0284c7' : 'transparent',
              color: viewMode === '3d_room' ? '#ffffff' : '#94a3b8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Box size={13} />
            <span>3D Room Model ({selectedBed?.roomId})</span>
          </button>
        </div>
      </div>

      {/* ─── BODY CONTAINER ─────────────────────────────────────────── */}
      {viewMode === 'grid' ? (
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {beds.map((bed) => {
              const isSelected = bed.roomId === selectedRoomId;
              const statusCfg = {
                safe: { label: 'NORMAL', color: '#10b981', border: '#1e293b' },
                warning: { label: 'WARNING', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.35)' },
                alert: { label: 'CRITICAL', color: '#f43f5e', border: 'rgba(244, 63, 94, 0.45)' },
              }[bed.status] || { label: 'NORMAL', color: '#10b981', border: '#1e293b' };

              return (
                <div
                  key={bed.roomId}
                  style={{
                    background: '#0c1322',
                    border: isSelected ? '1px solid #0284c7' : `1px solid ${statusCfg.border}`,
                    borderRadius: '8px',
                    padding: '16px 20px',
                    boxShadow: isSelected ? '0 0 16px rgba(2, 132, 199, 0.15)' : 'none',
                  }}
                >
                  {/* Bed Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: statusCfg.color,
                          boxShadow: `0 0 8px ${statusCfg.color}`,
                        }}
                      />
                      <span style={{ fontSize: '14px', fontWeight: 700, color: '#38bdf8' }}>
                        {bed.bedNumber} • {bed.roomId}
                      </span>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                        {bed.patient?.name} ({bed.patient?.age}y, {bed.patient?.gender})
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Dx: {bed.patient?.primaryDiagnosis}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: statusCfg.color,
                          padding: '3px 8px',
                          borderRadius: '4px',
                          background: 'rgba(15, 23, 42, 0.6)',
                          border: `1px solid ${statusCfg.color}40`,
                        }}
                      >
                        {statusCfg.label}
                      </span>

                      <button
                        onClick={() => {
                          setSelectedRoomId(bed.roomId);
                          setViewMode('3d_room');
                        }}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '4px',
                          border: '1px solid #1e293b',
                          background: '#0f172a',
                          color: '#38bdf8',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        <Box size={12} />
                        <span>View 3D</span>
                      </button>
                    </div>
                  </div>

                  {/* Bed Vitals Horizontal Grid */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                      gap: '12px',
                    }}
                  >
                    {/* Heart Rate */}
                    <VitalBox
                      title="HEART RATE"
                      value={bed.currentVitals.heartRate}
                      unit="bpm"
                      color={bed.currentVitals.heartRate > 100 ? '#f43f5e' : '#10b981'}
                      wave={
                        <SvgVitalTrend
                          type="ecg"
                          color={bed.currentVitals.heartRate > 100 ? '#f43f5e' : '#10b981'}
                          status={bed.status}
                          width={100}
                          height={28}
                        />
                      }
                    />

                    {/* SpO2 */}
                    <VitalBox
                      title="SpO2 SATURATION"
                      value={bed.currentVitals.spo2}
                      unit="%"
                      color={bed.currentVitals.spo2 < 95 ? '#f59e0b' : '#0ea5e9'}
                      wave={
                        <SvgVitalTrend
                          type="pleth"
                          color={bed.currentVitals.spo2 < 95 ? '#f59e0b' : '#0ea5e9'}
                          status={bed.status}
                          width={100}
                          height={28}
                        />
                      }
                    />

                    {/* Respiratory Rate */}
                    <VitalBox
                      title="RESP. RATE"
                      value={bed.currentVitals.respiratoryRate}
                      unit="rpm"
                      color="#14b8a6"
                      wave={
                        <SvgVitalTrend
                          type="trend"
                          data={bed.trends}
                          dataKey="respiratoryRate"
                          color="#14b8a6"
                          width={100}
                          height={28}
                          minVal={8}
                          maxVal={32}
                        />
                      }
                    />

                    {/* Blood Pressure */}
                    <VitalBox
                      title="BLOOD PRESSURE"
                      value={`${bed.currentVitals.systolicBP} / ${bed.currentVitals.diastolicBP}`}
                      unit="mmHg"
                      color="#a855f7"
                      wave={
                        <SvgVitalTrend
                          type="trend"
                          data={bed.trends}
                          dataKey="systolicBP"
                          color="#a855f7"
                          width={100}
                          height={28}
                          minVal={70}
                          maxVal={160}
                        />
                      }
                    />

                    {/* Temperature */}
                    <VitalBox
                      title="CORE TEMP"
                      value={bed.currentVitals.temperature}
                      unit="°C"
                      color="#f97316"
                      wave={
                        <SvgVitalTrend
                          type="trend"
                          data={bed.trends}
                          dataKey="temperature"
                          color="#f97316"
                          width={100}
                          height={28}
                          minVal={35}
                          maxVal={39.5}
                        />
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* 3D Room Interior Inspection using icu_room.glb */
        <div style={{ flex: 1, position: 'relative' }}>
          <ICURoomInterior3D
            room={{
              room_id: selectedBed.roomId,
              name: selectedBed.name,
              status: selectedBed.status,
              latest_reading: {
                pm25: selectedBed.currentAir.pm25,
                pm10: selectedBed.currentAir.pm10,
                co2: selectedBed.currentAir.co2,
                temperature: selectedBed.currentAir.temperature,
                humidity: selectedBed.currentAir.humidity,
              },
            }}
            onOpenAnalytics={() => onOpenDetailedAnalytics?.(selectedBed.roomId)}
          />
        </div>
      )}
    </div>
  );
}

function VitalBox({ title, value, unit, color, wave }) {
  return (
    <div
      style={{
        background: '#0f172a',
        border: '1px solid #1e293b',
        borderRadius: '6px',
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div style={{ fontSize: '10px', fontWeight: 600, color: '#94a3b8', marginBottom: '2px' }}>{title}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
          <span style={{ fontSize: '17px', fontWeight: 800, color, fontFamily: 'monospace' }}>{value}</span>
          <span style={{ fontSize: '10px', color: '#64748b' }}>{unit}</span>
        </div>
      </div>
      <div>{wave}</div>
    </div>
  );
}

