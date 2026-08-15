# ICU Air Quality Digital Twin

An interactive digital twin simulating real-time air quality monitoring across 5 ICU rooms in a hospital facility, built for an EVS course project.

## Overview

This system models indoor air quality (PM2.5, PM10, CO₂, temperature, humidity) across 5 ICU rooms, evaluates readings against WHO safety thresholds, and visualizes the facility through a navigable 3D digital twin — from hospital exterior, through the lobby, into the ICU floor, and down to individual room interiors.

## Features

- Simulated live sensor data per room, following realistic diurnal/occupancy patterns
- FastAPI backend with REST + WebSocket endpoints for live data
- Real-time dashboard with per-room status (safe / warning / alert)
- 3D navigable digital twin (Three.js): exterior → lobby → ICU floor → individual rooms
- Automatic threshold-based alerting tied to WHO indoor air quality guidelines

## Tech Stack

- **Backend:** Python, FastAPI, SQLite
- **Frontend:** React, Three.js, Chart.js
- **Data:** Simulated sensor streams (see `/simulator`)

## Getting Started

```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Project Structure

```
/backend      - FastAPI app, simulator, database
/frontend     - React dashboard + Three.js digital twin
/docs         - Report, abstract, and reference material
```

## Team

Built by [add your team's names here] for the Environmental Studies (EVS) course project.

## References

Air quality thresholds based on WHO Global Air Quality Guidelines.

## Status

🚧 In active development — see [Issues](../../issues) for current work.
