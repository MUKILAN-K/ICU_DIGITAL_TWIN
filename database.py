"""
SQLite Database Layer for ICU Air Quality Monitoring System.
Handles schema initialization, reading insertion, alerts storage,
and queries for current/historical data with alias normalization.
"""

import sqlite3
import os
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

DB_FILE = "icu_air_quality.db"

# Canonical alias mapping
ROOM_EQUIVALENTS = {
    "ICU-01": ["ICU-01", "ICU_01", "ICU-101"],
    "ICU-02": ["ICU-02", "ICU_02", "ICU-102"],
    "ICU-03": ["ICU-03", "ICU_03", "ICU-103"],
    "ICU-04": ["ICU-04", "ICU_04", "ICU-104"],
    "ICU-05": ["ICU-05", "ICU_05", "ICU-105"],
    "ICU-101": ["ICU-01", "ICU_01", "ICU-101"],
    "ICU-102": ["ICU-02", "ICU_02", "ICU-102"],
    "ICU-103": ["ICU-03", "ICU_03", "ICU-103"],
    "ICU-104": ["ICU-04", "ICU_04", "ICU-104"],
    "ICU-105": ["ICU-05", "ICU_05", "ICU-105"],
}


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with Row factory and WAL mode enabled for concurrency."""
    conn = sqlite3.connect(DB_FILE, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db():
    """Creates the readings and alerts tables and indexes if they do not exist."""
    with get_db_connection() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                room_id TEXT NOT NULL,
                timestamp TEXT NOT NULL,
                pm25 REAL NOT NULL,
                pm10 REAL NOT NULL,
                co2 REAL NOT NULL,
                temperature REAL NOT NULL,
                humidity REAL NOT NULL
            );
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_room_timestamp 
            ON readings(room_id, timestamp);
        """)

        # Alerts Audit Table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                alert_id TEXT UNIQUE NOT NULL,
                room_id TEXT NOT NULL,
                parameter TEXT NOT NULL,
                current_or_predicted_value REAL NOT NULL,
                threshold REAL NOT NULL,
                timestamp TEXT NOT NULL,
                alert_category TEXT NOT NULL, -- 'current_measurement' or 'forecast_based'
                warning_status TEXT NOT NULL, -- 'warning' or 'alert'
                message TEXT NOT NULL,
                acknowledged INTEGER DEFAULT 0
            );
        """)
        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_alerts_room 
            ON alerts(room_id, timestamp);
        """)
        conn.commit()


def normalize_row_dict(row_dict: Dict[str, Any]) -> Dict[str, Any]:
    """Applies canonical room_id and full contract keys."""
    r_id = row_dict.get("room_id", "")
    for canon, aliases in ROOM_EQUIVALENTS.items():
        if r_id in aliases:
            r_id = canon
            break

    pm25 = round(row_dict.get("pm25", 0.0), 2)
    pm10 = round(row_dict.get("pm10", 0.0), 2)
    co2 = round(row_dict.get("co2", 0.0), 2)
    temp = round(row_dict.get("temperature", 0.0), 2)
    hum = round(row_dict.get("humidity", 0.0), 2)

    return {
        "id": row_dict.get("id"),
        "room_id": r_id,
        "timestamp": row_dict.get("timestamp"),
        "pm25_ug_m3": pm25,
        "pm10_ug_m3": pm10,
        "co2_ppm": co2,
        "temperature_c": temp,
        "relative_humidity_pct": hum,
        # Backward-compat aliases
        "pm25": pm25,
        "pm10": pm10,
        "co2": co2,
        "temperature": temp,
        "humidity": hum,
        "data_type": "simulated_database_record",
    }


