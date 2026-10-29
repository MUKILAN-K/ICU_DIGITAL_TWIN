import React, { useState } from 'react';
import { ShieldAlert, X, ChevronRight } from 'lucide-react';

export default function AlertBanner({ alertRooms = [], onSelectRoom }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (!alertRooms || alertRooms.length === 0 || isDismissed) return null;

  const count = alertRooms.length;
  const primaryRoom = alertRooms[0];
  const roomId = primaryRoom.roomId || primaryRoom.room_id || 'ICU-104';
  const bedNum = primaryRoom.bedNumber || 'Bed 4';

  return (
    <div
      style={{
        position: 'absolute',
        top: '64px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        maxWidth: '720px',
        width: 'calc(100% - 32px)',
        background: '#160d13',
        border: '1px solid #e11d48',
        borderRadius: '6px',
        padding: '8px 14px',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <ShieldAlert size={16} color="#f43f5e" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: '12px', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          <strong style={{ color: '#f43f5e' }}>CRITICAL ALERT ({count}):</strong> {bedNum} ({roomId}) physiological threshold exceeded
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          onClick={() => onSelectRoom(roomId)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            borderRadius: '4px',
            border: '1px solid #f43f5e',
            background: 'rgba(244, 63, 94, 0.15)',
            color: '#f8fafc',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span>Triage Bed</span>
          <ChevronRight size={13} />
        </button>

        <button
          onClick={() => setIsDismissed(true)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
          title="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
