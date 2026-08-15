import React, { useState, useEffect, useRef } from 'react';
import { Monitor, ArrowLeft, ChevronRight as BreadcrumbSeparator } from 'lucide-react';
import { fetchRooms } from './services/api';
import RoomDetailModal from './components/RoomDetailModal';
import AlertBanner from './components/AlertBanner';
import HospitalFloor3D from './components/HospitalFloor3D';
import HospitalExterior3D from './components/HospitalExterior3D';
import HospitalLobby3D from './components/HospitalLobby3D';
import ICURoomInterior3D from './components/ICURoomInterior3D';

const WS_URL = 'ws://localhost:8000/ws/live';

export default function App() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [analyticsRoomId, setAnalyticsRoomId] = useState(null); // for 60-min modal
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected', 'connecting', 'error'
  const [lastTickReadings, setLastTickReadings] = useState([]);

  // 4-level 3D game-like navigation state: 'level1_exterior' | 'level2_lobby' | 'level3_floor' | 'level4_room'
  const [level, setLevel] = useState('level1_exterior');
  const wsRef = useRef(null);

  // Initial REST fetch to seed rooms state immediately
  useEffect(() => {
    async function loadInitial() {
      try {
        const data = await fetchRooms();
        setRooms(data);
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
    setRooms(prevRooms => {
      if (prevRooms.length === 0) {
        return tickRooms.map(tr => ({
          room_id: tr.room_id,
          name: tr.room_id,
          status: tr.status || 'safe',
          latest_reading: tr,
        }));
      }

      const map = new Map(tickRooms.map(tr => [tr.room_id, tr]));
      return prevRooms.map(r => {
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
  const safeCount = rooms.filter(r => r.status === 'safe').length;
  const warningCount = rooms.filter(r => r.status === 'warning').length;
  const alertCount = rooms.filter(r => r.status === 'alert').length;

  const alertRooms = rooms.filter(r => r.status === 'alert');

  // Currently selected room data for Level 4
  const selectedRoomData = rooms.find(r => r.room_id === selectedRoomId) || rooms[0];

  return (
    <div className="app-container">
      {/* Minimal HUD Header (No View Switcher Tabs) */}
      <header className="hud-header">
        <div className="brand-title">
          <Monitor size={28} style={{ color: 'var(--cyan-hud)' }} />
          <div>
            ICU AIR QUALITY <span>DIGITAL TWIN</span>
          </div>
        </div>

        <div className="hud-status-bar">
          <div className="system-stats">
            <div className="stat-pill">
              Rooms: <strong>{rooms.length}</strong>
            </div>
            <div className="stat-pill">
              Safe: <strong style={{ color: 'var(--status-safe)' }}>{safeCount}</strong>
            </div>
            <div className="stat-pill">
              Warning: <strong style={{ color: 'var(--status-warning)' }}>{warningCount}</strong>
            </div>
            <div className="stat-pill">
              Alert: <strong style={{ color: 'var(--status-alert)' }}>{alertCount}</strong>
            </div>
          </div>

          <div className={`ws-badge ws-${wsStatus}`}>
            <span className="pulse-dot"></span>
            <span>{wsStatus === 'connected' ? 'LIVE STREAMING' : 'CONNECTING WS...'}</span>
          </div>
        </div>
      </header>

      {/* Top Alert Banner */}
      <AlertBanner alertRooms={alertRooms} />

      {/* Passive Location Breadcrumb Bar (Non-Clickable Location Indicator) */}
      <nav className="breadcrumb-nav">
        <div className="breadcrumb-items">
          <span className="breadcrumb-item active">
            Level 1: Exterior
          </span>

          {(level === 'level2_lobby' || level === 'level3_floor' || level === 'level4_room') && (
            <>
              <BreadcrumbSeparator size={14} className="breadcrumb-arrow" />
              <span className="breadcrumb-item active">
                Level 2: Lobby Hub
              </span>
            </>
          )}

          {(level === 'level3_floor' || level === 'level4_room') && (
            <>
              <BreadcrumbSeparator size={14} className="breadcrumb-arrow" />
              <span className="breadcrumb-item active">
                Level 3: ICU Floor 3
              </span>
            </>
          )}

          {level === 'level4_room' && (
            <>
              <BreadcrumbSeparator size={14} className="breadcrumb-arrow" />
              <span className="breadcrumb-item active">
                Level 4: {selectedRoomId || 'Room Interior'}
              </span>
            </>
          )}
        </div>

        {/* Floating In-Scene Back Buttons per Interior Level */}
        {level === 'level2_lobby' && (
          <button className="back-exterior-btn" onClick={() => setLevel('level1_exterior')}>
            <ArrowLeft size={14} />
            <span>Exit to Level 1 Exterior</span>
          </button>
        )}

        {level === 'level3_floor' && (
          <button className="back-exterior-btn" onClick={() => setLevel('level2_lobby')}>
            <ArrowLeft size={14} />
            <span>Exit to Level 2 Lobby</span>
          </button>
        )}

        {level === 'level4_room' && (
          <button className="back-exterior-btn" onClick={() => setLevel('level3_floor')}>
            <ArrowLeft size={14} />
            <span>Exit to Level 3 ICU Floor</span>
          </button>
        )}
      </nav>

      {/* Full-Page 3D Viewport Content Area */}
      <main className="main-viewport-container">
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

        {/* Level 3: ICU Floor */}
        {level === 'level3_floor' && (
          <HospitalFloor3D
            rooms={rooms}
            selectedRoomId={selectedRoomId}
            onRoomClick={(id) => {
              setSelectedRoomId(id);
              setLevel('level4_room');
            }}
            onSelectRoom={(id) => {
              setSelectedRoomId(id);
              setLevel('level4_room');
            }}
          />
        )}

        {/* Level 4: Room Interior */}
        {level === 'level4_room' && (
          <ICURoomInterior3D
            room={selectedRoomData}
            onOpenAnalytics={() => setAnalyticsRoomId(selectedRoomId || 'ICU-101')}
          />
        )}
      </main>

      {/* Detailed 60-Minute Chart.js Analytics Modal */}
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
