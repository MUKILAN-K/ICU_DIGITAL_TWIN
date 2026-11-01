"""
FastAPI Backend Application for ICU Air Quality Monitoring System.
Provides REST APIs, WebSocket streaming, WHO threshold evaluations,
predictive analytics / forecasting, and reproducible background simulation scenarios.
"""

import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Dict, Any, Set, Optional
from fastapi import FastAPI, HTTPException, Query, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    init_db,
    get_latest_reading_for_room,
    get_latest_readings_all_rooms,
    get_room_history,
    save_alert,
    get_alerts,
    set_alert_acknowledged,
)
from thresholds import evaluate_room_status, THRESHOLDS
from simulator import simulator, ROOM_PROFILES, canonicalize_room_id
from forecast import generate_room_forecast, evaluate_models_on_dataset, normalize_param_key


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
    """Callback triggered by simulator every tick to push WebSocket updates and check alerts."""
    # Check for threshold breaches and log alerts into database
    for r in readings:
        room_id = r.get("room_id")
        status_info = evaluate_room_status(r)
        breakdown = status_info.get("breakdown", {})

        for param, details in breakdown.items():
            if details["status"] in ("warning", "alert"):
                # Save alert with deduplicated alert_id for current hour/minute window
                now_str = datetime.now(timezone.utc).strftime("%Y%m%d%H%M")
                alert_id = f"alt_{room_id}_{param}_{details['status']}_{now_str[:11]}"
                thresh_val = details.get("threshold_warning") if details["status"] == "alert" else details.get("threshold_safe")

                save_alert({
                    "alert_id": alert_id,
                    "room_id": room_id,
                    "parameter": param,
                    "current_or_predicted_value": details["value"],
                    "threshold": thresh_val or 0.0,
                    "timestamp": r.get("timestamp", datetime.now(timezone.utc).isoformat()),
                    "alert_category": "current_measurement",
                    "warning_status": details["status"],
                    "message": f"{room_id} {param.upper()} threshold exceeded: {details['value']} {details['unit']}",
                    "acknowledged": False,
                })

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

    # Seed 60 mins of history if DB is empty or lacks all rooms
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
    title="ICU Air Quality Digital Twin API",
    description="Backend service providing distributed ICU environmental surveillance, time-series forecasting, and simulation scenarios.",
    version="2.0.0",
    lifespan=lifespan,
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request schemas
class ScenarioRequest(BaseModel):
    scenario: str  # 'stable' | 'increasing' | 'sudden_spike' | 'recovery' | 'room_disturbance'
    room_id: Optional[str] = None
    parameter: Optional[str] = None
    magnitude: Optional[float] = None


class ControlRequest(BaseModel):
    action: str  # 'pause' | 'resume' | 'set_speed'
    speed_seconds: Optional[float] = None
    seed: Optional[int] = None


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "service": "ICU Air Quality Digital Twin Monitoring System",
        "rooms_monitored": list(ROOM_PROFILES.keys()),
        "active_scenario": simulator.current_scenario,
        "is_paused": simulator.paused,
        "tick_interval_seconds": simulator.interval_seconds,
    }


@app.get("/rooms", tags=["Rooms"])
def get_rooms():
    """List all 5 canonical ICU rooms with current status, breakdown, and latest readings."""
    latest_readings = get_latest_readings_all_rooms()
    reading_by_room = {r["room_id"]: r for r in latest_readings}

    result = []
    for room_id, profile in ROOM_PROFILES.items():
        reading = reading_by_room.get(room_id)
        if reading:
            status_info = evaluate_room_status(reading)
            status = status_info["overall_status"]
            breakdown = status_info["breakdown"]
        else:
            status = "unknown"
            breakdown = {}

        result.append({
            "room_id": room_id,
            "alias": profile.get("alias", room_id),
            "name": profile["name"],
            "unit_type": profile.get("unit_type", "ICU"),
            "status": status,
            "latest_reading": reading,
            "breakdown": breakdown,
        })

    return result


@app.get("/rooms/{room_id}/current", tags=["Rooms"])
def get_room_current(room_id: str):
    """Fetch latest measurements and threshold evaluation for an individual ICU room."""
    canon_id = canonicalize_room_id(room_id)
    if canon_id not in ROOM_PROFILES:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found. Valid IDs: {list(ROOM_PROFILES.keys())}")

    reading = get_latest_reading_for_room(canon_id)
    if not reading:
        raise HTTPException(status_code=404, detail=f"No sensor readings recorded for {canon_id} yet.")

    status_info = evaluate_room_status(reading)

    return {
        "room_id": canon_id,
        "alias": ROOM_PROFILES[canon_id].get("alias", canon_id),
        "name": ROOM_PROFILES[canon_id]["name"],
        "unit_type": ROOM_PROFILES[canon_id].get("unit_type", "ICU"),
        "overall_status": status_info["overall_status"],
        "latest_reading": reading,
        "breakdown": status_info["breakdown"],
    }


