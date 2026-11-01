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
  ChevronRight,
  ArrowLeft,
  Wind,
  Box,
  Compass,
} from 'lucide-react';
import { ICUProvider, useICU } from './context/ICUContext';
import HospitalExterior3D from './components/HospitalExterior3D';
import HospitalLobby3D from './components/HospitalLobby3D';
import HospitalFloor3D from './components/HospitalFloor3D';
import ICURoomInterior3D from './components/ICURoomInterior3D';
import PatientMonitoringPanel from './components/PatientMonitoringPanel';
import AlertBanner from './components/AlertBanner';
import EnvironmentalDashboardView from './views/EnvironmentalDashboardView';
import OverviewView from './views/OverviewView';
import PatientVitalsView from './views/PatientVitalsView';
import AlertsView from './views/AlertsView';
import SettingsView from './views/SettingsView';

const RoomDetailModal = lazy(() => import('./components/RoomDetailModal'));

function MainLayout() {
  const {
    level,
    setLevel,
    enterHospital,
    enterReception,
    enterICUFloor,
    enterRoom,
    openDashboard,
    openForecast,
    openAlerts,
    openSettings,
    navigateBack,
    beds,
    selectedRoomId,
    setSelectedRoomId,
    selectedBed,
    safeCount,
    warningCount,
    alertCount,
    unacknowledgedCount,
    wsStatus,
  } = useICU();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [detailedModalRoomId, setDetailedModalRoomId] = useState(null);

  // Live ticking wall clock
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

  // Breadcrumb labels lookup
  const getBreadcrumbs = () => {
    const crumbs = [{ id: 'level1_hospital', label: 'Hospital Campus', icon: Building2, onClick: enterHospital }];

    if (level === 'level2_reception') {
      crumbs.push({ id: 'level2_reception', label: 'Reception Atrium', icon: Compass, onClick: enterReception });
    } else if (level === 'level3_icu_floor') {
      crumbs.push({ id: 'level2_reception', label: 'Reception Atrium', icon: Compass, onClick: enterReception });
      crumbs.push({ id: 'level3_icu_floor', label: 'ICU Department (Floor 8)', icon: Layers, onClick: enterICUFloor });
    } else if (level === 'level4_icu_room') {
      crumbs.push({ id: 'level2_reception', label: 'Reception Atrium', icon: Compass, onClick: enterReception });
      crumbs.push({ id: 'level3_icu_floor', label: 'ICU Department (Floor 8)', icon: Layers, onClick: enterICUFloor });
      crumbs.push({ id: 'level4_icu_room', label: `${selectedRoomId} Room Interior`, icon: Box, onClick: () => enterRoom(selectedRoomId) });
    } else if (level === 'dashboard') {
      crumbs.push({ id: 'level3_icu_floor', label: 'ICU Department', icon: Layers, onClick: enterICUFloor });
      crumbs.push({ id: 'dashboard', label: 'Environmental Dashboard', icon: Wind, onClick: openDashboard });
    } else if (level === 'overview') {
      crumbs.push({ id: 'overview', label: 'Ward Overview', icon: Users, onClick: () => setLevel('overview') });
    } else if (level === 'patient_vitals') {
      crumbs.push({ id: 'patient_vitals', label: 'Patient Vitals Station', icon: Activity, onClick: () => setLevel('patient_vitals') });
    } else if (level === 'alerts') {
      crumbs.push({ id: 'alerts', label: 'Alerts & Triage Log', icon: Bell, onClick: openAlerts });
    } else if (level === 'settings') {
      crumbs.push({ id: 'settings', label: 'Simulation & Thresholds', icon: Settings, onClick: openSettings });
    }

    return crumbs;
  };

  const breadcrumbs = getBreadcrumbs();

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
            onClick={enterHospital}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              cursor: 'pointer',
            }}
            title="Return to Hospital Campus"
          >
            <Building2 size={18} />
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.04em', color: '#ffffff', lineHeight: 1.2 }}>
              METROPOLITAN GENERAL HOSPITAL
            </div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: '#38bdf8', letterSpacing: '0.02em' }}>
              ICU Digital Twin • Bio-HVAC & Environmental Surveillance
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
            <span style={{ color: '#94a3b8', fontWeight: 600 }}>5 ICU Rooms:</span>
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
          enterICUFloor();
        }}
      />

      {/* ══════════════════════════════════════════════════════════════
          2. GLOBAL BREADCRUMBS & NAVIGATION HIERARCHY BAR
      ══════════════════════════════════════════════════════════════ */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 20px',
          background: '#090f1d',
          borderBottom: '1px solid #1e293b',
          fontSize: '12px',
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Clickable Breadcrumbs Trail */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            const Icon = crumb.icon;
            return (
              <React.Fragment key={crumb.id + idx}>
                {idx > 0 && <span style={{ color: '#475569', fontSize: '10px' }}>/</span>}
                <button
                  onClick={crumb.onClick}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    background: 'transparent',
                    border: 'none',
                    color: isLast ? '#38bdf8' : '#94a3b8',
                    fontWeight: isLast ? 700 : 500,
                    cursor: isLast ? 'default' : 'pointer',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                  onMouseEnter={(e) => {
                    if (!isLast) e.currentTarget.style.color = '#ffffff';
                  }}
                  onMouseLeave={(e) => {
                    if (!isLast) e.currentTarget.style.color = '#94a3b8';
                  }}
                >
                  <Icon size={13} color={isLast ? '#38bdf8' : '#64748b'} />
                  <span>{crumb.label}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>

        {/* Back Button */}
        {level !== 'level1_hospital' && (
          <button
            onClick={navigateBack}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: '4px',
              border: '1px solid #1e293b',
              background: '#0f172a',
              color: '#94a3b8',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={12} />
            <span>Back</span>
          </button>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          3. MAIN WORKSPACE: SIDEBAR + DYNAMIC VIEW CANVAS
      ══════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Navigation Sidebar */}
        <nav
          style={{
            width: '190px',
            background: '#090f1d',
            borderRight: '1px solid #1e293b',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '14px 8px',
            zIndex: 30,
            flexShrink: 0,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.08em',
                padding: '4px 10px 6px 10px',
                textTransform: 'uppercase',
              }}
            >
              3D Hospital Stages
            </div>

            <NavBtn
              icon={Building2}
              label="1. Hospital Overview"
              isActive={level === 'level1_hospital'}
              onClick={enterHospital}
            />

            <NavBtn
              icon={Compass}
              label="2. Reception Lobby"
              isActive={level === 'level2_reception'}
              onClick={enterReception}
            />

            <NavBtn
              icon={Layers}
              label="3. ICU Department"
              isActive={level === 'level3_icu_floor'}
              onClick={enterICUFloor}
            />

            <NavBtn
              icon={Box}
              label="4. ICU Room 3D"
              isActive={level === 'level4_icu_room'}
              onClick={() => enterRoom(selectedRoomId)}
            />

            <div
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.08em',
                padding: '12px 10px 6px 10px',
                textTransform: 'uppercase',
              }}
            >
              Surveillance Views
            </div>

            <NavBtn
              icon={Wind}
              label="Environmental Dashboard"
              isActive={level === 'dashboard'}
              onClick={openDashboard}
            />

            <NavBtn
              icon={Users}
              label="Ward Overview"
              isActive={level === 'overview'}
              onClick={() => setLevel('overview')}
            />

            <NavBtn
              icon={Activity}
              label="Patient Vitals"
              isActive={level === 'patient_vitals'}
              onClick={() => setLevel('patient_vitals')}
            />

            <NavBtn
              icon={Bell}
              label="Alerts & Triage"
              isActive={level === 'alerts'}
              badgeCount={unacknowledgedCount}
              badgeColor="#f43f5e"
              onClick={openAlerts}
            />

            <NavBtn
              icon={Settings}
              label="Scenarios & Settings"
              isActive={level === 'settings'}
              onClick={openSettings}
            />
          </div>

          {/* Footer Metadata */}
          <div style={{ borderTop: '1px solid #1e293b', paddingTop: '10px', paddingLeft: '8px' }}>
            <div style={{ fontSize: '10px', color: '#475569', lineHeight: 1.3 }}>
              Twin Architecture v3.0<br />
              Hospital-Wide Navigation
            </div>
          </div>
        </nav>

        {/* Dynamic Center Stage Area */}
        <main style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex' }}>
          {/* STEP 1: Hospital Overview (Exterior 3D) */}
          {level === 'level1_hospital' && (
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              <HospitalExterior3D
                rooms={beds}
                onEnterFloor={enterReception}
              />
            </div>
          )}

          {/* STEP 2: Reception Lobby (Atrium 3D) */}
          {level === 'level2_reception' && (
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              <HospitalLobby3D
                rooms={beds}
                onEnterICUFloor={enterICUFloor}
              />
            </div>
          )}

          {/* STEP 3: ICU Department (Floor 3D with 5 Selectable Rooms) */}
          {level === 'level3_icu_floor' && (
            <>
              <div style={{ flex: 1, height: '100%', position: 'relative' }}>
                <HospitalFloor3D
                  beds={beds}
                  selectedRoomId={selectedRoomId}
                  onSelectBed={(id) => setSelectedRoomId(id)}
                  onEnterRoom={(id) => enterRoom(id)}
                />
              </div>

              {/* Contextual Patient Monitoring Panel */}
              <PatientMonitoringPanel
                bed={selectedBed}
                onOpenDetailedAnalytics={() => setDetailedModalRoomId(selectedRoomId)}
                onInspect3DRoom={() => enterRoom(selectedRoomId)}
              />
            </>
          )}

          {/* STEP 4: Individual 3D ICU Room Interior */}
          {level === 'level4_icu_room' && (
            <div style={{ flex: 1, height: '100%', position: 'relative' }}>
              <ICURoomInterior3D
                room={{
                  room_id: selectedBed.roomId,
                  name: selectedBed.name,
                  status: selectedBed.status,
                  latest_reading: {
                    pm25: selectedBed.currentAir.pm25_ug_m3 ?? selectedBed.currentAir.pm25,
                    pm10: selectedBed.currentAir.pm10_ug_m3 ?? selectedBed.currentAir.pm10,
                    co2: selectedBed.currentAir.co2_ppm ?? selectedBed.currentAir.co2,
                    temperature: selectedBed.currentAir.temperature_c ?? selectedBed.currentAir.temperature,
                    humidity: selectedBed.currentAir.relative_humidity_pct ?? selectedBed.currentAir.humidity,
                  },
                }}
                onOpenAnalytics={() => setDetailedModalRoomId(selectedRoomId)}
              />
            </div>
          )}

          {/* STEP 5: Environmental Monitoring Dashboard (Phase 6 & 7) */}
          {level === 'dashboard' && <EnvironmentalDashboardView />}

          {/* Ward Overview */}
          {level === 'overview' && <OverviewView />}

          {/* Patient Vitals Station */}
          {level === 'patient_vitals' && (
            <PatientVitalsView onOpenDetailedAnalytics={(id) => setDetailedModalRoomId(id)} />
          )}

          {/* Alerts & Triage */}
          {level === 'alerts' && <AlertsView />}

          {/* Scenarios & Settings */}
          {level === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          4. DETAILED 60-MINUTE HISTORICAL ANALYTICS MODAL
      ══════════════════════════════════════════════════════════════ */}
      {detailedModalRoomId && (
        <Suspense fallback={null}>
          <RoomDetailModal
            roomId={detailedModalRoomId}
            onClose={() => setDetailedModalRoomId(null)}
            liveReadings={beds.map((b) => ({
              room_id: b.roomId,
              pm25: b.currentAir.pm25_ug_m3 ?? b.currentAir.pm25,
              pm10: b.currentAir.pm10_ug_m3 ?? b.currentAir.pm10,
              co2: b.currentAir.co2_ppm ?? b.currentAir.co2,
              temperature: b.currentAir.temperature_c ?? b.currentAir.temperature,
              humidity: b.currentAir.relative_humidity_pct ?? b.currentAir.humidity,
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
