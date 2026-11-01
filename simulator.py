"""
Background Sensor Simulator for 5 ICU Rooms.
Generates realistic air quality data featuring diurnal cycles, decaying spikes,
room-specific baseline distinctions, realistic sensor noise, and repeatable simulation scenarios.

DISCLAIMER:
All values are synthetic and generated for demonstration of digital twin software systems.
They do not represent real medical devices or physical patient data.
"""

import asyncio
import random
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Callable, Optional
from database import save_batch_readings, save_reading, get_latest_readings_all_rooms
from thresholds import evaluate_room_status

# Room Baseline Profiles with visual & physical distinction
ROOM_PROFILES = {
    "ICU-01": {
        "name": "Bed 1 — Negative Pressure Isolation",
        "alias": "ICU-101",
        "base_pm25": 8.0,
        "base_pm10": 14.0,
        "base_co2": 440.0,
        "base_temp": 21.0,
        "base_humidity": 42.0,
        "unit_type": "Negative Pressure Isolation",
    },
    "ICU-02": {
        "name": "Bed 2 — General ICU Suite A",
        "alias": "ICU-102",
        "base_pm25": 11.5,
        "base_pm10": 19.0,
        "base_co2": 510.0,
        "base_temp": 22.0,
        "base_humidity": 47.0,
        "unit_type": "General ICU",
    },
    "ICU-03": {
        "name": "Bed 3 — General ICU Suite B",
        "alias": "ICU-103",
        "base_pm25": 14.0,
        "base_pm10": 23.0,
        "base_co2": 570.0,
        "base_temp": 22.5,
        "base_humidity": 49.0,
        "unit_type": "General ICU",
    },
    "ICU-04": {
        "name": "Bed 4 — Neuro-Trauma Suite",
        "alias": "ICU-104",
        "base_pm25": 18.5,
        "base_pm10": 29.0,
        "base_co2": 660.0,
        "base_temp": 23.5,
        "base_humidity": 53.0,
        "unit_type": "Neuro-Trauma ICU",
    },
    "ICU-05": {
        "name": "Bed 5 — Post-Op Surgical Recovery",
        "alias": "ICU-105",
        "base_pm25": 15.0,
        "base_pm10": 24.0,
        "base_co2": 610.0,
        "base_temp": 22.8,
        "base_humidity": 51.0,
        "unit_type": "Post-Op Recovery",
    },
}

# Alias lookup table for robust ID matching
ROOM_ALIAS_MAP = {
    "ICU-01": "ICU-01", "ICU_01": "ICU-01", "ICU-101": "ICU-01", "ICU101": "ICU-01", "BED-1": "ICU-01", "BED 1": "ICU-01",
    "ICU-02": "ICU-02", "ICU_02": "ICU-02", "ICU-102": "ICU-02", "ICU102": "ICU-02", "BED-2": "ICU-02", "BED 2": "ICU-02",
    "ICU-03": "ICU-03", "ICU_03": "ICU-03", "ICU-103": "ICU-03", "ICU103": "ICU-03", "BED-3": "ICU-03", "BED 3": "ICU-03",
    "ICU-04": "ICU-04", "ICU_04": "ICU-04", "ICU-104": "ICU-04", "ICU104": "ICU-04", "BED-4": "ICU-04", "BED 4": "ICU-04",
    "ICU-05": "ICU-05", "ICU_05": "ICU-05", "ICU-105": "ICU-05", "ICU105": "ICU-05", "BED-5": "ICU-05", "BED 5": "ICU-05",
}

def canonicalize_room_id(raw_id: str) -> str:
    cleaned = raw_id.strip().upper()
    return ROOM_ALIAS_MAP.get(cleaned, cleaned)

DECAY_RATE = 0.70  # Spikes decay by ~30% each tick (5 seconds)


