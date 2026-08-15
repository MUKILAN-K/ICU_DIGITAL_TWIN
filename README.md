# Simulated ICU Air Quality Monitoring System Backend

A Python FastAPI backend for a simulated ICU digital twin monitoring system with 5 independent ICU rooms, real-time WebSocket updates, WHO threshold classifications, and decaying environmental spikes.

## Features

- **5 Independent ICU Rooms**: `ICU-101`, `ICU-102`, `ICU-103`, `ICU-104`, `ICU-105` with distinct baseline profiles.
- **Realistic Sensor Simulation**:
  - **Diurnal Pattern**: Simulates daily hospital activity cycles (worse air quality during peak daytime hours 08:00 - 18:00).
  - **Decaying Spikes**: Random events (door openings, medical equipment usage, occupant surges) trigger parameter spikes that decay exponentially over several readings.
- **WHO / ASHRAE Threshold engine**: Evaluates parameter levels against WHO indoor air quality standards and flags room status as `safe`, `warning`, or `alert`.
- **SQLite Database**: Persistent sensor history stored in `icu_air_quality.db`. Auto-seeds 60 minutes of history on initial startup.
- **REST & WebSocket Endpoints**: High-performance async endpoints for room overview, current status, history, and 5-second WebSocket live stream.
- **CORS Enabled**: Ready for frontend integration running on any port/domain.

---

## Quick Start Guide

### 1. Install Dependencies

Ensure Python 3.9+ is installed, then install the required packages:

```bash
pip install -r requirements.txt
```

### 2. Run the FastAPI Server

Start the Uvicorn ASGI server with hot-reload enabled:

```bash
uvicorn main:app --reload --port 8000
```

The API will be available at:
- **Base URL**: `http://localhost:8000`
- **Interactive OpenAPI Docs**: `http://localhost:8000/docs`
- **ReDoc UI**: `http://localhost:8000/redoc`

---

## API Documentation

### REST Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/rooms` | List all 5 ICU rooms with current status and latest reading |
| `GET` | `/rooms/{room_id}/current` | Detailed latest reading & WHO threshold breakdown for a specific room |
| `GET` | `/rooms/{room_id}/history?minutes=60` | Historical sensor readings for a room over requested timeframe |

### WebSocket Endpoint

- **`WS /ws/live`** (`ws://localhost:8000/ws/live`):
  - Sends initial room state immediately upon connection.
  - Broadcasts live update payload containing all 5 rooms every 5 seconds.

---

## Sample Response (`GET /rooms`)

```json
[
  {
    "room_id": "ICU-101",
    "name": "Isolation Unit 1 (Negative Pressure)",
    "status": "safe",
    "latest_reading": {
      "id": 1205,
      "room_id": "ICU-101",
      "timestamp": "2026-08-10T13:27:00.000000+00:00",
      "pm25": 8.42,
      "pm10": 14.88,
      "co2": 452.1,
      "temperature": 21.05,
      "humidity": 42.3
    }
  },
  {
    "room_id": "ICU-102",
    "name": "General ICU Room A",
    "status": "safe",
    "latest_reading": {
      "id": 1206,
      "room_id": "ICU-102",
      "timestamp": "2026-08-10T13:27:00.000000+00:00",
      "pm25": 11.95,
      "pm10": 19.42,
      "co2": 518.3,
      "temperature": 22.12,
      "humidity": 47.1
    }
  }
]
```
