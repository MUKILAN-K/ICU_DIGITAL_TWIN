// API service for REST endpoints connecting to FastAPI backend

const API_BASE = 'http://localhost:8000';

export async function fetchHealth() {
  const res = await fetch(`${API_BASE}/`);
  if (!res.ok) throw new Error('Failed to fetch health');
  return res.json();
}

export async function fetchRooms() {
  const res = await fetch(`${API_BASE}/rooms`);
  if (!res.ok) throw new Error('Failed to fetch rooms');
  return res.json();
}

export async function fetchRoomCurrent(roomId) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/current`);
  if (!res.ok) throw new Error(`Failed to fetch current status for ${roomId}`);
  return res.json();
}

export async function fetchRoomHistory(roomId, minutes = 60) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/history?minutes=${minutes}`);
  if (!res.ok) throw new Error(`Failed to fetch history for ${roomId}`);
  return res.json();
}

export async function fetchRoomForecast(roomId, parameter = 'pm25_ug_m3', horizonMinutes = 30) {
  const res = await fetch(`${API_BASE}/rooms/${roomId}/forecast?parameter=${parameter}&horizon_minutes=${horizonMinutes}`);
  if (!res.ok) throw new Error(`Failed to fetch forecast for ${roomId}`);
  return res.json();
}

export async function fetchForecastEvaluation() {
  const res = await fetch(`${API_BASE}/forecast/evaluate`);
  if (!res.ok) throw new Error('Failed to fetch forecast evaluation');
  return res.json();
}

export async function triggerScenario(scenario, roomId = null, parameter = null, magnitude = null) {
  const res = await fetch(`${API_BASE}/simulation/scenario`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      scenario,
      room_id: roomId,
      parameter,
      magnitude,
    }),
  });
  if (!res.ok) throw new Error('Failed to set scenario');
  return res.json();
}

export async function controlSimulation(action, speedSeconds = null, seed = null) {
  const res = await fetch(`${API_BASE}/simulation/control`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action,
      speed_seconds: speedSeconds,
      seed,
    }),
  });
  if (!res.ok) throw new Error('Failed to control simulation');
  return res.json();
}

export async function fetchAlerts(roomId = null, limit = 50) {
  const url = roomId ? `${API_BASE}/alerts?room_id=${roomId}&limit=${limit}` : `${API_BASE}/alerts?limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function postAcknowledgeAlert(alertId) {
  const res = await fetch(`${API_BASE}/alerts/${alertId}/acknowledge`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to acknowledge alert ${alertId}`);
  return res.json();
}
