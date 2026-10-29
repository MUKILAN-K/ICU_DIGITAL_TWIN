import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Bed,
  Users,
  Clock,
  Database,
  Home,
  Layers,
  Activity,
  Bell,
  Settings,
  ArrowLeft,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { fetchRooms } from './services/api';
import RoomDetailModal from './components/RoomDetailModal';
import AlertBanner from './components/AlertBanner';
import HospitalFloor3D from './components/HospitalFloor3D';
import HospitalExterior3D from './components/HospitalExterior3D';
import HospitalLobby3D from './components/HospitalLobby3D';
import ICURoomInterior3D from './components/ICURoomInterior3D';
import RoomTelemetryPanel from './components/RoomTelemetryPanel';

const WS_URL = 'ws://localhost:8000/ws/live';

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState('ICU-101');
  const [analyticsRoomId, setAnalyticsRoomId] = useState(null); // for 60-min modal
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected', 'connecting', 'error'
  const [lastTickReadings, setLastTickReadings] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 4 Navigation levels: 'level1_exterior' | 'level2_lobby' | 'level3_floor' | 'level4_room'
  const [level, setLevel] = useState('level3_floor'); // Default directly to the stunning Image 1 ICU Floor!
  const wsRef = useRef(null);

  // Live ticking clock (matching Image 1)
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial REST fetch to seed rooms state immediately
  useEffect(() => {
    async function loadInitial() {
      try {
        const data = await fetchRooms();
        setRooms(data);
        if (data.length > 0 && !selectedRoomId) {
          setSelectedRoomId(data[0].room_id);
        }
      } catch (err) {
        console.error('REST initial fetch error:', err);
      }
    }
    loadInitial();
  }, []);

  // WebSocket Connection Management
  useEffect(() => {
    let reconnectTimer = null;

    function connect() {
      setWsStatus('connecting');
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsStatus('connected');
        console.log('Connected to ICU Live WebSocket');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'initial_state' && payload.rooms) {
            updateRoomsFromWebSocket(payload.rooms);
            setLastTickReadings(payload.rooms);
          } else if (payload.type === 'live_update' && payload.rooms) {
            updateRoomsFromWebSocket(payload.rooms);
            setLastTickReadings(payload.rooms);
          }
        } catch (err) {
          console.error('Error parsing WS frame:', err);
        }
      };

      ws.onerror = (err) => {
        console.error('WebSocket Error:', err);
        setWsStatus('error');
      };

      ws.onclose = () => {
        setWsStatus('connecting');
        console.log('WebSocket closed. Reconnecting in 3 seconds...');
        reconnectTimer = setTimeout(connect, 3000);
      };
    }

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  function updateRoomsFromWebSocket(tickRooms) {
    setRooms((prevRooms) => {
      if (prevRooms.length === 0) {
        return tickRooms.map((tr) => ({
          room_id: tr.room_id,
          name: tr.room_id,
          status: tr.status || 'safe',
          latest_reading: tr,
        }));
      }

      const map = new Map(tickRooms.map((tr) => [tr.room_id, tr]));
      return prevRooms.map((r) => {
        const tick = map.get(r.room_id);
        if (tick) {
          return {
            ...r,
            status: tick.status || r.status,
            latest_reading: tick,
          };
        }
        return r;
      });
    });
  }

  // System status metrics summary
  const safeCount = rooms.filter((r) => r.status === 'safe').length;
  const warningCount = rooms.filter((r) => r.status === 'warning').length;
  const alertCount = rooms.filter((r) => r.status === 'alert').length;
  const alertRooms = rooms.filter((r) => r.status === 'alert');

  // Currently selected room data for Telemetry Panel & Level 4
  const selectedRoomData = rooms.find((r) => r.room_id === selectedRoomId) || rooms[0] || {
    room_id: 'ICU-101',
    name: 'Bed 1 — Isolation Unit',
    status: 'safe',
  };

  // Formatted date string matching Image 1: "Tue, 27 Oct 2026"
  const dateFormatted = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // Formatted time string matching Image 1: "03:24:18 PM"
  const timeFormatted = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#070b14',
        color: '#f8fafc',
        fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════
          1. TOP COMMAND BAR (Professional Healthcare SaaS Header)
      ══════════════════════════════════════════════════════════════ */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 24px',
          background: 'rgba(10, 15, 28, 0.96)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Brand: Metropolitan General Hospital - ICU Digital Twin */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.2) 0%, rgba(14, 165, 233, 0.1) 100%)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 10px rgba(2, 132, 199, 0.2)',
            }}
          >
            <Building2 size={20} color="#38bdf8" />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: '15px',
                letterSpacing: '-0.01em',
                color: '#ffffff',
                lineHeight: 1.2,
              }}
            >
              METROPOLITAN GENERAL HOSPITAL
            </div>
            <div
              style={{
                fontWeight: 700,
                fontSize: '11px',
                letterSpacing: '0.06em',
                color: '#0ea5e9',
                textTransform: 'uppercase',
              }}
            >
              ICU Digital Twin • Bio-HVAC HUD
            </div>
          </div>
        </div>

        {/* Center / Right Telemetry Pills Array (Matching Image 1) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Floor 8 / ICU Wing */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '8px',
              padding: '5px 12px',
            }}
          >
            <Building2 size={15} color="#38bdf8" />
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px' }}>Floor 8</div>
              <div>ICU Wing</div>
            </div>
          </div>

          {/* 5 ICU Rooms */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '8px',
              padding: '5px 12px',
            }}
          >
            <Bed size={15} color="#38bdf8" />
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px' }}>{rooms.length || 5}</div>
              <div>ICU Rooms</div>
            </div>
          </div>

          {/* 5 Monitored Beds */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '8px',
              padding: '5px 12px',
            }}
          >
            <Users size={15} color="#38bdf8" />
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
              <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px' }}>5</div>
              <div>Beds Monitored</div>
            </div>
          </div>

          {/* Live Date & Time Clock with Tabular Monospace Digits */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '8px',
              padding: '5px 12px',
            }}
          >
            <Clock size={15} color="#38bdf8" />
            <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
              <div>{dateFormatted}</div>
              <div
                style={{
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '12px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {timeFormatted}
              </div>
            </div>
          </div>

          {/* Simulation Mode Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.07)',
              borderRadius: '8px',
              padding: '5px 12px',
            }}
          >
            <Database size={15} color="#10b981" />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: 1.2 }}>
                <div style={{ color: '#ffffff', fontWeight: 600, fontSize: '12px' }}>Simulation</div>
                <div>{wsStatus === 'connected' ? 'Live Telemetry' : 'Connecting...'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Clinical Alert Notification (Dismissible, Non-intrusive) */}
      <AlertBanner
        alertRooms={alertRooms}
        onSelectRoom={(id) => {
          setSelectedRoomId(id);
          setLevel('level3_floor');
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          2. MAIN WORKSPACE: SIDEBAR + 3D VIEWPORT
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Left Navigation Sidebar (Refined Spacing & Polish) */}
        <nav
          style={{
            width: '190px',
            background: 'rgba(10, 15, 26, 0.98)',
            borderRight: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '16px 10px',
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {/* Section Tag */}
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#475569',
                letterSpacing: '0.08em',
                padding: '4px 12px 8px 12px',
                textTransform: 'uppercase',
              }}
            >
              Navigation
            </div>

            {/* Overview / Campus Exterior */}
            <SidebarButton
              icon={Home}
              label="Overview"
              isActive={level === 'level1_exterior'}
              onClick={() => setLevel('level1_exterior')}
            />

            {/* ICU Floor (Image 1 Active Mode) */}
            <SidebarButton
              icon={Layers}
              label="ICU Floor"
              isActive={level === 'level3_floor'}
              onClick={() => setLevel('level3_floor')}
            />

            {/* Reception Lobby */}
            <SidebarButton
              icon={Building2}
              label="Lobby Hub"
              isActive={level === 'level2_lobby'}
              onClick={() => setLevel('level2_lobby')}
            />

            {/* Patient Vitals / First-Person Room */}
            <SidebarButton
              icon={Activity}
              label="Patient Vitals"
              isActive={level === 'level4_room'}
              onClick={() => setLevel('level4_room')}
            />

            {/* Alerts with Badge */}
            <button
              onClick={() => {
                if (alertRooms.length > 0) {
                  setSelectedRoomId(alertRooms[0].room_id);
                  setLevel('level3_floor');
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: '#94a3b8',
                fontWeight: 500,
                fontSize: '13px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#94a3b8';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={17} color={alertCount > 0 ? '#f43f5e' : '#94a3b8'} />
                <span>Alerts</span>
              </div>
              {alertCount > 0 && (
                <span
                  style={{
                    background: '#f43f5e',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 700,
                    borderRadius: '10px',
                    padding: '2px 7px',
                    boxShadow: '0 0 10px rgba(244, 63, 94, 0.6)',
                  }}
                >
                  {alertCount}
                </span>
              )}
            </button>
          </div>

          {/* Footer Settings Item */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '12px' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                border: 'none',
                background: 'transparent',
                color: '#64748b',
                fontWeight: 500,
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#94a3b8';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#64748b';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Settings size={15} />
              <span>Settings</span>
            </button>

            <div style={{ padding: '0 12px', fontSize: '10px', color: '#475569' }}>
              Twin Core v2.4 • EVS 2026
            </div>
          </div>
        </nav>

        {/* Center / Full 3D Canvas Host Container */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Level 1: Exterior */}
          {level === 'level1_exterior' && (
            <HospitalExterior3D
              rooms={rooms}
              onEnterFloor={() => setLevel('level2_lobby')}
            />
          )}

          {/* Level 2: Lobby */}
          {level === 'level2_lobby' && (
            <HospitalLobby3D
              rooms={rooms}
              onEnterICUFloor={() => setLevel('level3_floor')}
            />
          )}

          {/* Level 3: ICU Floor (Exact 3D Cutaway Matching Image 1) */}
          {level === 'level3_floor' && (
            <>
              <HospitalFloor3D
                rooms={rooms}
                selectedRoomId={selectedRoomId}
                onRoomClick={(id) => setSelectedRoomId(id)}
                onSelectRoom={(id) => setSelectedRoomId(id)}
              />

              {/* Right Side Telemetry Card (Matching Image 1) */}
              <RoomTelemetryPanel
                room={selectedRoomData}
                onOpenAnalytics={() => setAnalyticsRoomId(selectedRoomId)}
                onEnter1stPerson={() => setLevel('level4_room')}
              />
            </>
          )}

          {/* Level 4: Room Interior */}
          {level === 'level4_room' && (
            <ICURoomInterior3D
              room={selectedRoomData}
              onOpenAnalytics={() => setAnalyticsRoomId(selectedRoomId || 'ICU-101')}
            />
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. DETAILED 60-MINUTE HISTORICAL CHART MODAL
      ══════════════════════════════════════════════════════════════ */}
      {analyticsRoomId && (
        <RoomDetailModal
          roomId={analyticsRoomId}
          onClose={() => setAnalyticsRoomId(null)}
          liveReadings={lastTickReadings}
        />
      )}
    </div>
  );
}

/** Professional Sidebar Button with Smooth Hover / Active Transitions */
function SidebarButton({ icon: Icon, label, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        width: '100%',
        padding: '10px 12px',
        borderRadius: '8px',
        border: 'none',
        background: isActive
          ? 'linear-gradient(90deg, rgba(2, 132, 199, 0.22) 0%, rgba(2, 132, 199, 0.04) 100%)'
          : 'transparent',
        borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
        color: isActive ? '#ffffff' : '#94a3b8',
        fontWeight: isActive ? 600 : 500,
        fontSize: '13px',
        cursor: 'pointer',
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
          e.currentTarget.style.color = '#ffffff';
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#94a3b8';
        }
      }}
    >
      <Icon size={17} color={isActive ? '#38bdf8' : '#94a3b8'} />
      <span>{label}</span>
    </button>
  );
}
