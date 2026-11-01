/**
 * ICU Digital Twin - Central Data & Threshold Configuration
 * 
 * Standardizes 5 canonical rooms (ICU-01 through ICU-05) and environmental parameters:
 * 1. PM2.5 (µg/m³)
 * 2. PM10 (µg/m³)
 * 3. CO2 (ppm)
 * 4. Temperature (°C)
 * 5. Relative Humidity (%)
 * 
 * DISCLAIMER:
 * DEMO DATA / SIMULATION ONLY.
 * Thresholds and physiological mock values are for software demonstration
 * purposes only and are NOT clinically validated medical rules.
 */

export const DEMO_THRESHOLDS = {
  // Environmental / HVAC (WHO & ASHRAE Guidelines)
  pm25: {
    unit: 'µg/m³',
    label: 'PM2.5 Particulate',
    normalMax: 15.0,
    warningMax: 35.0,
  },
  pm10: {
    unit: 'µg/m³',
    label: 'PM10 Particulate',
    normalMax: 45.0,
    warningMax: 75.0,
  },
  co2: {
    unit: 'ppm',
    label: 'CO2 Ventilation',
    normalMax: 800.0,
    warningMax: 1000.0,
  },
  temperature: {
    unit: '°C',
    label: 'Ambient Temperature',
    normalMin: 20.0,
    normalMax: 24.0,
    warningMin: 18.0,
    warningMax: 25.5,
  },
  humidity: {
    unit: '%',
    label: 'Relative Humidity',
    normalMin: 40.0,
    normalMax: 55.0,
    warningMin: 35.0,
    warningMax: 60.0,
  },
  airChangesPerHour: {
    unit: 'ACH',
    label: 'Air Turnover Rate',
    normalMin: 12.0,
    warningMin: 8.0,
  },
  // Patient Biometrics
  heartRate: {
    unit: 'bpm',
    label: 'Heart Rate',
    normalMin: 60,
    normalMax: 100,
    warningMin: 50,
    warningMax: 115,
  },
  spo2: {
    unit: '%',
    label: 'SpO2 Oxygen Sat.',
    normalMin: 95,
    warningMin: 90,
  },
  respiratoryRate: {
    unit: 'rpm',
    label: 'Resp. Rate',
    normalMin: 12,
    normalMax: 20,
    warningMin: 10,
    warningMax: 26,
  },
  systolicBP: {
    unit: 'mmHg',
    label: 'Systolic BP',
    normalMin: 90,
    normalMax: 130,
    warningMin: 80,
    warningMax: 145,
  },
  diastolicBP: {
    unit: 'mmHg',
    label: 'Diastolic BP',
    normalMin: 60,
    normalMax: 85,
    warningMin: 50,
    warningMax: 95,
  },
};

