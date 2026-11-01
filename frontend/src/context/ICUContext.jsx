import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_BED_PROFILES,
  DEMO_THRESHOLDS,
  canonicalizeRoomId,
  evaluateBedStatus,
} from '../services/dataManager';
import {
  fetchRooms,
  fetchAlerts,
  postAcknowledgeAlert,
  triggerScenario as apiTriggerScenario,
  controlSimulation as apiControlSimulation,
  fetchRoomForecast,
  fetchForecastEvaluation,
} from '../services/api';

const ICUContext = createContext(null);
const WS_URL = 'ws://localhost:8000/ws/live';

// Pre-populate 30 trend points for smooth initial sparklines
function createInitialTrends(baseAir, baseVitals) {
  const points = 30;
  const history = [];
  const now = Date.now();

  for (let i = points - 1; i >= 0; i--) {
    const jitterPM25 = (Math.random() - 0.5) * 1.5;
    const jitterCO2 = (Math.random() - 0.5) * 20;
    const jitterHR = (Math.random() - 0.5) * 3;
    const jitterSpO2 = (Math.random() - 0.5) * 0.8;

    history.push({
      timestamp: new Date(now - i * 5000).toISOString(),
      pm25_ug_m3: Math.max(2.0, Math.round((baseAir.pm25_ug_m3 + jitterPM25) * 10) / 10),
      pm10_ug_m3: Math.max(5.0, Math.round((baseAir.pm10_ug_m3 + jitterPM25 * 1.6) * 10) / 10),
      co2_ppm: Math.max(400, Math.round(baseAir.co2_ppm + jitterCO2)),
      temperature_c: Math.round((baseAir.temperature_c + (Math.random() - 0.5) * 0.2) * 10) / 10,
      relative_humidity_pct: Math.round(baseAir.relative_humidity_pct + (Math.random() - 0.5) * 1.2),
      heartRate: Math.round(baseVitals.heartRate + jitterHR),
      spo2: Math.min(100, Math.max(80, Math.round((baseVitals.spo2 + jitterSpO2) * 10) / 10)),
      respiratoryRate: baseVitals.respiratoryRate,
      systolicBP: baseVitals.systolicBP,
      diastolicBP: baseVitals.diastolicBP,
    });
  }
  return history;
}

