import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertCircle, AlertTriangle, ChevronRight, Wind, Thermometer, Droplets, Activity } from 'lucide-react';

export default function RoomCard({ room, onClick }) {
  const { room_id, name, status, latest_reading } = room;
  const [flash, setFlash] = useState(false);
  const prevReadingRef = useRef(latest_reading);

  // Trigger flash glow animation whenever reading updates
  useEffect(() => {
    if (latest_reading && prevReadingRef.current !== latest_reading) {
      setFlash(true);
      const timer = setTimeout(() => setFlash(false), 700);
      prevReadingRef.current = latest_reading;
      return () => clearTimeout(timer);
    }
  }, [latest_reading]);

  const getStatusIcon = (st) => {
    switch (st) {
      case 'safe':
        return <ShieldCheck size={14} />;
      case 'warning':
        return <AlertCircle size={14} />;
      case 'alert':
        return <AlertTriangle size={14} />;
      default:
        return <Activity size={14} />;
    }
  };

  const accentColor = 
    status === 'alert' ? '#ff0055' :
    status === 'warning' ? '#ffb800' : '#00ff9d';

  return (
    <div 
      className="room-card" 
      onClick={() => onClick(room_id)}
      style={{ '--card-accent-color': accentColor }}
    >
      <div className="card-header">
        <div>
          <span className="room-id-tag">{room_id}</span>
          <h3 className="room-title">{name}</h3>
        </div>
        <div className={`status-badge badge-${status}`}>
          {getStatusIcon(status)}
          <span>{status}</span>
        </div>
      </div>

      <div className="telemetry-grid">
        {/* PM2.5 */}
        <div className="telemetry-item">
          <div className="telemetry-label">
            <span>PM2.5</span>
            <Wind size={12} style={{ color: 'var(--cyan-hud)' }} />
          </div>
          <div className={`telemetry-value ${flash ? 'value-flash' : ''}`}>
            {latest_reading?.pm25 ?? '--'}
            <span className="telemetry-unit">µg/m³</span>
          </div>
        </div>

        {/* PM10 */}
        <div className="telemetry-item">
          <div className="telemetry-label">
            <span>PM10</span>
            <Wind size={12} style={{ color: 'var(--cyan-hud)' }} />
          </div>
          <div className={`telemetry-value ${flash ? 'value-flash' : ''}`}>
            {latest_reading?.pm10 ?? '--'}
            <span className="telemetry-unit">µg/m³</span>
          </div>
        </div>

        {/* CO2 */}
        <div className="telemetry-item full-width">
          <div className="telemetry-label">
            <span>CO2 Concentration</span>
            <Activity size={12} style={{ color: 'var(--cyan-hud)' }} />
          </div>
          <div className={`telemetry-value ${flash ? 'value-flash' : ''}`}>
            {latest_reading?.co2 ?? '--'}
            <span className="telemetry-unit">ppm</span>
          </div>
        </div>

        {/* Temperature */}
        <div className="telemetry-item">
          <div className="telemetry-label">
            <span>Temp</span>
            <Thermometer size={12} style={{ color: '#f97316' }} />
          </div>
          <div className={`telemetry-value ${flash ? 'value-flash' : ''}`}>
            {latest_reading?.temperature ?? '--'}
            <span className="telemetry-unit">°C</span>
          </div>
        </div>

        {/* Humidity */}
        <div className="telemetry-item">
          <div className="telemetry-label">
            <span>Humidity</span>
            <Droplets size={12} style={{ color: '#38bdf8' }} />
          </div>
          <div className={`telemetry-value ${flash ? 'value-flash' : ''}`}>
            {latest_reading?.humidity ?? '--'}
            <span className="telemetry-unit">%</span>
          </div>
        </div>
      </div>

      <div className="card-footer">
        <span>Updated real-time</span>
        <div className="card-action">
          <span>Live Analytics</span>
          <ChevronRight size={14} />
        </div>
      </div>
    </div>
  );
}
