import React from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AlertBanner({ alertRooms }) {
  if (!alertRooms || alertRooms.length === 0) return null;

  return (
    <div className="alert-banner">
      <div className="alert-content">
        <AlertTriangle className="alert-icon" size={28} />
        <div>
          <div className="alert-title">
            EMERGENCY AIR QUALITY ALERT — {alertRooms.length} ROOM{alertRooms.length > 1 ? 'S' : ''} CRITICAL
          </div>
          <div className="alert-desc">
            Immediate HVAC intervention required for: {alertRooms.map(r => r.name || r.room_id).join(', ')}. Parameter limits exceeded WHO safety thresholds.
          </div>
        </div>
      </div>
    </div>
  );
}
