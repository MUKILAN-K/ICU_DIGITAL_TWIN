"""
Predictive Analytics Module for ICU Environmental Monitoring.
Implements time-series forecasting for PM2.5, PM10, CO2, Temperature, and Humidity.
Provides both baseline (Persistence) and primary (Trend-Adjusted Exponential Smoothing) models,
with empirical MAE / RMSE evaluation on simulated historical ICU data.

DISCLAIMER:
All forecasted values and confidence bounds are generated through software simulation
and are intended solely for engineering digital-twin demonstrations, NOT for clinical diagnostic use.
"""

import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Optional, Tuple
import numpy as np

# Canonical room profile identifiers
CANONICAL_ROOMS = ["ICU-01", "ICU-02", "ICU-03", "ICU-04", "ICU-05"]

PARAM_NAMES = {
    "pm25": "pm25_ug_m3",
    "pm25_ug_m3": "pm25_ug_m3",
    "pm10": "pm10_ug_m3",
    "pm10_ug_m3": "pm10_ug_m3",
    "co2": "co2_ppm",
    "co2_ppm": "co2_ppm",
    "temperature": "temperature_c",
    "temperature_c": "temperature_c",
    "humidity": "relative_humidity_pct",
    "relative_humidity_pct": "relative_humidity_pct",
}

PARAM_UNITS = {
    "pm25_ug_m3": "µg/m³",
    "pm10_ug_m3": "µg/m³",
    "co2_ppm": "ppm",
    "temperature_c": "°C",
    "relative_humidity_pct": "%",
}


def normalize_param_key(param: str) -> str:
    cleaned = param.lower().strip()
    return PARAM_NAMES.get(cleaned, "pm25_ug_m3")


class BaselinePersistenceForecaster:
    """
    Baseline benchmark: Last Observation Carried Forward (Persistence).
    Assumes future values equal the most recent observation with expanding uncertainty.
    """
    model_name = "Persistence Baseline (LOCF)"

    @staticmethod
    def forecast(series: List[float], steps: int = 6) -> Tuple[List[float], List[Tuple[float, float]]]:
        if not series:
            return [0.0] * steps, [(0.0, 0.0)] * steps

        last_val = series[-1]
        std_err = float(np.std(series)) if len(series) > 1 else max(1.0, abs(last_val * 0.05))
        if std_err == 0:
            std_err = 0.5

        predictions = []
        bounds = []
        for i in range(1, steps + 1):
            pred = last_val
            # Uncertainty expands with horizon sqrt(step)
            margin = 1.96 * std_err * math.sqrt(i)
            predictions.append(round(pred, 2))
            bounds.append((round(max(0.0, pred - margin), 2), round(pred + margin, 2)))

        return predictions, bounds


class TrendAdjustedHoltForecaster:
    """
    Primary Model: Double Exponential Smoothing (Holt's Linear Trend with Damping).
    Captures recent trajectory and velocity of environmental shifts while damping out
    extreme runaway projections.
    """
    model_name = "Damped Holt Linear Trend Forecaster"

    def __init__(self, alpha: float = 0.45, beta: float = 0.25, phi: float = 0.85):
        self.alpha = alpha  # Level smoothing
        self.beta = beta    # Trend smoothing
        self.phi = phi      # Trend damping factor (prevents infinite linear explosion)

    def forecast(self, series: List[float], steps: int = 6) -> Tuple[List[float], List[Tuple[float, float]]]:
        if not series:
            return [0.0] * steps, [(0.0, 0.0)] * steps

        if len(series) < 3:
            return BaselinePersistenceForecaster.forecast(series, steps)

        # Initialize level and trend
        level = series[0]
        trend = series[1] - series[0]
        residuals = []

        for i in range(1, len(series)):
            y = series[i]
            prev_level = level
            level = self.alpha * y + (1 - self.alpha) * (prev_level + self.phi * trend)
            trend = self.beta * (level - prev_level) + (1 - self.beta) * (self.phi * trend)
            residual = y - (prev_level + self.phi * trend)
            residuals.append(residual)

        # Forecast steps
        residual_std = float(np.std(residuals)) if residuals else max(0.5, abs(level * 0.05))
        if residual_std == 0:
            residual_std = 0.5

        predictions = []
        bounds = []

        cumulative_phi = 0.0
        for m in range(1, steps + 1):
            cumulative_phi += (self.phi ** m)
            forecast_val = level + cumulative_phi * trend

            # Parameters cannot physically be negative
            forecast_val = max(0.0, forecast_val)
            # Confidence interval calculation (95% z=1.96)
            margin = 1.96 * residual_std * math.sqrt(1 + (m - 1) * 0.25)

            predictions.append(round(forecast_val, 2))
            bounds.append((
                round(max(0.0, forecast_val - margin), 2),
                round(forecast_val + margin, 2)
            ))

        return predictions, bounds


