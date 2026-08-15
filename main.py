"""
FastAPI Backend Application for ICU Air Quality Monitoring System.
Provides REST APIs, WebSocket streaming, WHO threshold evaluations, and background simulation.
"""

import asyncio
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Set
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database import (
    init_db,
    get_latest_reading_for_room,
    get_latest_readings_all_rooms,
    get_room_history,
)
from thresholds import evaluate_room_status
from simulator import simulator, ROOM_PROFILES


class ConnectionManager:
    """Manages active WebSocket connections and broadcasts live room updates."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, data: Dict[str, Any]):
        disconnected = set()
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.add(connection)

        for conn in disconnected:
            self.active_connections.discard(conn)


manager = ConnectionManager()


async def on_simulator_tick(readings: List[Dict[str, Any]]):
    """Callback triggered by simulator every 5 seconds to push WebSocket updates."""
    payload = {
        "type": "live_update",
        "timestamp": readings[0]["timestamp"] if readings else None,
        "rooms": readings,
    }
    await manager.broadcast(payload)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """FastAPI Lifespan context manager for DB init and background simulator task."""
    init_db()

    # Check if DB has historical data; if not, seed 60 mins of history
    latest_all = get_latest_readings_all_rooms()
    if len(latest_all) < len(ROOM_PROFILES):
        simulator.seed_initial_history(minutes=60)

    # Subscribe websocket broadcaster to simulator events
    simulator.subscribe(on_simulator_tick)

    # Start simulator task in background asyncio loop
    sim_task = asyncio.create_task(simulator.start(interval_seconds=5.0))

    yield

    # Shutdown logic
    simulator.stop()
    sim_task.cancel()


app = FastAPI(
    title="ICU Air Quality Monitoring API",
    description="Simulated ICU digital twin backend with WHO air threshold evaluations and real-time WebSockets.",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend applications on any origin
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "ICU Air Quality Monitoring API",
        "rooms_monitored": list(ROOM_PROFILES.keys()),
    }


@app.get("/rooms", tags=["Rooms"])
def get_rooms():
    """List all 5 ICU rooms with current air quality status and latest readings."""
    latest_readings = get_latest_readings_all_rooms()
    reading_by_room = {r["room_id"]: r for r in latest_readings}

    result = []
    for room_id, profile in ROOM_PROFILES.items():
        reading = reading_by_room.get(room_id)
        if reading:
            status_info = evaluate_room_status(reading)
            status = status_info["overall_status"]
        else:
            status = "unknown"

        result.append({
            "room_id": room_id,
            "name": profile["name"],
            "status": status,
            "latest_reading": reading,
        })

    return result


@app.get("/rooms/{room_id}/current", tags=["Rooms"])
def get_room_current(room_id: str):
    """Fetch the latest reading + threshold breakdown and status for a single room."""
    if room_id not in ROOM_PROFILES:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found. Valid rooms: {list(ROOM_PROFILES.keys())}")

    reading = get_latest_reading_for_room(room_id)
    if not reading:
        raise HTTPException(status_code=404, detail=f"No sensor readings recorded for {room_id} yet.")

    status_info = evaluate_room_status(reading)

    return {
        "room_id": room_id,
        "name": ROOM_PROFILES[room_id]["name"],
        "overall_status": status_info["overall_status"],
        "latest_reading": reading,
        "breakdown": status_info["breakdown"],
    }


@app.get("/rooms/{room_id}/history", tags=["Rooms"])
def get_room_history_endpoint(room_id: str, minutes: int = Query(default=60, ge=1, le=1440)):
    """Fetch historical sensor readings for a room over the requested time window (in minutes)."""
    if room_id not in ROOM_PROFILES:
        raise HTTPException(status_code=404, detail=f"Room {room_id} not found. Valid rooms: {list(ROOM_PROFILES.keys())}")

    history = get_room_history(room_id, minutes=minutes)
    return {
        "room_id": room_id,
        "name": ROOM_PROFILES[room_id]["name"],
        "minutes_requested": minutes,
        "total_records": len(history),
        "history": history,
    }


@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    """WebSocket endpoint pushing updated readings for all rooms every 5 seconds."""
    await manager.connect(websocket)
    try:
        # Immediately send current state upon connection
        latest_readings = get_latest_readings_all_rooms()
        rooms_payload = []
        for r in latest_readings:
            st = evaluate_room_status(r)
            r_copy = dict(r)
            r_copy["status"] = st["overall_status"]
            r_copy["breakdown"] = st["breakdown"]
            rooms_payload.append(r_copy)

        await websocket.send_json({
            "type": "initial_state",
            "rooms": rooms_payload,
        })

        # Keep connection open and listen for client messages / disconnects
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
