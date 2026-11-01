"""
Comprehensive Runtime Verification Script for ICU Digital Twin System Backend.
Tests REST endpoints, WebSocket live updates, WHO status calculations,
predictive analytics / forecasting, scenario injection, and alert handling.
"""

import sys
import time
import json
import asyncio
import httpx
import websockets

BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws/live"


async def test_backend_comprehensive():
    print("=" * 60)
    print("RUNNING COMPREHENSIVE ICU DIGITAL TWIN BACKEND VERIFICATION")
    print("=" * 60)

    async with httpx.AsyncClient(base_url=BASE_URL, timeout=15.0) as client:
        # 1. Health check
        res_root = await client.get("/")
        assert res_root.status_code == 200, f"Root failed: {res_root.text}"
        root_data = res_root.json()
        print(f"[PASS] [GET /] Status: {res_root.status_code} - Monitored: {root_data.get('rooms_monitored')}")

        # 2. GET /rooms
        res_rooms = await client.get("/rooms")
        assert res_rooms.status_code == 200, f"/rooms failed: {res_rooms.text}"
        rooms_data = res_rooms.json()
        assert len(rooms_data) == 5, f"Expected 5 rooms, got {len(rooms_data)}"
        room_ids = [r["room_id"] for r in rooms_data]
        print(f"[PASS] [GET /rooms] Successfully fetched 5 canonical rooms: {room_ids}")

        # 3. GET /rooms/ICU-03/current
        res_curr = await client.get("/rooms/ICU-03/current")
        assert res_curr.status_code == 200, f"/rooms/ICU-03/current failed: {res_curr.text}"
        curr_data = res_curr.json()
        assert "overall_status" in curr_data and "breakdown" in curr_data
        print(f"[PASS] [GET /rooms/ICU-03/current] Room {curr_data['room_id']}: Status '{curr_data['overall_status']}'")

        # 4. Test alias backward compatibility (ICU-103 -> ICU-03)
        res_alias = await client.get("/rooms/ICU-103/current")
        assert res_alias.status_code == 200
        assert res_alias.json()["room_id"] == "ICU-03"
        print(f"[PASS] [Alias resolution] 'ICU-103' resolved smoothly to '{res_alias.json()['room_id']}'")

        # 5. Invalid room ID error handling
        res_invalid = await client.get("/rooms/ICU-99/current")
        assert res_invalid.status_code == 404
        print(f"[PASS] [Error handling] Invalid room query returned expected HTTP 404")

        # 6. GET /rooms/ICU-03/history
        res_hist = await client.get("/rooms/ICU-03/history?minutes=60")
        assert res_hist.status_code == 200
        hist_data = res_hist.json()
        print(f"[PASS] [GET /rooms/ICU-03/history] Fetched {hist_data['total_records']} records for 60m window")

        # 7. Predictive Analytics: GET /rooms/ICU-03/forecast
        res_fc = await client.get("/rooms/ICU-03/forecast?parameter=pm25_ug_m3&horizon_minutes=30")
        assert res_fc.status_code == 200
        fc_data = res_fc.json()
        assert len(fc_data["forecast_series"]) == 6
        print(f"[PASS] [GET /rooms/ICU-03/forecast] Model '{fc_data['model_used']}' produced 30-min forecast series")

        # 8. Forecast Evaluation on held-out dataset
        res_eval = await client.get("/forecast/evaluate")
        assert res_eval.status_code == 200
        eval_data = res_eval.json()
        pm25_eval = eval_data["parameter_metrics"]["pm25_ug_m3"]
        print(f"[PASS] [GET /forecast/evaluate] Dataset evaluation: Baseline MAE={pm25_eval['baseline_persistence']['mae']} vs Holt MAE={pm25_eval['damped_holt_model']['mae']}")

        # 9. Simulation Scenario Control
        res_scen = await client.post("/simulation/scenario", json={
            "scenario": "room_disturbance",
            "room_id": "ICU-03",
            "magnitude": 1.5,
        })
        assert res_scen.status_code == 200
        print(f"[PASS] [POST /simulation/scenario] Scenario 'room_disturbance' triggered successfully")

        # 10. Alerts retrieval
        res_alerts = await client.get("/alerts")
        assert res_alerts.status_code == 200
        alerts_data = res_alerts.json()
        print(f"[PASS] [GET /alerts] Total logged environmental alerts: {alerts_data['total_alerts']}")

    # 11. WebSocket live stream verification
    print("\nTesting WebSocket Live Stream...")
    async with websockets.connect(WS_URL) as ws:
        msg_init = await asyncio.wait_for(ws.recv(), timeout=5.0)
        data_init = json.loads(msg_init)
        assert data_init.get("type") == "initial_state"
        assert len(data_init.get("rooms", [])) == 5
        print(f"[PASS] [WS Initial State] Received payload for 5 rooms")

        # Wait for next live broadcast tick (~5s)
        msg_live = await asyncio.wait_for(ws.recv(), timeout=10.0)
        data_live = json.loads(msg_live)
        assert data_live.get("type") == "live_update"
        print(f"[PASS] [WS Live Broadcast] Received live telemetry broadcast frame!")

    print("\n" + "=" * 60)
    print("ALL BACKEND VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_backend_comprehensive())