@app.get("/rooms/{room_id}/history", tags=["Rooms"])
def get_room_history_endpoint(room_id: str, minutes: int = Query(default=60, ge=1, le=1440)):
    """Fetch historical sensor readings for an individual ICU room over a requested window."""
    canon_id = canonicalize_room_id(room_id)
    if canon_id not in ROOM_PROFILES:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found. Valid IDs: {list(ROOM_PROFILES.keys())}")

    history = get_room_history(canon_id, minutes=minutes)
    return {
        "room_id": canon_id,
        "name": ROOM_PROFILES[canon_id]["name"],
        "minutes_requested": minutes,
        "total_records": len(history),
        "history": history,
    }


@app.get("/rooms/{room_id}/forecast", tags=["Predictive Analytics"])
def get_room_forecast_endpoint(
    room_id: str,
    parameter: str = Query(default="pm25_ug_m3", description="Parameter to forecast (pm25_ug_m3, pm10_ug_m3, co2_ppm, temperature_c, relative_humidity_pct)"),
    horizon_minutes: int = Query(default=30, ge=5, le=120, description="Forecast horizon in minutes"),
):
    """
    Generates time-series environmental forecast using Damped Holt Linear Trend model,
    comparing against baseline persistence with 95% confidence bounds.
    """
    canon_id = canonicalize_room_id(room_id)
    if canon_id not in ROOM_PROFILES:
        raise HTTPException(status_code=404, detail=f"Room '{room_id}' not found. Valid IDs: {list(ROOM_PROFILES.keys())}")

    # Fetch last 120 minutes of history for training/trend estimation
    history = get_room_history(canon_id, minutes=120)
    forecast_data = generate_room_forecast(
        room_id=canon_id,
        history_records=history,
        parameter=parameter,
        horizon_minutes=horizon_minutes,
        step_minutes=5,
        thresholds=THRESHOLDS,
    )

    # Check if a forecast-based alert is detected
    alert_risk = forecast_data.get("forecast_alert_risk", {})
    if alert_risk.get("has_projected_breach"):
        alert_id = f"fc_alt_{canon_id}_{parameter}_{alert_risk['severity']}_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}"
        save_alert({
            "alert_id": alert_id,
            "room_id": canon_id,
            "parameter": parameter,
            "current_or_predicted_value": alert_risk["projected_breach_value"],
            "threshold": alert_risk["configured_warning_limit"] if alert_risk["severity"] == "alert" else alert_risk["configured_safe_limit"],
            "timestamp": alert_risk["projected_breach_time"] or datetime.now(timezone.utc).isoformat(),
            "alert_category": "forecast_based",
            "warning_status": alert_risk["severity"],
            "message": f"FORECAST ALERT: {canon_id} {parameter.upper()} projected to reach {alert_risk['projected_breach_value']} at {alert_risk['projected_breach_time']}",
            "acknowledged": False,
        })

    return forecast_data


@app.get("/forecast/evaluate", tags=["Predictive Analytics"])
def get_forecast_evaluation():
    """
    Evaluates forecasting quality on held-out simulated data from dataset.
    Returns comparative MAE and RMSE for Holt-Winters vs Baseline Persistence.
    """
    return evaluate_models_on_dataset()


@app.post("/simulation/scenario", tags=["Simulation Control"])
def set_simulation_scenario(req: ScenarioRequest):
    """Trigger repeatable simulation scenario (stable, increasing, sudden_spike, recovery, room_disturbance)."""
    res = simulator.apply_scenario(
        scenario=req.scenario,
        room_id=req.room_id,
        parameter=req.parameter,
        magnitude=req.magnitude,
    )
    return res


@app.post("/simulation/control", tags=["Simulation Control"])
def control_simulation(req: ControlRequest):
    """Pause, resume, change speed, or seed random generator."""
    if req.action == "pause":
        simulator.pause()
    elif req.action == "resume":
        simulator.resume()
    elif req.action == "set_speed" and req.speed_seconds:
        simulator.interval_seconds = max(1.0, min(30.0, req.speed_seconds))

    if req.seed is not None:
        simulator.set_seed(req.seed)

    return {
        "status": "ok",
        "action": req.action,
        "is_paused": simulator.paused,
        "interval_seconds": simulator.interval_seconds,
        "active_scenario": simulator.current_scenario,
    }


@app.get("/alerts", tags=["Alerts"])
def get_alerts_endpoint(room_id: Optional[str] = None, limit: int = Query(default=50, ge=1, le=200)):
    """Fetch active and historical environmental alerts."""
    canon_id = canonicalize_room_id(room_id) if room_id else None
    return {
        "total_alerts": len(get_alerts(canon_id, limit)),
        "alerts": get_alerts(canon_id, limit),
    }


@app.post("/alerts/{alert_id}/acknowledge", tags=["Alerts"])
def acknowledge_alert_endpoint(alert_id: str):
    """Acknowledge a specific alert."""
    success = set_alert_acknowledged(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Alert {alert_id} not found.")
    return {"status": "ok", "alert_id": alert_id, "acknowledged": True}


@app.websocket("/ws/live")
async def websocket_live_endpoint(websocket: WebSocket):
    """WebSocket streaming endpoint broadcasting real-time readings for all 5 rooms."""
    await manager.connect(websocket)
    try:
        # Immediately push initial state
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
            "scenario": simulator.current_scenario,
        })

        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