class ICUSimulator:
    def __init__(self):
        self.running = False
        self.paused = False
        self.interval_seconds = 5.0
        self.current_scenario = "stable"
        self.subscribers: List[Callable[[List[Dict[str, Any]]], Any]] = []

        # Active decaying spikes per room
        self.spikes = {
            room_id: {"pm25": 0.0, "pm10": 0.0, "co2": 0.0, "temp": 0.0, "humidity": 0.0}
            for room_id in ROOM_PROFILES.keys()
        }

        # Active continuous drift per room (for 'increasing' scenario)
        self.drifts = {
            room_id: {"pm25": 0.0, "pm10": 0.0, "co2": 0.0, "temp": 0.0, "humidity": 0.0}
            for room_id in ROOM_PROFILES.keys()
        }

    def subscribe(self, callback: Callable[[List[Dict[str, Any]]], Any]):
        """Subscribe to live room updates."""
        self.subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[List[Dict[str, Any]]], Any]):
        if callback in self.subscribers:
            self.subscribers.remove(callback)

    def set_seed(self, seed: int):
        """Sets deterministic random seed for reproducible scenario demonstrations."""
        random.seed(seed)

    def calculate_diurnal_factor(self, dt: datetime) -> float:
        """
        Calculates diurnal factor between 0.0 (night baseline) and 1.0 (daytime peak).
        Peak hospital activity occurs between 08:00 and 18:00.
        """
        hour_val = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
        radians = (hour_val - 8.0) * math.pi / 12.0
        sin_val = math.sin(radians)
        return max(0.0, min(1.0, (sin_val + 1.0) / 2.0))

    def apply_scenario(
        self,
        scenario: str,
        room_id: Optional[str] = None,
        parameter: Optional[str] = None,
        magnitude: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Applies one of the 5 reproducible scenarios:
        - 'stable': Normal baseline conditions, clears all spikes.
        - 'increasing': Cumulative creeping values simulating filter degradation.
        - 'sudden_spike': Immediate acute spike on target room/parameter.
        - 'recovery': Active bio-HVAC purge returning room to optimal baseline.
        - 'room_disturbance': Isolated disturbance strictly on one room (e.g. ICU-03).
        """
        self.current_scenario = scenario
        target_room = canonicalize_room_id(room_id) if room_id else None

        if scenario == "stable":
            for r in self.spikes:
                for p in self.spikes[r]:
                    self.spikes[r][p] = 0.0
                    self.drifts[r][p] = 0.0
            return {"status": "ok", "scenario": "stable", "message": "All rooms restored to stable baseline conditions."}

        elif scenario == "increasing":
            # Gradually increment drift rates
            targets = [target_room] if target_room and target_room in self.drifts else list(self.drifts.keys())
            for r in targets:
                self.drifts[r]["pm25"] += (magnitude or 2.5)
                self.drifts[r]["co2"] += (magnitude or 40.0) * 1.5
                self.drifts[r]["pm10"] += (magnitude or 3.5)
            return {"status": "ok", "scenario": "increasing", "targets": targets, "message": "Initiated gradual parameter accumulation."}

        elif scenario == "sudden_spike":
            r = target_room or "ICU-03"
            if r in self.spikes:
                mag = magnitude or 1.0
                self.spikes[r]["pm25"] += 28.0 * mag
                self.spikes[r]["pm10"] += 45.0 * mag
                self.spikes[r]["co2"] += 380.0 * mag
            return {"status": "ok", "scenario": "sudden_spike", "room": r, "message": f"Injected sudden acute aerosol/CO2 spike into {r}."}

        elif scenario == "recovery":
            targets = [target_room] if target_room and target_room in self.spikes else list(self.spikes.keys())
            for r in targets:
                for p in self.spikes[r]:
                    self.spikes[r][p] *= 0.1
                    self.drifts[r][p] = 0.0
            return {"status": "ok", "scenario": "recovery", "targets": targets, "message": "Purge activated: rapid decay towards baseline."}

        elif scenario == "room_disturbance":
            r = target_room or "ICU-03"
            if r in self.spikes:
                self.spikes[r]["pm25"] += 22.0
                self.spikes[r]["co2"] += 320.0
                self.spikes[r]["temp"] += 1.8
            return {"status": "ok", "scenario": "room_disturbance", "room": r, "message": f"Room-specific disturbance applied strictly to {r}."}

        return {"status": "unknown_scenario", "scenario": scenario}

    def _maybe_trigger_spike(self, room_id: str):
        """Random background disturbances unless in forced stable mode."""
        if self.current_scenario == "stable":
            return

        if random.random() < 0.10:
            event_type = random.choice(["door_open", "equipment_use", "hvac_shift", "occupant_surge"])
            if event_type == "door_open":
                self.spikes[room_id]["pm25"] += random.uniform(8.0, 20.0)
                self.spikes[room_id]["pm10"] += random.uniform(14.0, 32.0)
                self.spikes[room_id]["co2"] += random.uniform(100.0, 220.0)
            elif event_type == "equipment_use":
                self.spikes[room_id]["pm25"] += random.uniform(10.0, 25.0)
                self.spikes[room_id]["pm10"] += random.uniform(18.0, 35.0)
            elif event_type == "hvac_shift":
                self.spikes[room_id]["temp"] += random.uniform(0.8, 1.8) * random.choice([1, -1])
                self.spikes[room_id]["humidity"] += random.uniform(3.0, 6.0) * random.choice([1, -1])
            elif event_type == "occupant_surge":
                self.spikes[room_id]["co2"] += random.uniform(150.0, 300.0)
                self.spikes[room_id]["pm25"] += random.uniform(6.0, 14.0)

    def _decay_spikes(self, room_id: str):
        """Decays active spikes smoothly over time."""
        for param in self.spikes[room_id]:
            self.spikes[room_id][param] *= DECAY_RATE
            if abs(self.spikes[room_id][param]) < 0.05:
                self.spikes[room_id][param] = 0.0

    def generate_reading(self, room_id: str, dt: datetime) -> Dict[str, Any]:
        """Generates a complete contract reading for timestamp `dt`."""
        canon_id = canonicalize_room_id(room_id)
        profile = ROOM_PROFILES.get(canon_id, ROOM_PROFILES["ICU-01"])
        diurnal = self.calculate_diurnal_factor(dt)

        # Decay existing spikes and check for background events
        self._decay_spikes(canon_id)
        self._maybe_trigger_spike(canon_id)

        current_spikes = self.spikes[canon_id]
        current_drifts = self.drifts[canon_id]

        # Diurnal offsets
        diurnal_pm25 = diurnal * 5.0
        diurnal_pm10 = diurnal * 8.5
        diurnal_co2 = diurnal * 180.0
        diurnal_temp = diurnal * 1.0
        diurnal_humidity = diurnal * 3.0

        # Sensor noise
        noise_pm25 = random.gauss(0, 0.5)
        noise_pm10 = random.gauss(0, 0.8)
        noise_co2 = random.gauss(0, 6.0)
        noise_temp = random.gauss(0, 0.08)
        noise_humidity = random.gauss(0, 0.25)

        # Final calculated values
        pm25 = max(2.5, profile["base_pm25"] + diurnal_pm25 + current_spikes["pm25"] + current_drifts["pm25"] + noise_pm25)
        pm10 = max(pm25 + 2.0, profile["base_pm10"] + diurnal_pm10 + current_spikes["pm10"] + current_drifts["pm10"] + noise_pm10)
        co2 = max(380.0, profile["base_co2"] + diurnal_co2 + current_spikes["co2"] + current_drifts["co2"] + noise_co2)
        temp = max(18.0, min(28.0, profile["base_temp"] + diurnal_temp + current_spikes["temp"] + current_drifts["temp"] + noise_temp))
        humidity = max(25.0, min(75.0, profile["base_humidity"] + diurnal_humidity + current_spikes["humidity"] + current_drifts["humidity"] + noise_humidity))

        # Consistent data contract matching Phase 4 of Specification
        return {
            "room_id": canon_id,
            "timestamp": dt.isoformat(),
            "pm25_ug_m3": round(pm25, 2),
            "pm10_ug_m3": round(pm10, 2),
            "co2_ppm": round(co2, 2),
            "temperature_c": round(temp, 2),
            "relative_humidity_pct": round(humidity, 2),
            # Aliases for backward compatibility
            "pm25": round(pm25, 2),
            "pm10": round(pm10, 2),
            "co2": round(co2, 2),
            "temperature": round(temp, 2),
            "humidity": round(humidity, 2),
            "data_type": "simulated_live",
            "operating_mode": self.current_scenario,
        }

    def seed_initial_history(self, minutes: int = 60):
        """Seeds historical readings for all 5 rooms for the past `minutes` if DB is empty."""
        now = datetime.now(timezone.utc)
        start_time = now - timedelta(minutes=minutes)
        step_seconds = 20

        batch = []
        current_time = start_time
        while current_time <= now:
            for room_id in ROOM_PROFILES.keys():
                reading = self.generate_reading(room_id, current_time)
                reading["data_type"] = "historical_seed"
                batch.append(reading)
            current_time += timedelta(seconds=step_seconds)

        save_batch_readings(batch)
        print(f"Seeded {len(batch)} historical readings across 5 rooms ({list(ROOM_PROFILES.keys())}).")

    async def start(self, interval_seconds: float = 5.0):
        """Runs the background simulation loop every `interval_seconds`."""
        self.interval_seconds = interval_seconds
        self.running = True
        print(f"Background ICU simulator started on 5 canonical rooms. Interval: {interval_seconds}s")

        while self.running:
            if not self.paused:
                try:
                    now = datetime.now(timezone.utc)
                    tick_readings = []
                    for room_id in ROOM_PROFILES.keys():
                        reading = self.generate_reading(room_id, now)
                        save_reading(
                            room_id=reading["room_id"],
                            timestamp=reading["timestamp"],
                            pm25=reading["pm25_ug_m3"],
                            pm10=reading["pm10_ug_m3"],
                            co2=reading["co2_ppm"],
                            temperature=reading["temperature_c"],
                            humidity=reading["relative_humidity_pct"],
                        )
                        # Evaluate status for broadcast
                        status_info = evaluate_room_status(reading)
                        reading["status"] = status_info["overall_status"]
                        reading["breakdown"] = status_info["breakdown"]
                        tick_readings.append(reading)

                    # Notify all subscribers (WebSocket clients)
                    for cb in self.subscribers:
                        try:
                            if asyncio.iscoroutinefunction(cb):
                                await cb(tick_readings)
                            else:
                                cb(tick_readings)
                        except Exception as e:
                            print(f"Error executing subscriber callback: {e}")

                except Exception as e:
                    print(f"Error in simulator loop: {e}")

            await asyncio.sleep(self.interval_seconds)

    def pause(self):
        self.paused = True

    def resume(self):
        self.paused = False

    def stop(self):
        self.running = False


# Global simulator instance
simulator = ICUSimulator()
