import React, { useState } from 'react';
import {
  Bell,
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Filter,
  Check,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useICU } from '../context/ICUContext';

export default function AlertsView() {
  const { alerts, acknowledgeAlert, clearAcknowledgedAlerts, setSelectedRoomId, setActiveNav } = useICU();
  const [filter, setFilter] = useState('all'); // 'all' | 'unacknowledged' | 'critical' | 'warning'

  const filteredAlerts = alerts.filter((alert) => {
    if (filter === 'unacknowledged') return !alert.acknowledged;
    if (filter === 'critical') return alert.severity === 'alert';
    if (filter === 'warning') return alert.severity === 'warning';
    return true;
  });

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

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
      {/* ─── PAGE HEADER ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '24px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Bell size={18} color="#f43f5e" />
            <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#ffffff' }}>
              Clinical Alerts & Triage Audit Log
            </h1>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
            Real-time alert notifications, biometric threshold breaches, and clinical audit trail.
          </p>
        </div>

        {/* Clear Acknowledged Button */}
        <button
          onClick={clearAcknowledgedAlerts}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 12px',
            borderRadius: '6px',
            border: '1px solid #1e293b',
            background: '#0c1322',
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
          <Trash2 size={13} />
          <span>Clear Acknowledged</span>
        </button>
      </div>

      {/* ─── FILTER SEGMENTS ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '18px',
        }}
      >
        <FilterBtn
          label={`All Alerts (${alerts.length})`}
          isActive={filter === 'all'}
          onClick={() => setFilter('all')}
        />
        <FilterBtn
          label={`Active / Pending (${unacknowledgedCount})`}
          isActive={filter === 'unacknowledged'}
          onClick={() => setFilter('unacknowledged')}
          highlight={unacknowledgedCount > 0}
        />
        <FilterBtn
          label="Critical Severity"
          isActive={filter === 'critical'}
          onClick={() => setFilter('critical')}
        />
        <FilterBtn
          label="Warning Alerts"
          isActive={filter === 'warning'}
          onClick={() => setFilter('warning')}
        />
      </div>

      {/* ─── ALERTS LIST ────────────────────────────────────────────── */}
      {filteredAlerts.length === 0 ? (
        <div
          style={{
            background: '#0c1322',
            border: '1px solid #1e293b',
            borderRadius: '10px',
            padding: '48px',
            textAlign: 'center',
            color: '#64748b',
          }}
        >
          <CheckCircle size={36} color="#10b981" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#f8fafc', marginBottom: '4px' }}>
            No Alerts in Selected Filter
          </div>
          <div style={{ fontSize: '13px' }}>
            All physiological vital signs and room air quality parameters are operating within established tolerances.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filteredAlerts.map((alert) => {
            const isCritical = alert.severity === 'alert';
            const statusColor = isCritical ? '#f43f5e' : '#f59e0b';
            const statusBg = isCritical ? 'rgba(244, 63, 94, 0.08)' : 'rgba(245, 158, 11, 0.08)';
            const statusBorder = isCritical ? 'rgba(244, 63, 94, 0.3)' : 'rgba(245, 158, 11, 0.3)';
            const StatusIcon = isCritical ? ShieldAlert : AlertTriangle;

            const timeFormatted = new Date(alert.timestamp).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            });

            return (
              <div
                key={alert.id}
                style={{
                  background: '#0c1322',
                  border: `1px solid ${alert.acknowledged ? '#1e293b' : statusBorder}`,
                  borderLeft: `4px solid ${statusColor}`,
                  borderRadius: '8px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  opacity: alert.acknowledged ? 0.65 : 1.0,
                  transition: 'opacity 0.2s ease',
                }}
              >
                {/* Left: Icon & Message */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '6px',
                      background: statusBg,
                      border: `1px solid ${statusBorder}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <StatusIcon size={18} color={statusColor} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
                        {alert.bedNumber} ({alert.roomId})
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>•</span>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: statusColor }}>
                        {alert.metric}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>•</span>
                      <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {timeFormatted}
                      </span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 500, color: '#ffffff' }}>
                      {alert.message}
                    </div>
                  </div>
                </div>

                {/* Center Value */}
                <div style={{ marginRight: '24px', textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Recorded Reading</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', fontFamily: 'monospace' }}>
                    {alert.value}
                  </div>
                </div>

                {/* Right: Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => acknowledgeAlert(alert.id)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        border: '1px solid #0284c7',
                        background: 'rgba(2, 132, 199, 0.2)',
                        color: '#38bdf8',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Check size={13} />
                      <span>Acknowledge</span>
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={13} />
                      <span>Acknowledged</span>
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setSelectedRoomId(alert.roomId);
                      setActiveNav('icu_floor');
                    }}
                    title="Jump to 3D Bed Twin"
                    style={{
                      padding: '6px 10px',
                      borderRadius: '4px',
                      border: '1px solid #1e293b',
                      background: '#0f172a',
                      color: '#94a3b8',
                      fontSize: '11px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span>View 3D</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterBtn({ label, isActive, onClick, highlight }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 14px',
        borderRadius: '6px',
        border: isActive ? '1px solid #0284c7' : '1px solid #1e293b',
        background: isActive ? 'rgba(2, 132, 199, 0.2)' : '#0c1322',
        color: isActive ? '#ffffff' : highlight ? '#f43f5e' : '#94a3b8',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
    >
      {label}
    </button>
  );
}