export const INITIAL_BED_PROFILES = [
  {
    roomId: 'ICU-01',
    alias: 'ICU-101',
    bedNumber: 'Bed 1',
    name: 'Bed 1 — Negative Pressure Isolation',
    unitType: 'Negative Pressure Isolation',
    patient: {
      name: 'Robert Jenkins',
      age: 64,
      gender: 'Male',
      admissionDate: '2026-10-24',
      primaryDiagnosis: 'Acute Respiratory Distress (ARDS)',
      physician: 'Dr. Sarah Vance, MD',
      codeStatus: 'Full Code',
    },
    baseVitals: {
      heartRate: 74,
      spo2: 97,
      respiratoryRate: 15,
      temperature: 36.8,
      systolicBP: 122,
      diastolicBP: 78,
    },
    baseAir: {
      pm25_ug_m3: 8.0,
      pm10_ug_m3: 14.0,
      co2_ppm: 440,
      temperature_c: 21.0,
      relative_humidity_pct: 42.0,
      // Backward-compat aliases
      pm25: 8.0,
      pm10: 14.0,
      co2: 440,
      temperature: 21.0,
      humidity: 42.0,
      airChangesPerHour: 14.2,
      pressureGradient: -8.5,
    },
    initialStatus: 'safe',
  },
  {
    roomId: 'ICU-02',
    alias: 'ICU-102',
    bedNumber: 'Bed 2',
    name: 'Bed 2 — General ICU Suite A',
    unitType: 'Intensive Critical Care',
    patient: {
      name: 'Elena Rostova',
      age: 52,
      gender: 'Female',
      admissionDate: '2026-10-26',
      primaryDiagnosis: 'Post-CABG Hemodynamic Surveillance',
      physician: 'Dr. Marcus Webb, MD',
      codeStatus: 'Full Code',
    },
    baseVitals: {
      heartRate: 82,
      spo2: 98,
      respiratoryRate: 16,
      temperature: 37.1,
      systolicBP: 128,
      diastolicBP: 82,
    },
    baseAir: {
      pm25_ug_m3: 11.5,
      pm10_ug_m3: 19.0,
      co2_ppm: 510,
      temperature_c: 22.0,
      relative_humidity_pct: 47.0,
      pm25: 11.5,
      pm10: 19.0,
      co2: 510,
      temperature: 22.0,
      humidity: 47.0,
      airChangesPerHour: 13.0,
      pressureGradient: 2.5,
    },
    initialStatus: 'safe',
  },
  {
    roomId: 'ICU-03',
    alias: 'ICU-103',
    bedNumber: 'Bed 3',
    name: 'Bed 3 — General ICU Suite B',
    unitType: 'Intensive Critical Care',
    patient: {
      name: 'David K. Miller',
      age: 71,
      gender: 'Male',
      admissionDate: '2026-10-27',
      primaryDiagnosis: 'Sepsis Secondary to Pneumonia',
      physician: 'Dr. Sarah Vance, MD',
      codeStatus: 'DNR / DNI',
    },
    baseVitals: {
      heartRate: 98,
      spo2: 92,
      respiratoryRate: 23,
      temperature: 38.4,
      systolicBP: 98,
      diastolicBP: 62,
    },
    baseAir: {
      pm25_ug_m3: 28.5,
      pm10_ug_m3: 52.0,
      co2_ppm: 890,
      temperature_c: 23.2,
      relative_humidity_pct: 58.0,
      pm25: 28.5,
      pm10: 52.0,
      co2: 890,
      temperature: 23.2,
      humidity: 58.0,
      airChangesPerHour: 11.2,
      pressureGradient: 1.8,
    },
    initialStatus: 'warning',
  },
  {
    roomId: 'ICU-04',
    alias: 'ICU-104',
    bedNumber: 'Bed 4',
    name: 'Bed 4 — Neuro-Trauma Suite',
    unitType: 'Neuro-Intensive Care',
    patient: {
      name: 'Amara Chen',
      age: 38,
      gender: 'Female',
      admissionDate: '2026-10-28',
      primaryDiagnosis: 'Subarachnoid Hemorrhage',
      physician: 'Dr. Lisa Patel, MD',
      codeStatus: 'Full Code',
    },
    baseVitals: {
      heartRate: 118,
      spo2: 89,
      respiratoryRate: 27,
      temperature: 38.7,
      systolicBP: 154,
      diastolicBP: 96,
    },
    baseAir: {
      pm25_ug_m3: 42.0,
      pm10_ug_m3: 82.0,
      co2_ppm: 1040,
      temperature_c: 24.8,
      relative_humidity_pct: 63.0,
      pm25: 42.0,
      pm10: 82.0,
      co2: 1040,
      temperature: 24.8,
      humidity: 63.0,
      airChangesPerHour: 9.1,
      pressureGradient: 0.5,
    },
    initialStatus: 'alert',
  },
  {
    roomId: 'ICU-05',
    alias: 'ICU-105',
    bedNumber: 'Bed 5',
    name: 'Bed 5 — Post-Op Surgical Recovery',
    unitType: 'Surgical ICU',
    patient: {
      name: 'Arthur Pendelton',
      age: 67,
      gender: 'Male',
      admissionDate: '2026-10-29',
      primaryDiagnosis: 'Abdominal Aortic Aneurysm Repair',
      physician: 'Dr. Marcus Webb, MD',
      codeStatus: 'Full Code',
    },
    baseVitals: {
      heartRate: 76,
      spo2: 96,
      respiratoryRate: 14,
      temperature: 36.9,
      systolicBP: 118,
      diastolicBP: 74,
    },
    baseAir: {
      pm25_ug_m3: 15.0,
      pm10_ug_m3: 24.0,
      co2_ppm: 610,
      temperature_c: 22.8,
      relative_humidity_pct: 51.0,
      pm25: 15.0,
      pm10: 24.0,
      co2: 610,
      temperature: 22.8,
      humidity: 51.0,
      airChangesPerHour: 12.8,
      pressureGradient: 3.0,
    },
    initialStatus: 'safe',
  },
];

