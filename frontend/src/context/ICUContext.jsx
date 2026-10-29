import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  INITIAL_BED_PROFILES,
  DEMO_THRESHOLDS,
  evaluateBedStatus,
} from '../services/dataManager';
import { fetchRooms } from '../services/api';

const ICUContext = createContext(null);

const WS_URL = 'ws://localhost:8000/ws/live';

// Pre-populate 30 trend points for smooth initial sparklines
function createInitialTrends(baseVitals) {
  const points = 30;
  const history = [];
  const now = Date.now();

  for (let i = points - 1; i >= 0; i--) {
    const jitterHR = (Math.random() - 0.5) * 3;
    const jitterSpO2 = (Math.random() - 0.5) * 0.8;
    const jitterRR = (Math.random() - 0.5) * 1.5;
    const jitterTemp = (Math.random() - 0.5) * 0.1;
    const jitterBP = (Math.random() - 0.5) * 4;

    history.push({
      timestamp: new Date(now - i * 3000).toISOString(),
      heartRate: Math.round(baseVitals.heartRate + jitterHR),
      spo2: Math.min(100, Math.max(80, Math.round((baseVitals.spo2 + jitterSpO2) * 10) / 10)),
      respiratoryRate: Math.round(baseVitals.respiratoryRate + jitterRR),
      temperature: Math.round((baseVitals.temperature + jitterTemp) * 10) / 10,
      systolicBP: Math.round(baseVitals.systolicBP + jitterBP),
      diastolicBP: Math.round(baseVitals.diastolicBP + jitterBP * 0.6),
    });
  }
  return history;
}