def save_reading(
    room_id: str,
    timestamp: str,
    pm25: float,
    pm10: float,
    co2: float,
    temperature: float,
    humidity: float
) -> Dict[str, Any]:
    """Inserts a single sensor reading into SQLite DB."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO readings (room_id, timestamp, pm25, pm10, co2, temperature, humidity)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (room_id, timestamp, pm25, pm10, co2, temperature, humidity))
        conn.commit()
        reading_id = cursor.lastrowid

    raw = {
        "id": reading_id,
        "room_id": room_id,
        "timestamp": timestamp,
        "pm25": pm25,
        "pm10": pm10,
        "co2": co2,
        "temperature": temperature,
        "humidity": humidity,
    }
    return normalize_row_dict(raw)


def save_batch_readings(readings: List[Dict[str, Any]]):
    """Inserts a batch of readings into SQLite DB."""
    insert_records = []
    for r in readings:
        insert_records.append({
            "room_id": r.get("room_id"),
            "timestamp": r.get("timestamp"),
            "pm25": r.get("pm25", r.get("pm25_ug_m3", 0.0)),
            "pm10": r.get("pm10", r.get("pm10_ug_m3", 0.0)),
            "co2": r.get("co2", r.get("co2_ppm", 0.0)),
            "temperature": r.get("temperature", r.get("temperature_c", 0.0)),
            "humidity": r.get("humidity", r.get("relative_humidity_pct", 0.0)),
        })

    with get_db_connection() as conn:
        conn.executemany("""
            INSERT INTO readings (room_id, timestamp, pm25, pm10, co2, temperature, humidity)
            VALUES (:room_id, :timestamp, :pm25, :pm10, :co2, :temperature, :humidity)
        """, insert_records)
        conn.commit()


def get_latest_reading_for_room(room_id: str) -> Optional[Dict[str, Any]]:
    """Fetches the latest reading for a specific room across any of its aliases."""
    aliases = ROOM_EQUIVALENTS.get(room_id, [room_id])
    placeholders = ",".join("?" for _ in aliases)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT id, room_id, timestamp, pm25, pm10, co2, temperature, humidity
            FROM readings
            WHERE room_id IN ({placeholders})
            ORDER BY timestamp DESC, id DESC
            LIMIT 1
        """, tuple(aliases))
        row = cursor.fetchone()
        if row:
            return normalize_row_dict(dict(row))
        return None


def get_latest_readings_all_rooms() -> List[Dict[str, Any]]:
    """Fetches the latest reading for each of the 5 canonical rooms."""
    canonical_rooms = ["ICU-01", "ICU-02", "ICU-03", "ICU-04", "ICU-05"]
    result = []
    for cr in canonical_rooms:
        latest = get_latest_reading_for_room(cr)
        if latest:
            result.append(latest)
    return result


def get_room_history(room_id: str, minutes: int = 60) -> List[Dict[str, Any]]:
    """Fetches historical readings for a specific room within past `minutes`."""
    cutoff_time = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
    aliases = ROOM_EQUIVALENTS.get(room_id, [room_id])
    placeholders = ",".join("?" for _ in aliases)

    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute(f"""
            SELECT id, room_id, timestamp, pm25, pm10, co2, temperature, humidity
            FROM readings
            WHERE room_id IN ({placeholders}) AND timestamp >= ?
            ORDER BY timestamp ASC
        """, tuple(aliases) + (cutoff_time,))
        rows = cursor.fetchall()
        return [normalize_row_dict(dict(row)) for row in rows]


def save_alert(alert_data: Dict[str, Any]) -> Dict[str, Any]:
    """Records an alert into SQLite DB (deduplicates recent alerts by alert_id)."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO alerts (
                alert_id, room_id, parameter, current_or_predicted_value,
                threshold, timestamp, alert_category, warning_status, message, acknowledged
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            alert_data["alert_id"],
            alert_data["room_id"],
            alert_data["parameter"],
            float(alert_data["current_or_predicted_value"]),
            float(alert_data["threshold"]),
            alert_data["timestamp"],
            alert_data.get("alert_category", "current_measurement"),
            alert_data.get("warning_status", "warning"),
            alert_data.get("message", "Threshold breached"),
            1 if alert_data.get("acknowledged") else 0
        ))
        conn.commit()
    return alert_data


def get_alerts(room_id: Optional[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves alerts, optionally filtered by room."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        if room_id:
            aliases = ROOM_EQUIVALENTS.get(room_id, [room_id])
            placeholders = ",".join("?" for _ in aliases)
            cursor.execute(f"""
                SELECT alert_id, room_id, parameter, current_or_predicted_value,
                       threshold, timestamp, alert_category, warning_status, message, acknowledged
                FROM alerts
                WHERE room_id IN ({placeholders})
                ORDER BY timestamp DESC
                LIMIT ?
            """, tuple(aliases) + (limit,))
        else:
            cursor.execute("""
                SELECT alert_id, room_id, parameter, current_or_predicted_value,
                       threshold, timestamp, alert_category, warning_status, message, acknowledged
                FROM alerts
                ORDER BY timestamp DESC
                LIMIT ?
            """, (limit,))
        rows = cursor.fetchall()
        return [dict(r) for r in rows]


def set_alert_acknowledged(alert_id: str) -> bool:
    """Marks an alert as acknowledged in the DB."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET acknowledged = 1 WHERE alert_id = ?", (alert_id,))
        conn.commit()
        return cursor.rowcount > 0