def evaluate_models_on_dataset(filepath: str = "DATASET/icu_room_simulation_synthetic.csv") -> Dict[str, Any]:
    """
    Evaluates forecasting quality on held-out simulated data from the dataset.
    Compares Baseline Persistence vs Damped Holt Trend model using MAE and RMSE.
    """
    import csv

    # Read records from CSV
    rows_by_room: Dict[str, List[Dict[str, float]]] = {}
    try:
        with open(filepath, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                r_id = row.get("room_id", "").replace("_", "-")
                if r_id not in rows_by_room:
                    rows_by_room[r_id] = []
                try:
                    rows_by_room[r_id].append({
                        "pm25_ug_m3": float(row.get("pm25_ug_m3", 0.0)),
                        "pm10_ug_m3": float(row.get("pm10_ug_m3", 0.0)),
                        "co2_ppm": float(row.get("co2_ppm", 0.0)),
                        "temperature_c": float(row.get("temperature_c", 0.0)),
                        "relative_humidity_pct": float(row.get("relative_humidity_pct", 0.0)),
                    })
                except (ValueError, TypeError):
                    continue
    except Exception as e:
        return {"error": f"Failed to load dataset: {str(e)}"}

    metrics_result = {}
    test_horizon_steps = 3  # 15 minutes ahead (3 x 5min steps)
    train_window = 24       # 2 hours lookback (24 x 5min steps)

    holt = TrendAdjustedHoltForecaster()

    for param in ["pm25_ug_m3", "pm10_ug_m3", "co2_ppm", "temperature_c", "relative_humidity_pct"]:
        baseline_errors = []
        holt_errors = []

        for r_id, records in rows_by_room.items():
            vals = [rec[param] for rec in records]
            if len(vals) < train_window + test_horizon_steps + 5:
                continue

            # Sliding backtest across test windows
            for start_idx in range(0, min(100, len(vals) - train_window - test_horizon_steps), 6):
                train_data = vals[start_idx : start_idx + train_window]
                actual_future = vals[start_idx + train_window : start_idx + train_window + test_horizon_steps]

                base_preds, _ = BaselinePersistenceForecaster.forecast(train_data, steps=test_horizon_steps)
                holt_preds, _ = holt.forecast(train_data, steps=test_horizon_steps)

                for act, bp, hp in zip(actual_future, base_preds, holt_preds):
                    baseline_errors.append(act - bp)
                    holt_errors.append(act - hp)

        if baseline_errors and holt_errors:
            b_arr = np.array(baseline_errors)
            h_arr = np.array(holt_errors)

            base_mae = float(np.mean(np.abs(b_arr)))
            base_rmse = float(np.sqrt(np.mean(b_arr ** 2)))
            holt_mae = float(np.mean(np.abs(h_arr)))
            holt_rmse = float(np.sqrt(np.mean(h_arr ** 2)))

            improvement_pct = max(0.0, ((base_mae - holt_mae) / base_mae) * 100) if base_mae > 0 else 0.0

            metrics_result[param] = {
                "unit": PARAM_UNITS[param],
                "baseline_persistence": {
                    "mae": round(base_mae, 3),
                    "rmse": round(base_rmse, 3),
                },
                "damped_holt_model": {
                    "mae": round(holt_mae, 3),
                    "rmse": round(holt_rmse, 3),
                },
                "mae_reduction_pct": round(improvement_pct, 2),
            }

    return {
        "status": "evaluated",
        "dataset": filepath,
        "test_horizon": "15 minutes ahead (3 steps @ 5m)",
        "train_window_size": f"{train_window} steps (120 minutes)",
        "sample_points_tested": len(baseline_errors) if 'baseline_errors' in locals() else 0,
        "parameter_metrics": metrics_result,
    }


def generate_room_forecast(
    room_id: str,
    history_records: List[Dict[str, Any]],
    parameter: str = "pm25_ug_m3",
    horizon_minutes: int = 30,
    step_minutes: int = 5,
    thresholds: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """
    Generates a timestamped environmental forecast for a specific ICU room and parameter.
    Includes historical baseline series, forecasted points, confidence bounds, and threshold breach risk.
    """
    norm_param = normalize_param_key(parameter)
    steps = max(1, min(24, horizon_minutes // step_minutes))

    # Extract historical values in chronological order
    # Accept both full param name or short name in input dict
    short_keys = {
        "pm25_ug_m3": "pm25",
        "pm10_ug_m3": "pm10",
        "co2_ppm": "co2",
        "temperature_c": "temperature",
        "relative_humidity_pct": "humidity",
    }
    short_key = short_keys.get(norm_param, "pm25")

    clean_series = []
    timestamps = []
    for r in history_records:
        val = r.get(norm_param)
        if val is None:
            val = r.get(short_key)
        if val is not None:
            try:
                clean_series.append(float(val))
                timestamps.append(r.get("timestamp", datetime.now(timezone.utc).isoformat()))
            except (ValueError, TypeError):
                continue

    if not clean_series:
        # Default mock baseline if empty history
        clean_series = [12.0, 12.5, 13.0, 12.8, 13.2]
        now = datetime.now(timezone.utc)
        timestamps = [(now - timedelta(minutes=i * 5)).isoformat() for i in range(len(clean_series), 0, -1)]

    # Generate forecasts from both primary and baseline
    forecaster = TrendAdjustedHoltForecaster()
    primary_preds, primary_bounds = forecaster.forecast(clean_series, steps=steps)
    base_preds, _ = BaselinePersistenceForecaster.forecast(clean_series, steps=steps)

    # Generate future timestamps
    last_ts_str = timestamps[-1] if timestamps else datetime.now(timezone.utc).isoformat()
    try:
        last_dt = datetime.fromisoformat(last_ts_str.replace("Z", "+00:00"))
    except Exception:
        last_dt = datetime.now(timezone.utc)

    forecast_points = []
    future_breach = False
    breach_time = None
    breach_value = None
    breach_level = "safe"

    # Default thresholds for evaluation if not supplied
    default_limits = {
        "pm25_ug_m3": {"safe_max": 15.0, "warning_max": 35.0},
        "pm10_ug_m3": {"safe_max": 45.0, "warning_max": 75.0},
        "co2_ppm": {"safe_max": 800.0, "warning_max": 1000.0},
        "temperature_c": {"safe_max": 24.0, "warning_max": 25.5},
        "relative_humidity_pct": {"safe_max": 55.0, "warning_max": 60.0},
    }
    param_thresh = (thresholds or {}).get(short_key, default_limits.get(norm_param, {"safe_max": 15.0, "warning_max": 35.0}))

    for step_i in range(steps):
        step_dt = last_dt + timedelta(minutes=(step_i + 1) * step_minutes)
        pred_val = primary_preds[step_i]
        b_low, b_high = primary_bounds[step_i]

        # Check threshold breach
        status = "safe"
        if pred_val > param_thresh.get("warning_max", 35.0):
            status = "alert"
            if not future_breach or breach_level != "alert":
                future_breach = True
                breach_time = step_dt.isoformat()
                breach_value = pred_val
                breach_level = "alert"
        elif pred_val > param_thresh.get("safe_max", 15.0):
            status = "warning"
            if not future_breach:
                future_breach = True
                breach_time = step_dt.isoformat()
                breach_value = pred_val
                breach_level = "warning"

        forecast_points.append({
            "step": step_i + 1,
            "horizon_minutes": (step_i + 1) * step_minutes,
            "timestamp": step_dt.isoformat(),
            "predicted_value": pred_val,
            "lower_bound_95": b_low,
            "upper_bound_95": b_high,
            "baseline_locf_value": base_preds[step_i],
            "projected_status": status,
        })

    # Pack last 15 historical points for overlay chart
    recent_history = []
    display_history_count = min(15, len(clean_series))
    for ts, val in zip(timestamps[-display_history_count:], clean_series[-display_history_count:]):
        recent_history.append({
            "timestamp": ts,
            "actual_value": round(val, 2),
        })

    return {
        "room_id": room_id,
        "parameter": norm_param,
        "unit": PARAM_UNITS.get(norm_param, ""),
        "model_used": forecaster.model_name,
        "baseline_model": BaselinePersistenceForecaster.model_name,
        "horizon_minutes": horizon_minutes,
        "step_interval_minutes": step_minutes,
        "last_observed_value": round(clean_series[-1], 2),
        "last_observed_timestamp": last_dt.isoformat(),
        "recent_history": recent_history,
        "forecast_series": forecast_points,
        "forecast_alert_risk": {
            "has_projected_breach": future_breach,
            "severity": breach_level,
            "projected_breach_time": breach_time,
            "projected_breach_value": breach_value,
            "configured_safe_limit": param_thresh.get("safe_max"),
            "configured_warning_limit": param_thresh.get("warning_max"),
        },
    }
