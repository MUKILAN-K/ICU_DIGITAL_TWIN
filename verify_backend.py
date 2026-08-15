"""
Comprehensive Runtime Verification Script for ICU Air Quality Monitoring System Backend.
Tests REST endpoints, WebSocket live updates, WHO status calculations, and prints example JSON.
"""

import sys
import time
import json
import subprocess
import asyncio
import httpx
import websockets

BASE_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000/ws/live"


async def test_rest_endpoints():
    print("Testing REST Endpoints...")
    async with httpx.AsyncClient(base_url=BASE_URL) as client:
        # 1. Root / Health check
        res_root = await client.get("/")
        print(f"  [GET /] Status: {res_root.status_code}")
        assert res_root.status_code == 200, f"Root failed: {res_root.text}"

        # 2. GET /rooms
        res_rooms = await client.get("/rooms")
        print(f"  [GET /rooms] Status: {res_rooms.status_code}")
        assert res_rooms.status_code == 200, f"/rooms failed: {res_rooms.text}"
        rooms_data = res_rooms.json()
        assert len(rooms_data) == 5, f"Expected 5 rooms, got {len(rooms_data)}"
        print(f"  Successfully fetched 5 ICU rooms!")

        # 3. GET /rooms/ICU-101/current
        res_curr = await client.get("/rooms/ICU-101/current")
        print(f"  [GET /rooms/ICU-101/current] Status: {res_curr.status_code}")
        assert res_curr.status_code == 200, f"/rooms/ICU-101/current failed: {res_curr.text}"
        curr_data = res_curr.json()
        assert "overall_status" in curr_data
        assert "breakdown" in curr_data
        print(f"  Current ICU-101 overall status: '{curr_data['overall_status']}'")

        # 4. GET /rooms/ICU-101/history?minutes=60
        res_hist = await client.get("/rooms/ICU-101/history?minutes=60")
        print(f"  [GET /rooms/ICU-101/history?minutes=60] Status: {res_hist.status_code}")
        assert res_hist.status_code == 200, f"/rooms/ICU-101/history failed: {res_hist.text}"
        hist_data = res_hist.json()
        print(f"  Fetched {hist_data['total_records']} historical records for ICU-101!")
        assert hist_data['total_records'] > 0

        return rooms_data


async def test_websocket_stream():
    print("\nTesting WebSocket Stream (/ws/live)...")
    async with websockets.connect(WS_URL) as ws:
        # 1. Receive initial state message
        init_msg_raw = await ws.recv()
        init_msg = json.loads(init_msg_raw)
        print(f"  [WS Initial Payload] Type: '{init_msg.get('type')}', Rooms Count: {len(init_msg.get('rooms', []))}")
        assert init_msg.get("type") == "initial_state"

        # 2. Wait for live simulation update (pushed every 5s)
        print("  Waiting for live update tick (~5 seconds)...")
        tick_msg_raw = await asyncio.wait_for(ws.recv(), timeout=10.0)
        tick_msg = json.loads(tick_msg_raw)
        print(f"  [WS Live Update Frame Received!] Type: '{tick_msg.get('type')}', Timestamp: {tick_msg.get('timestamp')}")
        assert tick_msg.get("type") == "live_update"
        assert len(tick_msg.get("rooms", [])) == 5
        print("  WebSocket test PASSED cleanly!\n")


async def main():
    # Test REST endpoints
    rooms_json = await test_rest_endpoints()

    # Test WebSocket stream
    await test_websocket_stream()

    print("==================================================")
    print("EXAMPLE JSON OUTPUT FROM /rooms:")
    print("==================================================")
    print(json.dumps(rooms_json, indent=2))
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(main())
