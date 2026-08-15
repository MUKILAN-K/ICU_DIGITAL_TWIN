// API service for REST endpoints

const API_BASE = 'http://localhost:8000';

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