/** Canonicalizes ID: maps ICU-101 to ICU-01, etc. */
export function canonicalizeRoomId(rawId) {
  if (!rawId) return 'ICU-01';
  const clean = String(rawId).trim().toUpperCase();
  const map = {
    'ICU-1': 'ICU-01', 'ICU-101': 'ICU-01', 'ICU-01': 'ICU-01', 'ICU_01': 'ICU-01',
    'ICU-2': 'ICU-02', 'ICU-102': 'ICU-02', 'ICU-02': 'ICU-02', 'ICU_02': 'ICU-02',
    'ICU-3': 'ICU-03', 'ICU-103': 'ICU-03', 'ICU-03': 'ICU-03', 'ICU_03': 'ICU-03',
    'ICU-4': 'ICU-04', 'ICU-104': 'ICU-04', 'ICU-04': 'ICU-04', 'ICU_04': 'ICU-04',
    'ICU-5': 'ICU-05', 'ICU-105': 'ICU-05', 'ICU-05': 'ICU-05', 'ICU_05': 'ICU-05',
  };
  return map[clean] || clean;
}

/** Evaluates overall room status based on biometrics & environmental air quality */
export function evaluateBedStatus(vitals, air, thresholds = DEMO_THRESHOLDS) {
  let highestSeverity = 'safe'; // 'safe' | 'warning' | 'alert'

  const escalate = (level) => {
    if (level === 'alert') highestSeverity = 'alert';
    else if (level === 'warning' && highestSeverity !== 'alert') highestSeverity = 'warning';
  };

  const pm25 = air.pm25_ug_m3 ?? air.pm25 ?? 0;
  const pm10 = air.pm10_ug_m3 ?? air.pm10 ?? 0;
  const co2 = air.co2_ppm ?? air.co2 ?? 0;
  const temp = air.temperature_c ?? air.temperature ?? 22;
  const humidity = air.relative_humidity_pct ?? air.humidity ?? 50;

  // Check Environmental Air Quality (WHO Guidelines)
  if (pm25 > thresholds.pm25.warningMax || co2 > thresholds.co2.warningMax || pm10 > thresholds.pm10.warningMax) {
    escalate('alert');
  } else if (pm25 > thresholds.pm25.normalMax || co2 > thresholds.co2.normalMax || pm10 > thresholds.pm10.normalMax) {
    escalate('warning');
  }

  if (temp > thresholds.temperature.warningMax || temp < thresholds.temperature.warningMin) {
    escalate('alert');
  } else if (temp > thresholds.temperature.normalMax || temp < thresholds.temperature.normalMin) {
    escalate('warning');
  }

  if (humidity > thresholds.humidity.warningMax || humidity < thresholds.humidity.warningMin) {
    escalate('alert');
  } else if (humidity > thresholds.humidity.normalMax || humidity < thresholds.humidity.normalMin) {
    escalate('warning');
  }

  // Check Physiological Vitals if present
  if (vitals) {
    if (vitals.heartRate > thresholds.heartRate.warningMax || vitals.heartRate < thresholds.heartRate.warningMin) {
      escalate('alert');
    } else if (vitals.heartRate > thresholds.heartRate.normalMax || vitals.heartRate < thresholds.heartRate.normalMin) {
      escalate('warning');
    }

    if (vitals.spo2 < thresholds.spo2.warningMin) {
      escalate('alert');
    } else if (vitals.spo2 < thresholds.spo2.normalMin) {
      escalate('warning');
    }
  }

  return highestSeverity;
}
