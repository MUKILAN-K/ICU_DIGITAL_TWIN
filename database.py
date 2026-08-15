"""
SQLite Database Layer for ICU Air Quality Monitoring System.
Handles schema initialization, reading insertion, and queries for current/historical data.
"""

import sqlite3
import os
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Any, Optional

DB_FILE = "icu_air_quality.db"


def get_db_connection() -> sqlite3.Connection:
    """Returns a SQLite connection with Row factory and WAL mode enabled for concurrency."""
    conn = sqlite3.connect(DB_FILE, timeout=10.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    return conn


def init_db():
    """Creates the readings table and indexes if they do not exist."""
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
        conn.commit()


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

    return {
        "id": reading_id,
        "room_id": room_id,
        "timestamp": timestamp,
        "pm25": round(pm25, 2),
        "pm10": round(pm10, 2),
        "co2": round(co2, 2),
        "temperature": round(temperature, 2),
        "humidity": round(humidity, 2),
    }


def save_batch_readings(readings: List[Dict[str, Any]]):
    """Inserts a batch of readings into SQLite DB."""
    with get_db_connection() as conn:
        conn.executemany("""
            INSERT INTO readings (room_id, timestamp, pm25, pm10, co2, temperature, humidity)
            VALUES (:room_id, :timestamp, :pm25, :pm10, :co2, :temperature, :humidity)
        """, readings)
        conn.commit()


def get_latest_reading_for_room(room_id: str) -> Optional[Dict[str, Any]]:
    """Fetches the latest reading for a specific room."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, room_id, timestamp, pm25, pm10, co2, temperature, humidity
            FROM readings
            WHERE room_id = ?
            ORDER BY timestamp DESC, id DESC
            LIMIT 1
        """, (room_id,))
        row = cursor.fetchone()
        if row:
            return dict(row)
        return None


def get_latest_readings_all_rooms() -> List[Dict[str, Any]]:
    """Fetches the latest reading for each of all rooms in the database."""
    with get_db_connection() as conn:
        cursor = conn.cursor()
        # Query distinct rooms and get their latest row
        cursor.execute("""
            SELECT r.id, r.room_id, r.timestamp, r.pm25, r.pm10, r.co2, r.temperature, r.humidity
            FROM readings r
            INNER JOIN (
                SELECT room_id, MAX(timestamp) as max_ts
                FROM readings
                GROUP BY room_id
            ) latest ON r.room_id = latest.room_id AND r.timestamp = latest.max_ts
            ORDER BY r.room_id ASC
        """)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]


def get_room_history(room_id: str, minutes: int = 60) -> List[Dict[str, Any]]:
    """Fetches historical readings for a specific room within the past `minutes` minutes."""
    cutoff_time = (datetime.now(timezone.utc) - timedelta(minutes=minutes)).isoformat()
    with get_db_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT id, room_id, timestamp, pm25, pm10, co2, temperature, humidity
            FROM readings
            WHERE room_id = ? AND timestamp >= ?
            ORDER BY timestamp ASC
        """, (room_id, cutoff_time))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
