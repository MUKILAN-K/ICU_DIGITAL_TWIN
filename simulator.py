"""
Background Sensor Simulator for 5 ICU Rooms.
Generates realistic air quality data featuring diurnal cycles, decaying spikes,
room-specific baseline distinctions, and realistic sensor noise.
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
    "ICU-101": {
        "name": "Isolation Unit 1 (Negative Pressure)",
        "base_pm25": 8.0,
        "base_pm10": 14.0,
        "base_co2": 440.0,
        "base_temp": 21.0,
        "base_humidity": 42.0,
    },
    "ICU-102": {
        "name": "General ICU Room A",
        "base_pm25": 11.5,
        "base_pm10": 19.0,
        "base_co2": 510.0,
        "base_temp": 22.0,
        "base_humidity": 47.0,
    },
    "ICU-103": {
        "name": "General ICU Room B",
        "base_pm25": 14.0,
        "base_pm10": 23.0,
        "base_co2": 570.0,
        "base_temp": 22.5,
        "base_humidity": 49.0,
    },
    "ICU-104": {
        "name": "High Occupancy Suite",
        "base_pm25": 18.5,
        "base_pm10": 29.0,
        "base_co2": 660.0,
        "base_temp": 23.5,
        "base_humidity": 53.0,
    },
    "ICU-105": {
        "name": "Post-Op Recovery Room",
        "base_pm25": 15.0,
        "base_pm10": 24.0,
        "base_co2": 610.0,
        "base_temp": 22.8,
        "base_humidity": 51.0,
    },
}

DECAY_RATE = 0.70  # Spikes decay by ~30% each tick (5 seconds)


class ICUSimulator:
    def __init__(self):
        self.running = False
        self.subscribers: List[Callable[[List[Dict[str, Any]]], Any]] = []
        # Track active decaying spikes per room
        self.spikes = {
            room_id: {"pm25": 0.0, "pm10": 0.0, "co2": 0.0, "temp": 0.0, "humidity": 0.0}
            for room_id in ROOM_PROFILES.keys()
        }

    def subscribe(self, callback: Callable[[List[Dict[str, Any]]], Any]):
        """Subscribe to live room updates."""
        self.subscribers.append(callback)

    def unsubscribe(self, callback: Callable[[List[Dict[str, Any]]], Any]):
        if callback in self.subscribers:
            self.subscribers.remove(callback)

    def calculate_diurnal_factor(self, dt: datetime) -> float:
        """
        Calculates diurnal factor between 0.0 (night baseline) and 1.0 (daytime peak).
        Peak hospital activity occurs between 08:00 and 18:00.
        """
        hour_val = dt.hour + dt.minute / 60.0 + dt.second / 3600.0
        # Sinusoidal curve offset so peak is at ~14:00 (2 PM) and trough at ~02:00 (2 AM)
        radians = (hour_val - 8.0) * math.pi / 12.0
        sin_val = math.sin(radians)
        # Scale to range [0.0, 1.0]
        return max(0.0, min(1.0, (sin_val + 1.0) / 2.0))

    def _maybe_trigger_spike(self, room_id: str):
        """Randomly triggers spikes simulating doors opening, sterilizer use, or equipment activity."""
        # 12% probability per tick per room to introduce a event spike
        if random.random() < 0.12:
            event_type = random.choice(["door_open", "equipment_use", "hvac_shift", "occupant_surge"])
            if event_type == "door_open":
                self.spikes[room_id]["pm25"] += random.uniform(12.0, 30.0)
                self.spikes[room_id]["pm10"] += random.uniform(20.0, 45.0)
                self.spikes[room_id]["co2"] += random.uniform(150.0, 350.0)
            elif event_type == "equipment_use":
                self.spikes[room_id]["pm25"] += random.uniform(15.0, 35.0)
                self.spikes[room_id]["pm10"] += random.uniform(25.0, 50.0)
            elif event_type == "hvac_shift":
                self.spikes[room_id]["temp"] += random.uniform(1.2, 2.5) * random.choice([1, -1])
                self.spikes[room_id]["humidity"] += random.uniform(4.0, 9.0) * random.choice([1, -1])
            elif event_type == "occupant_surge":
                self.spikes[room_id]["co2"] += random.uniform(200.0, 450.0)
                self.spikes[room_id]["pm25"] += random.uniform(8.0, 18.0)

    def _decay_spikes(self, room_id: str):
        """Decays active spikes smoothly over time."""
        for param in self.spikes[room_id]:
            self.spikes[room_id][param] *= DECAY_RATE
            if abs(self.spikes[room_id][param]) < 0.05:
                self.spikes[room_id][param] = 0.0

    def generate_reading(self, room_id: str, dt: datetime) -> Dict[str, Any]:
        """Generates a single room reading for timestamp `dt`."""
        profile = ROOM_PROFILES[room_id]
        diurnal = self.calculate_diurnal_factor(dt)

        # Decay existing spikes and check for new random events
        self._decay_spikes(room_id)
        self._maybe_trigger_spike(room_id)

        current_spikes = self.spikes[room_id]

        # Diurnal offsets
        diurnal_pm25 = diurnal * 6.0
        diurnal_pm10 = diurnal * 10.0
        diurnal_co2 = diurnal * 220.0
        diurnal_temp = diurnal * 1.2
        diurnal_humidity = diurnal * 3.5

        # Sensor noise
        noise_pm25 = random.gauss(0, 0.6)
        noise_pm10 = random.gauss(0, 1.0)
        noise_co2 = random.gauss(0, 8.0)
        noise_temp = random.gauss(0, 0.1)
        noise_humidity = random.gauss(0, 0.3)

        # Final calculated values
        pm25 = max(3.0, profile["base_pm25"] + diurnal_pm25 + current_spikes["pm25"] + noise_pm25)
        # Ensure PM10 is strictly >= PM2.5
        pm10 = max(pm25 + 2.0, profile["base_pm10"] + diurnal_pm10 + current_spikes["pm10"] + noise_pm10)
        co2 = max(400.0, profile["base_co2"] + diurnal_co2 + current_spikes["co2"] + noise_co2)
        temp = max(18.0, min(28.0, profile["base_temp"] + diurnal_temp + current_spikes["temp"] + noise_temp))
        humidity = max(30.0, min(70.0, profile["base_humidity"] + diurnal_humidity + current_spikes["humidity"] + noise_humidity))

        return {
            "room_id": room_id,
            "timestamp": dt.isoformat(),
            "pm25": round(pm25, 2),
            "pm10": round(pm10, 2),
            "co2": round(co2, 2),
            "temperature": round(temp, 2),
            "humidity": round(humidity, 2),
        }

    def seed_initial_history(self, minutes: int = 60):
        """Seeds historical readings for all 5 rooms for the past `minutes` if DB is empty."""
        now = datetime.now(timezone.utc)
        start_time = now - timedelta(minutes=minutes)
        step_seconds = 15  # 1 reading every 15s for historical seed gives ~240 points per room

        batch = []
        # Temporarily save spikes state
        temp_spikes = {k: dict(v) for k, v in self.spikes.items()}

        current_time = start_time
        while current_time <= now:
            for room_id in ROOM_PROFILES.keys():
                reading = self.generate_reading(room_id, current_time)
                batch.append(reading)
            current_time += timedelta(seconds=step_seconds)

        save_batch_readings(batch)
        print(f"Seeded {len(batch)} historical readings across 5 rooms for past {minutes} minutes.")

    async def start(self, interval_seconds: float = 5.0):
        """Runs the background simulation loop every `interval_seconds`."""
        self.running = True
        print(f"Background ICU simulator started. Generating readings every {interval_seconds}s...")

        while self.running:
            try:
                now = datetime.now(timezone.utc)
                tick_readings = []
                for room_id in ROOM_PROFILES.keys():
                    reading = self.generate_reading(room_id, now)
                    save_reading(
                        room_id=reading["room_id"],
                        timestamp=reading["timestamp"],
                        pm25=reading["pm25"],
                        pm10=reading["pm10"],
                        co2=reading["co2"],
                        temperature=reading["temperature"],
                        humidity=reading["humidity"]
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

            await asyncio.sleep(interval_seconds)

    def stop(self):
        """Stops the simulator loop."""
        self.running = False


# Global simulator instance
simulator = ICUSimulator()
