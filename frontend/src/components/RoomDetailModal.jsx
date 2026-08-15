import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Activity, ShieldCheck, AlertCircle, AlertTriangle } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { fetchRoomHistory, fetchRoomCurrent } from '../services/api';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function RoomDetailModal({ roomId, onClose, liveReadings }) {
  const [history, setHistory] = useState([]);
  const [currentInfo, setCurrentInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load 60 minutes history on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        const [histRes, currRes] = await Promise.all([
          fetchRoomHistory(roomId, 60),
          fetchRoomCurrent(roomId)
        ]);
        if (isMounted) {
          setHistory(histRes.history || []);
          setCurrentInfo(currRes);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load room analytics:', err);
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [roomId]);

  // Update history when new live WebSocket ticks arrive
  useEffect(() => {
    if (!liveReadings || liveReadings.length === 0) return;
    const roomTick = liveReadings.find(r => r.room_id === roomId);
    if (roomTick) {
      setHistory(prev => {
        // Prevent duplicate timestamp entries
        if (prev.length > 0 && prev[prev.length - 1].timestamp === roomTick.timestamp) {
          return prev;
        }
        // Append new reading and cap to ~300 data points (60 minutes at 5s interval)
        const updated = [...prev, roomTick];
        if (updated.length > 300) return updated.slice(updated.length - 300);
        return updated;
      });

      if (roomTick.breakdown) {
        setCurrentInfo(prev => ({
          ...prev,
          overall_status: roomTick.status || prev?.overall_status,
          latest_reading: roomTick,
          breakdown: roomTick.breakdown,
        }));
      }
    }
  }, [liveReadings, roomId]);

  if (!roomId) return null;

  // Chart Labels formatted as HH:mm:ss
  const labels = history.map(item => {
    try {
      const dt = new Date(item.timestamp);
      return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  });

  // Chart Common Options (Medical Sci-Fi HUD Dark Styling)
  const createChartOptions = (title, yUnit, thresholdVal = null) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 11 },
          usePointStyle: true,
        }
      },
      tooltip: {
        backgroundColor: 'rgba(10, 16, 28, 0.95)',
        titleColor: '#00f0ff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(0, 240, 255, 0.3)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 9 }, maxTicksLimit: 8 },
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.05)' },
        ticks: { color: '#64748b', font: { family: 'JetBrains Mono', size: 10 } },
        title: { display: true, text: yUnit, color: '#94a3b8', font: { size: 10 } }
      }
    }
  });

  // Chart 1: PM2.5 & PM10
  const pmData = {
    labels,
    datasets: [
      {
        label: 'PM2.5 (µg/m³)',
        data: history.map(h => h.pm25),
        borderColor: '#00f0ff',
        backgroundColor: 'rgba(0, 240, 255, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
      {
        label: 'PM10 (µg/m³)',
        data: history.map(h => h.pm10),
        borderColor: '#a855f7',
        backgroundColor: 'rgba(168, 85, 247, 0.05)',
        fill: true,
        tension: 0.35,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  // Chart 2: CO2
  const co2Data = {
    labels,
    datasets: [
      {
        label: 'CO2 Concentration (ppm)',
        data: history.map(h => h.co2),
        borderColor: '#00ff9d',
        backgroundColor: 'rgba(0, 255, 157, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  // Chart 3: Temperature
  const tempData = {
    labels,
    datasets: [
      {
        label: 'Temperature (°C)',
        data: history.map(h => h.temperature),
        borderColor: '#f97316',
        backgroundColor: 'rgba(249, 115, 22, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  // Chart 4: Humidity
  const humidityData = {
    labels,
    datasets: [
      {
        label: 'Relative Humidity (%)',
        data: history.map(h => h.humidity),
        borderColor: '#38bdf8',
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        fill: true,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      }
    ]
  };

  const status = currentInfo?.overall_status || 'safe';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.3rem' }}>
              <span className="room-id-tag">{roomId}</span>
              <div className={`status-badge badge-${status}`}>
                {status === 'safe' && <ShieldCheck size={14} />}
                {status === 'warning' && <AlertCircle size={14} />}
                {status === 'alert' && <AlertTriangle size={14} />}
                <span>{status}</span>
              </div>
            </div>
            <h2 className="brand-title" style={{ fontSize: '1.5rem' }}>
              {currentInfo?.name || `ICU Room ${roomId}`} — <span>Live Analytics</span>
            </h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--cyan-hud)' }}>
            <RefreshCw className="pulse-dot" size={24} style={{ width: 24, height: 24 }} />
            <p style={{ marginTop: '0.75rem', fontFamily: 'var(--font-mono)' }}>Loading 60-minute historical telemetry...</p>
          </div>
        ) : (
          <div className="charts-grid">
            {/* Chart 1 */}
            <div className="chart-card">
              <div className="chart-title">
                <span>Particulate Matter (PM2.5 & PM10)</span>
                <span className="chart-subtitle">WHO Safe Limit: PM2.5 ≤ 15 µg/m³</span>
              </div>
              <div style={{ height: '230px' }}>
                <Line data={pmData} options={createChartOptions('Particulate Matter', 'µg/m³')} />
              </div>
            </div>

            {/* Chart 2 */}
            <div className="chart-card">
              <div className="chart-title">
                <span>Carbon Dioxide (CO2)</span>
                <span className="chart-subtitle">Ventilation Guideline: ≤ 800 ppm</span>
              </div>
              <div style={{ height: '230px' }}>
                <Line data={co2Data} options={createChartOptions('CO2 Level', 'ppm')} />
              </div>
            </div>

            {/* Chart 3 */}
            <div className="chart-card">
              <div className="chart-title">
                <span>Thermal Comfort (Temperature)</span>
                <span className="chart-subtitle">ICU Target: 20.0 - 24.0 °C</span>
              </div>
              <div style={{ height: '230px' }}>
                <Line data={tempData} options={createChartOptions('Temperature', '°C')} />
              </div>
            </div>

            {/* Chart 4 */}
            <div className="chart-card">
              <div className="chart-title">
                <span>Relative Humidity</span>
                <span className="chart-subtitle">ICU Pathogen Control Range: 40 - 55%</span>
              </div>
              <div style={{ height: '230px' }}>
                <Line data={humidityData} options={createChartOptions('Humidity', '%')} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
