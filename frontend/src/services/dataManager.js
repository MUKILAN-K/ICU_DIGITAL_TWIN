/**
 * ICU Digital Twin - Central Data & Threshold Configuration
 * 
 * DISCLAIMER:
 * DEMO DATA / SIMULATION ONLY.
 * Thresholds and physiological mock values are for software demonstration
 * purposes only and are NOT clinically validated medical rules.
 */

export const DEMO_THRESHOLDS = {
  // Biometrics
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
  temperature: {
    unit: '°C',
    label: 'Core Temp',
    normalMin: 36.2,
    normalMax: 37.5,
    warningMin: 35.5,
    warningMax: 38.3,
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
  // Environmental / HVAC
  pm25: {
    unit: 'µg/m³',
    label: 'PM2.5',
    normalMax: 15.0,
    warningMax: 35.0,
  },
  pm10: {
    unit: 'µg/m³',
    label: 'PM10',
    normalMax: 45.0,
    warningMax: 75.0,
  },
  co2: {
    unit: 'ppm',
    label: 'CO2 Level',
    normalMax: 800.0,
    warningMax: 1000.0,
  },
  humidity: {
    unit: '%',
    label: 'Humidity',
    normalMin: 40.0,
    normalMax: 55.0,
    warningMin: 35.0,
    warningMax: 60.0,
  },
  airChangesPerHour: {
    unit: 'ACH',
    label: 'Air Exchange',
    normalMin: 12.0, // Hospital ICU standard minimum
    warningMin: 8.0,
  },
};

export const INITIAL_BED_PROFILES = [
  {
    roomId: 'ICU-101',
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
      pm25: 7.8,
      pm10: 13.5,
      co2: 440,
      temperature: 21.0,
      humidity: 44,
      airChangesPerHour: 14.2,
      pressureGradient: -8.5, // Pascals (negative isolation)
    },
    initialStatus: 'safe',
  },
  {
    roomId: 'ICU-102',
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
      pm25: 11.2,
      pm10: 18.4,
      co2: 510,
      temperature: 22.0,
      humidity: 48,
      airChangesPerHour: 13.0,
      pressureGradient: 2.5,
    },
    initialStatus: 'safe',
  },
  {
    roomId: 'ICU-103',
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
      pm25: 28.5,
      pm10: 52.0,
      co2: 890,
      temperature: 23.2,
      humidity: 58,
      airChangesPerHour: 11.2,
      pressureGradient: 1.8,
    },
    initialStatus: 'warning',
  },
  {
    roomId: 'ICU-104',
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
      pm25: 42.0,
      pm10: 82.0,
      co2: 1040,
      temperature: 24.8,
      humidity: 63,
      airChangesPerHour: 9.1,
      pressureGradient: 0.5,
    },
    initialStatus: 'alert',
  },
  {
    roomId: 'ICU-105',
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
      pm25: 14.5,
      pm10: 22.0,
      co2: 605,
      temperature: 22.5,
      humidity: 49,
      airChangesPerHour: 12.8,
      pressureGradient: 3.0,
    },
    initialStatus: 'safe',
  },
];

/** Evaluates overall room status based on biometrics & air quality */
export function evaluateBedStatus(vitals, air, thresholds = DEMO_THRESHOLDS) {
  let highestSeverity = 'safe'; // 'safe' | 'warning' | 'alert'

  const escalate = (level) => {
    if (level === 'alert') highestSeverity = 'alert';
    else if (level === 'warning' && highestSeverity !== 'alert') highestSeverity = 'warning';
  };

  // Check Vitals
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

  if (vitals.respiratoryRate > thresholds.respiratoryRate.warningMax || vitals.respiratoryRate < thresholds.respiratoryRate.warningMin) {
    escalate('alert');
  } else if (vitals.respiratoryRate > thresholds.respiratoryRate.normalMax || vitals.respiratoryRate < thresholds.respiratoryRate.normalMin) {
    escalate('warning');
  }

  if (vitals.temperature > thresholds.temperature.warningMax || vitals.temperature < thresholds.temperature.warningMin) {
    escalate('alert');
  } else if (vitals.temperature > thresholds.temperature.normalMax || vitals.temperature < thresholds.temperature.normalMin) {
    escalate('warning');
  }

  // Check Air
  if (air.pm25 > thresholds.pm25.warningMax || air.co2 > thresholds.co2.warningMax) {
    escalate('alert');
  } else if (air.pm25 > thresholds.pm25.normalMax || air.co2 > thresholds.co2.normalMax) {
    escalate('warning');
  }

  return highestSeverity;
}

