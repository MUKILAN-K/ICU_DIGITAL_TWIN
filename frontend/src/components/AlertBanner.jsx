import React, { useState } from 'react';
import { AlertTriangle, X, ChevronRight, ShieldAlert } from 'lucide-react';

export default function AlertBanner({ alertRooms, onSelectRoom }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!alertRooms || alertRooms.length === 0 || isDismissed) return null;

  const count = alertRooms.length;
  const roomNames = alertRooms.map(r => r.name || r.room_id).join(', ');

  return (
    <div
      style={{
        position: 'absolute',
        top: '72px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        maxWidth: '860px',
        width: 'calc(100% - 40px)',
        background: 'rgba(28, 12, 18, 0.92)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(244, 63, 94, 0.45)',
        borderRadius: '12px',
        padding: '10px 18px',
        boxShadow: '0 10px 30px -5px rgba(244, 63, 94, 0.3), 0 4px 12px rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '14px',
        animation: 'slideDownAlert 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
      }}
    >
      <style>{`
        @keyframes slideDownAlert {
          from { opacity: 0; transform: translate(-50%, -12px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      {/* Alert Icon & Text Content */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'rgba(244, 63, 94, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <ShieldAlert size={18} color="#f43f5e" />
        </div>

        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: '#f43f5e',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
              }}
            >
              WHO Threshold Breach: {count} {count > 1 ? 'Suites' : 'Suite'} Critical
            </span>
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#f43f5e',
                boxShadow: '0 0 6px #f43f5e',
              }}
            />
          </div>
          <div
            style={{
              fontSize: '12px',
              color: '#cbd5e1',
              marginTop: '1px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Immediate HVAC air exchange required for: <strong style={{ color: '#ffffff' }}>{roomNames}</strong>
          </div>
        </div>
      </div>

      {/* Action Buttons: Inspect & Dismiss */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {onSelectRoom && alertRooms.length > 0 && (
          <button
            onClick={() => onSelectRoom(alertRooms[0].room_id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(244, 63, 94, 0.2)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: '6px',
              padding: '6px 12px',
              color: '#fecdd3',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.35)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(244, 63, 94, 0.2)')}
          >
            <span>Inspect {alertRooms[0].room_id}</span>
            <ChevronRight size={13} />
          </button>
        )}

        <button
          onClick={() => setIsDismissed(true)}
          title="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