export function ICUProvider({ children }) {
  // Navigation: 'icu_floor' | 'overview' | 'patient_vitals' | 'alerts' | 'settings'
  const [activeNav, setActiveNav] = useState('icu_floor');
  const [selectedRoomId, setSelectedRoomId] = useState('ICU-101');
  const [thresholds, setThresholds] = useState(DEMO_THRESHOLDS);
  const [isSimulationPaused, setIsSimulationPaused] = useState(false);
  const [wsStatus, setWsStatus] = useState('connecting'); // 'connected' | 'simulated' | 'connecting'
  const [simulationSpeedMs, setSimulationSpeedMs] = useState(3000);

  // Beds data store
  const [beds, setBeds] = useState(() => {
    return INITIAL_BED_PROFILES.map((profile) => ({
      ...profile,
      status: profile.initialStatus,
      lastUpdated: new Date().toISOString(),
      isStale: false,
      currentVitals: { ...profile.baseVitals },
      currentAir: { ...profile.baseAir },
      trends: createInitialTrends(profile.baseVitals),
    }));
  });

  // Alert History Log (Deduplicated audit trail)
  const [alerts, setAlerts] = useState([
    {
      id: 'alt-init-1',
      roomId: 'ICU-104',
      bedNumber: 'Bed 4',
      timestamp: new Date(Date.now() - 140000).toISOString(),
      severity: 'alert',
      metric: 'Heart Rate & SpO2',
      message: 'Critical Tachycardia (118 bpm) & Desaturation (89%)',
      value: '118 bpm / 89% SpO2',
      acknowledged: false,
    },
    {
      id: 'alt-init-2',
      roomId: 'ICU-103',
      bedNumber: 'Bed 3',
      timestamp: new Date(Date.now() - 360000).toISOString(),
      severity: 'warning',
      metric: 'SpO2 Oxygen Sat.',
      message: 'Borderline Hypoxemia below 95%',
      value: '92% SpO2',
      acknowledged: true,
    },
    {
      id: 'alt-init-3',
      roomId: 'ICU-104',
      bedNumber: 'Bed 4',
      timestamp: new Date(Date.now() - 520000).toISOString(),
      severity: 'alert',
      metric: 'CO2 Level',
      message: 'Ventilation threshold exceeded (1040 ppm)',
      value: '1040 ppm',
      acknowledged: true,
    },
  ]);

  // Alert deduplication tracker: maps `${roomId}_${metric}` to last alert timestamp
  const alertCooldownRef = useRef(new Map());

  // WebSocket reference
  const wsRef = useRef(null);
  const simTimerRef = useRef(null);

  // Helper to trigger alert without duplicates
  const registerAlert = useCallback((roomId, bedNumber, severity, metric, message, value) => {
    const key = `${roomId}_${metric}_${severity}`;
    const now = Date.now();
    const lastTrigger = alertCooldownRef.current.get(key) || 0;

    // Suppress duplicates within a 45-second window
    if (now - lastTrigger < 45000) return;

    alertCooldownRef.current.set(key, now);

    const newAlert = {
      id: `alt-${now}-${Math.random().toString(36).substr(2, 5)}`,
      roomId,
      bedNumber,
      timestamp: new Date().toISOString(),
      severity,
      metric,
      message,
      value,
      acknowledged: false,
    };

    setAlerts((prev) => [newAlert, ...prev.slice(0, 99)]);
  }, []);

  // Update a single bed with fresh readings
  const updateBedData = useCallback(
    (roomId, newVitals, newAir) => {
      setBeds((prevBeds) => {
        return prevBeds.map((bed) => {
          if (bed.roomId !== roomId) return bed;

          const updatedVitals = { ...bed.currentVitals, ...newVitals };
          const updatedAir = { ...bed.currentAir, ...newAir };
          const newStatus = evaluateBedStatus(updatedVitals, updatedAir, thresholds);

          // Check if we need to log an alert
          if (newStatus === 'alert') {
            let msg = 'Biometric critical threshold violation';
            let metricName = 'Vital Signs';
            let val = `${updatedVitals.heartRate} bpm / ${updatedVitals.spo2}% SpO2`;

            if (updatedVitals.heartRate > thresholds.heartRate.warningMax) {
              msg = `Critical Tachycardia: ${updatedVitals.heartRate} bpm`;
              metricName = 'Heart Rate';
              val = `${updatedVitals.heartRate} bpm`;
            } else if (updatedVitals.spo2 < thresholds.spo2.warningMin) {
              msg = `Severe Desaturation: ${updatedVitals.spo2}% SpO2`;
              metricName = 'SpO2';
              val = `${updatedVitals.spo2}%`;
            } else if (updatedAir.co2 > thresholds.co2.warningMax) {
              msg = `Excessive CO2 Level: ${Math.round(updatedAir.co2)} ppm`;
              metricName = 'CO2 Level';
              val = `${Math.round(updatedAir.co2)} ppm`;
            }
            registerAlert(roomId, bed.bedNumber, 'alert', metricName, msg, val);
          } else if (newStatus === 'warning') {
            registerAlert(
              roomId,
              bed.bedNumber,
              'warning',
              'Sub-Optimal Readings',
              'Parameters trending outside standard clinical tolerances',
              `${updatedVitals.heartRate} bpm / ${updatedVitals.spo2}%`
            );
          }

          // Maintain 30-item sliding window of trends
          const newTrendPoint = {
            timestamp: new Date().toISOString(),
            heartRate: updatedVitals.heartRate,
            spo2: updatedVitals.spo2,
            respiratoryRate: updatedVitals.respiratoryRate,
            temperature: updatedVitals.temperature,
            systolicBP: updatedVitals.systolicBP,
            diastolicBP: updatedVitals.diastolicBP,
          };

          const updatedTrends = [...bed.trends.slice(1), newTrendPoint];

          return {
            ...bed,
            status: newStatus,
            lastUpdated: new Date().toISOString(),
            isStale: false,
            currentVitals: updatedVitals,
            currentAir: updatedAir,
            trends: updatedTrends,
          };
        });
      });
    },
    [thresholds, registerAlert]
  );

  // Physiological Realistic Client-Side Simulation Tick
  const runSimulationTick = useCallback(() => {
    if (isSimulationPaused) return;

    INITIAL_BED_PROFILES.forEach((profile) => {
      // Dynamic natural physiological variations
      const isSick = profile.roomId === 'ICU-104';
      const isModerate = profile.roomId === 'ICU-103';

      const hrDrift = (Math.random() - 0.5) * (isSick ? 4.5 : 2.0);
      const spo2Drift = (Math.random() - 0.5) * (isSick ? 1.2 : 0.4);
      const rrDrift = (Math.random() - 0.5) * (isSick ? 1.8 : 0.8);
      const tempDrift = (Math.random() - 0.5) * 0.08;
      const bpDrift = (Math.random() - 0.5) * 3;

      const base = profile.baseVitals;
      const baseAir = profile.baseAir;

      const newVitals = {
        heartRate: Math.max(45, Math.min(160, Math.round(base.heartRate + hrDrift))),
        spo2: Math.max(82, Math.min(100, Math.round((base.spo2 + spo2Drift) * 10) / 10)),
        respiratoryRate: Math.max(8, Math.min(38, Math.round(base.respiratoryRate + rrDrift))),
        temperature: Math.round((base.temperature + tempDrift) * 10) / 10,
        systolicBP: Math.round(base.systolicBP + bpDrift),
        diastolicBP: Math.round(base.diastolicBP + bpDrift * 0.6),
      };

      const newAir = {
        pm25: Math.max(2, Math.round((baseAir.pm25 + (Math.random() - 0.5) * 2.2) * 10) / 10),
        pm10: Math.max(5, Math.round((baseAir.pm10 + (Math.random() - 0.5) * 3.5) * 10) / 10),
        co2: Math.max(380, Math.round(baseAir.co2 + (Math.random() - 0.5) * 18)),
        temperature: Math.round((baseAir.temperature + (Math.random() - 0.5) * 0.2) * 10) / 10,
        humidity: Math.round(baseAir.humidity + (Math.random() - 0.5) * 1.5),
        airChangesPerHour: Math.round((baseAir.airChangesPerHour + (Math.random() - 0.5) * 0.4) * 10) / 10,
        pressureGradient: Math.round((baseAir.pressureGradient + (Math.random() - 0.5) * 0.3) * 10) / 10,
      };

      updateBedData(profile.roomId, newVitals, newAir);
    });
  }, [isSimulationPaused, updateBedData]);

  // Connect to live WebSocket or fallback seamlessly to simulation
  useEffect(() => {
    let ws = null;
    let fallbackToSimTimeout = null;

    function tryWebSocket() {
      try {
        ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsStatus('connected');
          if (fallbackToSimTimeout) clearTimeout(fallbackToSimTimeout);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.rooms && Array.isArray(data.rooms)) {
              data.rooms.forEach((r) => {
                const vitals = {
                  heartRate: r.status === 'alert' ? 116 : r.status === 'warning' ? 95 : 74,
                  spo2: r.status === 'alert' ? 89 : r.status === 'warning' ? 93 : 98,
                  respiratoryRate: r.status === 'alert' ? 26 : r.status === 'warning' ? 20 : 15,
                  temperature: r.temperature || 37.0,
                  systolicBP: r.status === 'alert' ? 152 : 122,
                  diastolicBP: r.status === 'alert' ? 96 : 78,
                };
                const air = {
                  pm25: r.pm25 || 12,
                  pm10: r.pm10 || 20,
                  co2: r.co2 || 500,
                  temperature: r.temperature || 22,
                  humidity: r.humidity || 50,
                  airChangesPerHour: 12.5,
                  pressureGradient: r.room_id === 'ICU-101' ? -8.0 : 2.5,
                };
                updateBedData(r.room_id, vitals, air);
              });
            }
          } catch (e) {
            console.warn('WS message parse error:', e);
          }
        };

        ws.onerror = () => {
          setWsStatus('simulated');
        };

        ws.onclose = () => {
          setWsStatus('simulated');
        };
      } catch (e) {
        setWsStatus('simulated');
      }
    }

    tryWebSocket();

    // If WebSocket hasn't connected in 1.8 seconds, fall back smoothly to simulated engine
    fallbackToSimTimeout = setTimeout(() => {
      if (wsStatus === 'connecting') {
        setWsStatus('simulated');
      }
    }, 1800);

    return () => {
      if (fallbackToSimTimeout) clearTimeout(fallbackToSimTimeout);
      if (ws) ws.close();
    };
  }, [updateBedData]);

  // Simulation heartbeat ticker (runs when in simulated mode or as fallback)
  useEffect(() => {
    if (wsStatus === 'connected') return;

    simTimerRef.current = setInterval(() => {
      runSimulationTick();
    }, simulationSpeedMs);

    return () => {
      if (simTimerRef.current) clearInterval(simTimerRef.current);
    };
  }, [wsStatus, simulationSpeedMs, runSimulationTick]);

  // Acknowledge single alert
  const acknowledgeAlert = useCallback((alertId) => {
    setAlerts((prev) =>
      prev.map((alt) => (alt.id === alertId ? { ...alt, acknowledged: true } : alt))
    );
  }, []);

  // Clear all acknowledged alerts
  const clearAcknowledgedAlerts = useCallback(() => {
    setAlerts((prev) => prev.filter((alt) => !alt.acknowledged));
  }, []);

  // Selected bed helper
  const selectedBed = beds.find((b) => b.roomId === selectedRoomId) || beds[0];

  // Global counts
  const safeCount = beds.filter((b) => b.status === 'safe').length;
  const warningCount = beds.filter((b) => b.status === 'warning').length;
  const alertCount = beds.filter((b) => b.status === 'alert').length;
  const unacknowledgedAlertsCount = alerts.filter((a) => !a.acknowledged).length;

  const value = {
    activeNav,
    setActiveNav,
    selectedRoomId,
    setSelectedRoomId,
    selectedBed,
    beds,
    alerts,
    unacknowledgedAlertsCount,
    safeCount,
    warningCount,
    alertCount,
    wsStatus,
    thresholds,
    setThresholds,
    isSimulationPaused,
    setIsSimulationPaused,
    simulationSpeedMs,
    setSimulationSpeedMs,
    acknowledgeAlert,
    clearAcknowledgedAlerts,
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