export function ICUProvider({ children }) {
  /**
   * Complete 5-Step Hierarchical Navigation State:
   * 'level1_hospital'   -> Modern Hospital Campus & Exterior 3D
   * 'level2_reception'  -> Hospital Atrium & Reception Lobby 3D
   * 'level3_icu_floor'  -> ICU Department Floor 3D (5 selectable rooms)
   * 'level4_icu_room'   -> Focused 3D ICU Room Interior
   * 'dashboard'         -> Environmental Monitoring Dashboard
   * 'forecast'          -> Predictive Analytics & ML Evaluation
   * 'alerts'            -> Clinical Alerts & Triage Audit
   * 'settings'          -> Scenarios & Threshold Configuration
   */
  const [level, setLevel] = useState('level1_hospital'); // Step 1: Hospital Overview landing experience!
  const [selectedRoomId, setSelectedRoomId] = useState('ICU-01');
  const [thresholds, setThresholds] = useState(DEMO_THRESHOLDS);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected' | 'simulated' | 'connecting'
  const [simulationSpeedSeconds, setSimulationSpeedSeconds] = useState(5.0);
  const [activeScenario, setActiveScenario] = useState('stable');

  // Beds data store for the 5 canonical rooms
  const [beds, setBeds] = useState(() => {
    return INITIAL_BED_PROFILES.map((profile) => ({
      ...profile,
      status: profile.initialStatus,
      lastUpdated: new Date().toISOString(),
      isStale: false,
      currentAir: { ...profile.baseAir },
      currentVitals: { ...profile.baseVitals },
      trends: createInitialTrends(profile.baseAir, profile.baseVitals),
    }));
  });

  // Alerts state
  const [alerts, setAlerts] = useState([]);
  const alertCooldownRef = useRef(new Map());

  // WebSocket reference
  const wsRef = useRef(null);
  const simTimerRef = useRef(null);

  // Navigation action handlers
  const enterHospital = useCallback(() => setLevel('level1_hospital'), []);
  const enterReception = useCallback(() => setLevel('level2_reception'), []);
  const enterICUFloor = useCallback(() => setLevel('level3_icu_floor'), []);
  const enterRoom = useCallback((roomId) => {
    if (roomId) setSelectedRoomId(canonicalizeRoomId(roomId));
    setLevel('level4_icu_room');
  }, []);
  const openDashboard = useCallback(() => setLevel('dashboard'), []);
  const openForecast = useCallback(() => setLevel('forecast'), []);
  const openAlerts = useCallback(() => setLevel('alerts'), []);
  const openSettings = useCallback(() => setLevel('settings'), []);

  // Hierarchical back navigation
  const navigateBack = useCallback(() => {
    setLevel((curr) => {
      if (curr === 'level4_icu_room') return 'level3_icu_floor';
      if (curr === 'level3_icu_floor') return 'level2_reception';
      if (curr === 'level2_reception') return 'level1_hospital';
      if (curr === 'dashboard' || curr === 'forecast') return 'level3_icu_floor';
      return 'level1_hospital';
    });
  }, []);

  // Update a single bed record safely
  const updateBedData = useCallback((roomId, newAir, newVitals) => {
    const canonId = canonicalizeRoomId(roomId);

    setBeds((prevBeds) => {
      return prevBeds.map((bed) => {
        if (bed.roomId !== canonId) return bed;

        const updatedAir = { ...bed.currentAir, ...newAir };
        const updatedVitals = newVitals ? { ...bed.currentVitals, ...newVitals } : bed.currentVitals;
        const newStatus = evaluateBedStatus(updatedVitals, updatedAir, thresholds);

        const newPoint = {
          timestamp: new Date().toISOString(),
          pm25_ug_m3: updatedAir.pm25_ug_m3 ?? updatedAir.pm25,
          pm10_ug_m3: updatedAir.pm10_ug_m3 ?? updatedAir.pm10,
          co2_ppm: updatedAir.co2_ppm ?? updatedAir.co2,
          temperature_c: updatedAir.temperature_c ?? updatedAir.temperature,
          relative_humidity_pct: updatedAir.relative_humidity_pct ?? updatedAir.humidity,
          heartRate: updatedVitals.heartRate,
          spo2: updatedVitals.spo2,
          respiratoryRate: updatedVitals.respiratoryRate,
          systolicBP: updatedVitals.systolicBP,
          diastolicBP: updatedVitals.diastolicBP,
        };

        const updatedTrends = [...bed.trends.slice(1), newPoint];

        return {
          ...bed,
          status: newStatus,
          lastUpdated: new Date().toISOString(),
          isStale: false,
          currentAir: updatedAir,
          currentVitals: updatedVitals,
          trends: updatedTrends,
        };
      });
    });
  }, [thresholds]);

  // Load initial rooms and alerts from backend REST
  useEffect(() => {
    async function loadBackendInitial() {
      try {
        const [roomsData, alertsData] = await Promise.all([
          fetchRooms().catch(() => null),
          fetchAlerts(null, 50).catch(() => null),
        ]);

        if (roomsData && Array.isArray(roomsData)) {
          roomsData.forEach((r) => {
            const rd = r.latest_reading || {};
            updateBedData(r.room_id, {
              pm25_ug_m3: rd.pm25_ug_m3 ?? rd.pm25,
              pm10_ug_m3: rd.pm10_ug_m3 ?? rd.pm10,
              co2_ppm: rd.co2_ppm ?? rd.co2,
              temperature_c: rd.temperature_c ?? rd.temperature,
              relative_humidity_pct: rd.relative_humidity_pct ?? rd.humidity,
              pm25: rd.pm25,
              pm10: rd.pm10,
              co2: rd.co2,
              temperature: rd.temperature,
              humidity: rd.humidity,
            });
          });
        }

        if (alertsData && Array.isArray(alertsData.alerts)) {
          setAlerts(alertsData.alerts);
        }
      } catch (err) {
        console.warn('Backend initial fetch fallback to simulation mode:', err);
      }
    }

    loadBackendInitial();
  }, [updateBedData]);

  // WebSocket connection management with smooth fallback
  useEffect(() => {
    let ws = null;
    let fallbackTimeout = null;

    function connectWS() {
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsStatus('connected');
          if (fallbackTimeout) clearTimeout(fallbackTimeout);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.scenario) {
              setActiveScenario(data.scenario);
            }
            if (data.rooms && Array.isArray(data.rooms)) {
              data.rooms.forEach((r) => {
                const canonId = canonicalizeRoomId(r.room_id);
                const air = {
                  pm25_ug_m3: r.pm25_ug_m3 ?? r.pm25,
                  pm10_ug_m3: r.pm10_ug_m3 ?? r.pm10,
                  co2_ppm: r.co2_ppm ?? r.co2,
                  temperature_c: r.temperature_c ?? r.temperature,
                  relative_humidity_pct: r.relative_humidity_pct ?? r.humidity,
                  pm25: r.pm25,
                  pm10: r.pm10,
                  co2: r.co2,
                  temperature: r.temperature,
                  humidity: r.humidity,
                };

                // Approximate clinical vitals response to environmental stress
                const isAlert = r.status === 'alert';
                const isWarning = r.status === 'warning';
                const vitals = {
                  heartRate: isAlert ? 116 : isWarning ? 94 : 74,
                  spo2: isAlert ? 89 : isWarning ? 93 : 98,
                  respiratoryRate: isAlert ? 26 : isWarning ? 20 : 15,
                  systolicBP: isAlert ? 152 : isWarning ? 134 : 122,
                  diastolicBP: isAlert ? 96 : isWarning ? 86 : 78,
                  temperature: isAlert ? 37.8 : isWarning ? 37.2 : 36.8,
                };

                updateBedData(canonId, air, vitals);
              });

              // Also refresh alerts periodically
              fetchAlerts(null, 50).then((res) => {
                if (res && res.alerts) setAlerts(res.alerts);
              }).catch(() => {});
            }
          } catch (e) {
            console.warn('WS message parse error:', e);
          }
        };

        ws.onerror = () => setWsStatus('simulated');
        ws.onclose = () => setWsStatus('simulated');
      } catch (e) {
        setWsStatus('simulated');
      }
    }

    connectWS();

    fallbackTimeout = setTimeout(() => {
      if (wsStatus === 'connecting') setWsStatus('simulated');
    }, 2000);

    return () => {
      if (fallbackTimeout) clearTimeout(fallbackTimeout);
      if (ws) ws.close();
    };
  }, [updateBedData]);

  // Client-side fallback ticker (runs if backend is unreachable)
  useEffect(() => {
    if (wsStatus === 'connected') return;

    simTimerRef.current = setInterval(() => {
      if (isSimulationPaused) return;

      INITIAL_BED_PROFILES.forEach((profile) => {
        const isSick = profile.roomId === 'ICU-04';
        const isWarning = profile.roomId === 'ICU-03';

        const driftPM = (Math.random() - 0.5) * (isSick ? 4.0 : 1.5);
        const driftCO2 = (Math.random() - 0.5) * (isSick ? 35.0 : 15.0);

        const baseAir = profile.baseAir;
        const newAir = {
          pm25_ug_m3: Math.max(3.0, Math.round((baseAir.pm25_ug_m3 + driftPM) * 10) / 10),
          pm10_ug_m3: Math.max(6.0, Math.round((baseAir.pm10_ug_m3 + driftPM * 1.5) * 10) / 10),
          co2_ppm: Math.max(390, Math.round(baseAir.co2_ppm + driftCO2)),
          temperature_c: Math.round((baseAir.temperature_c + (Math.random() - 0.5) * 0.15) * 10) / 10,
          relative_humidity_pct: Math.round(baseAir.relative_humidity_pct + (Math.random() - 0.5) * 1.0),
          pm25: Math.max(3.0, Math.round((baseAir.pm25_ug_m3 + driftPM) * 10) / 10),
          pm10: Math.max(6.0, Math.round((baseAir.pm10_ug_m3 + driftPM * 1.5) * 10) / 10),
          co2: Math.max(390, Math.round(baseAir.co2_ppm + driftCO2)),
          temperature: Math.round((baseAir.temperature_c + (Math.random() - 0.5) * 0.15) * 10) / 10,
          humidity: Math.round(baseAir.relative_humidity_pct + (Math.random() - 0.5) * 1.0),
          airChangesPerHour: baseAir.airChangesPerHour,
          pressureGradient: baseAir.pressureGradient,
        };

        const newVitals = {
          heartRate: isSick ? 118 : isWarning ? 96 : 74,
          spo2: isSick ? 89 : isWarning ? 92 : 98,
          respiratoryRate: isSick ? 27 : isWarning ? 22 : 15,
          temperature: isSick ? 38.6 : 36.9,
          systolicBP: isSick ? 154 : 122,
          diastolicBP: isSick ? 96 : 78,
        };

        updateBedData(profile.roomId, newAir, newVitals);
      });
    }, simulationSpeedSeconds * 1000);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [wsStatus, isSimulationPaused, simulationSpeedSeconds, updateBedData]);

  // Scenario trigger wrapper
  const triggerScenario = useCallback(async (scenario, roomId = null, parameter = null, magnitude = null) => {
    setActiveScenario(scenario);
    try {
      await apiTriggerScenario(scenario, roomId, parameter, magnitude);
    } catch (e) {
      console.warn('Local scenario trigger only (backend offline):', e);
    }
  }, []);

  // Simulation control wrapper
  const setSpeed = useCallback(async (speedSec) => {
    setSimulationSpeedSeconds(speedSec);
    try {
      await apiControlSimulation('set_speed', speedSec);
    } catch (e) {}
  }, []);

  const togglePause = useCallback(async () => {
    const next = !isSimulationPaused;
    setIsSimulationPaused(next);
    try {
      await apiControlSimulation(next ? 'pause' : 'resume');
    } catch (e) {}
  }, [isSimulationPaused]);

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.alert_id === alertId || alt.id === alertId ? { ...alt, acknowledged: 1 } : alt))
    );
    try {
      await postAcknowledgeAlert(alertId);
    } catch (e) {}
  }, []);

  // Selected bed helper
  const selectedBed = beds.find((b) => b.roomId === selectedRoomId) || beds[0];

  // Aggregates
  const safeCount = beds.filter((b) => b.status === 'safe').length;
  const warningCount = beds.filter((b) => b.status === 'warning').length;
  const alertCount = beds.filter((b) => b.status === 'alert').length;
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  const value = {
    // Navigation
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

    // Data
    selectedRoomId,
    setSelectedRoomId,
    selectedBed,
    beds,
    alerts,
    safeCount,
    warningCount,
    alertCount,
    unacknowledgedCount,
    wsStatus,
    thresholds,
    setThresholds,

    // Simulation & Scenarios
    activeScenario,
    triggerScenario,
    isSimulationPaused,
    togglePause,
    simulationSpeedSeconds,
    setSpeed,
    acknowledgeAlert,
  };

  return <ICUContext.Provider value={value}>{children}</ICUContext.Provider>;
}

export function useICU() {
  const context = useContext(ICUContext);
  if (!context) {
    throw new Error('useICU must be used within an ICUProvider');
  }
  return context;
}
