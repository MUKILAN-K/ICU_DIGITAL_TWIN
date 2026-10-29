import React, { useState, useEffect, lazy, Suspense } from 'react';
import {
  Building2,
  Layers,
  Activity,
  Bell,
  Settings,
  Bed,
  Users,
  Clock,
  Database,
  Radio,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { ICUProvider, useICU } from './context/ICUContext';
import HospitalFloor3D from './components/HospitalFloor3D';
import PatientMonitoringPanel from './components/PatientMonitoringPanel';
import AlertBanner from './components/AlertBanner';
import OverviewView from './views/OverviewView';
import PatientVitalsView from './views/PatientVitalsView';
import AlertsView from './views/AlertsView';
import SettingsView from './views/SettingsView';

const RoomDetailModal = lazy(() => import('./components/RoomDetailModal'));

function MainLayout() {
  const {
    activeNav,
    setActiveNav,
    beds,
    selectedRoomId,
    setSelectedRoomId,
    selectedBed,
    safeCount,
    warningCount,
    alertCount,
    unacknowledgedAlertsCount,
    wsStatus,
  } = useICU();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [detailedModalRoomId, setDetailedModalRoomId] = useState(null);

  // Live wall clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const criticalBeds = beds.filter((b) => b.status === 'alert');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        overflow: 'hidden',
        background: '#080e1a',
        color: '#f8fafc',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* ══════════════════════════════════════════════════════════════
          1. TOP APP HEADER (Professional Clinical Operations Bar)
      ══════════════════════════════════════════════════════════════ */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 20px',
          background: '#0b1322',
          borderBottom: '1px solid #1e293b',
          zIndex: 50,
          flexShrink: 0,
        }}
      >
        {/* Brand & Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
            }}
          >
            <Building2 size={18} />
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.04em', color: '#ffffff', lineHeight: 1.2 }}>
              METROPOLITAN GENERAL HOSPITAL
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', letterSpacing: '0.02em' }}>
              ICU Digital Twin • Ward 8B Surveillance
            </div>
          </div>
        </div>

        {/* Center / Right Telemetry Summary Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Bed Status Distribution Pills */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
            }}
          >
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>5 Beds:</span>
            <span style={{ color: '#10b981', fontWeight: 700 }}>{safeCount} Normal</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#f59e0b', fontWeight: 700 }}>{warningCount} Warning</span>
            <span style={{ color: '#64748b' }}>•</span>
            <span style={{ color: '#f43f5e', fontWeight: 700 }}>{alertCount} Critical</span>
          </div>

          {/* Wall Clock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
              color: '#94a3b8',
            }}
          >
            <Clock size={13} color="#38bdf8" />
            <span>{formattedDate}</span>
            <span style={{ color: '#f8fafc', fontWeight: 700, fontFamily: 'monospace' }}>
              {formattedTime}
            </span>
          </div>

          {/* Prominent Demo Data Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: wsStatus === 'connected' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(2, 132, 199, 0.15)',
              border: wsStatus === 'connected' ? '1px solid #10b981' : '1px solid #0284c7',
              borderRadius: '6px',
              padding: '4px 10px',
              fontSize: '11px',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: wsStatus === 'connected' ? '#10b981' : '#38bdf8',
                boxShadow: wsStatus === 'connected' ? '0 0 6px #10b981' : '0 0 6px #38bdf8',
              }}
            />
            <span style={{ fontWeight: 700, color: wsStatus === 'connected' ? '#10b981' : '#38bdf8' }}>
              {wsStatus === 'connected' ? 'BACKEND LIVE' : 'DEMO DATA'}
            </span>
            <span style={{ color: '#64748b', fontSize: '10px' }}>
              {wsStatus === 'connected' ? 'WS Connected' : 'Simulated'}
            </span>
          </div>
        </div>
      </header>

      {/* Floating Alert Banner (Non-intrusive) */}
      <AlertBanner
        alertRooms={criticalBeds}
        onSelectRoom={(id) => {
          setSelectedRoomId(id);
          setActiveNav('icu_floor');
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          2. APPLICATION WORKSPACE: SIDEBAR + ACTIVE VIEW
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Navigation Sidebar */}
        <nav
          style={{
            width: '180px',
            background: '#090f1d',
            borderRight: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px 8px',
            zIndex: 30,
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.08em',
                padding: '4px 10px 8px 10px',
                textTransform: 'uppercase',
              }}
            >
              Navigation
            </div>

            <NavBtn
              icon={Building2}
              label="Overview"
              isActive={activeNav === 'overview'}
              onClick={() => setActiveNav('overview')}
            />

            <NavBtn
              icon={Layers}
              label="ICU Floor"
              isActive={activeNav === 'icu_floor'}
              onClick={() => setActiveNav('icu_floor')}
            />

            <NavBtn
              icon={Activity}
              label="Patient Vitals"
              isActive={activeNav === 'patient_vitals'}
              onClick={() => setActiveNav('patient_vitals')}
            />

            <NavBtn
              icon={Bell}
              label="Alerts"
              isActive={activeNav === 'alerts'}
              badgeCount={unacknowledgedAlertsCount}
              badgeColor="#f43f5e"
              onClick={() => setActiveNav('alerts')}
            />

            <NavBtn
              icon={Settings}
              label="Settings"
              isActive={activeNav === 'settings'}
              onClick={() => setActiveNav('settings')}
            />
          </div>

          {/* Footer Metadata */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px', paddingLeft: '8px' }}>
            <div style={{ fontSize: '10px', color: '#475569', lineHeight: 1.3 }}>
              Twin Architecture v3.0<br />
              Floor 8 ICU Digital Twin
            </div>
          </div>
        </nav>

        {/* Dynamic Center Stage Area */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
          {activeNav === 'icu_floor' && (
            <>
              {/* 3D ICU Interactive Floor */}
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                <HospitalFloor3D
                  beds={beds}
                  selectedRoomId={selectedRoomId}
                  onSelectBed={(id) => setSelectedRoomId(id)}
                />
              </div>

              {/* Contextual Patient Monitoring Panel (Right-side) */}
              <PatientMonitoringPanel
                bed={selectedBed}
                onOpenDetailedAnalytics={() => setDetailedModalRoomId(selectedRoomId)}
                onInspect3DRoom={() => setActiveNav('patient_vitals')}
              />
            </>
          )}

          {activeNav === 'overview' && <OverviewView />}

          {activeNav === 'patient_vitals' && (
            <PatientVitalsView onOpenDetailedAnalytics={(id) => setDetailedModalRoomId(id)} />
          )}

          {activeNav === 'alerts' && <AlertsView />}

          {activeNav === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. DETAILED 60-MINUTE HISTORICAL ANALYTICS MODAL
      ══════════════════════════════════════════════════════════════ */}
      {detailedModalRoomId && (
        <Suspense fallback={null}>
          <RoomDetailModal
            roomId={detailedModalRoomId}
            onClose={() => setDetailedModalRoomId(null)}
            liveReadings={beds.map((b) => ({
              room_id: b.roomId,
              pm25: b.currentAir.pm25,
              pm10: b.currentAir.pm10,
              co2: b.currentAir.co2,
              temperature: b.currentAir.temperature,
              humidity: b.currentAir.humidity,
              status: b.status,
            }))}
          />
        </Suspense>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ICUProvider>
      <MainLayout />
    </ICUProvider>
  );
}

function NavBtn({ icon: Icon, label, isActive, onClick, badgeCount, badgeColor }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '8px 10px',
        borderRadius: '6px',
        border: 'none',
        background: isActive ? '#0e1d35' : 'transparent',
        borderLeft: isActive ? '3px solid #0ea5e9' : '3px solid transparent',
        color: isActive ? '#ffffff' : '#94a3b8',
        fontWeight: isActive ? 600 : 500,
        fontSize: '12px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = '#0e182c';
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
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={15} color={isActive ? '#38bdf8' : '#64748b'} />
        <span>{label}</span>
      </div>

      {badgeCount > 0 && (
        <span
          style={{
            background: badgeColor || '#f43f5e',
            color: '#ffffff',
            fontSize: '10px',
            fontWeight: 700,
            borderRadius: '10px',
            padding: '1px 6px',
          }}
        >
          {badgeCount}
        </span>
      )}
    </button>
  );
}
