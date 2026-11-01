"""
WHO and Indoor Air Quality Threshold Configuration and Evaluation Engine.
Provides threshold criteria for PM2.5, PM10, CO2, Temperature, and Humidity in ICU environments.
"""

from typing import Dict, Any, List

# Threshold configuration based on WHO Air Quality Guidelines & ASHRAE standards for medical/ICU spaces
THRESHOLDS = {
    "pm25": {
        "unit": "µg/m³",
        "safe_max": 15.0,     # WHO 24h limit: 15 µg/m³
        "warning_max": 35.0,  # Elevated particulate matter
    },
    "pm10": {
        "unit": "µg/m³",
        "safe_max": 45.0,     # WHO 24h limit: 45 µg/m³
        "warning_max": 75.0,
    },
    "co2": {
        "unit": "ppm",
        "safe_max": 800.0,    # Ideal indoor ventilation limit
        "warning_max": 1000.0,# Stale air / inadequate fresh air turnover
    },
    "temperature": {
        "unit": "°C",
        "safe_min": 20.0,     # ICU target thermal comfort range (20 - 24 °C)
        "safe_max": 24.0,
        "warning_min": 18.0,
        "warning_max": 25.5,
    },
    "humidity": {
        "unit": "%",
        "safe_min": 40.0,     # Optimal relative humidity range for infection control (40-55%)
        "safe_max": 55.0,
        "warning_min": 35.0,
        "warning_max": 60.0,
    }
}

STATUS_RANK = {
    "safe": 1,
    "warning": 2,
    "alert": 3
}

PARAM_MAP = {
    "pm25": "pm25",
    "pm25_ug_m3": "pm25",
    "pm10": "pm10",
    "pm10_ug_m3": "pm10",
    "co2": "co2",
    "co2_ppm": "co2",
    "temperature": "temperature",
    "temperature_c": "temperature",
    "humidity": "humidity",
    "relative_humidity_pct": "humidity",
}


def evaluate_metric(metric: str, value: float) -> str:
    """Evaluates a single parameter reading against defined WHO/ASHRAE thresholds."""
    norm_metric = PARAM_MAP.get(metric, metric)
    config = THRESHOLDS.get(norm_metric)
    if not config:
        return "safe"

    if norm_metric in ("pm25", "pm10", "co2"):
        if value <= config["safe_max"]:
            return "safe"
        elif value <= config["warning_max"]:
            return "warning"
        else:
            return "alert"

    elif norm_metric in ("temperature", "humidity"):
        if config["safe_min"] <= value <= config["safe_max"]:
            return "safe"
        elif config["warning_min"] <= value <= config["warning_max"]:
            return "warning"
        else:
            return "alert"

    return "safe"


def evaluate_room_status(reading: Dict[str, Any]) -> Dict[str, Any]:
    """
    Evaluates all parameters of a reading dict and returns an overall room status
    along with breakdown per parameter.
    """
    metrics = [
        ("pm25", ["pm25", "pm25_ug_m3"]),
        ("pm10", ["pm10", "pm10_ug_m3"]),
        ("co2", ["co2", "co2_ppm"]),
        ("temperature", ["temperature", "temperature_c"]),
        ("humidity", ["humidity", "relative_humidity_pct"]),
    ]

    breakdown = {}
    highest_status = "safe"

    for std_name, aliases in metrics:
        val = None
        for a in aliases:
            if a in reading and reading[a] is not None:
                try:
                    val = float(reading[a])
                    break
                except (ValueError, TypeError):
                    continue

        if val is not None:
            status = evaluate_metric(std_name, val)
            breakdown[std_name] = {
                "value": round(val, 2),
                "unit": THRESHOLDS[std_name]["unit"],
                "status": status,
                "threshold_safe": THRESHOLDS[std_name].get("safe_max", THRESHOLDS[std_name].get("safe_min")),
                "threshold_warning": THRESHOLDS[std_name].get("warning_max"),
            }
            if STATUS_RANK[status] > STATUS_RANK[highest_status]:
                highest_status = status

    return {
        "overall_status": highest_status,
        "breakdown": breakdown
    }
